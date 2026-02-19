import {
  DataSourceAdapter,
  FlightInput,
  FlightData,
  PositionData,
} from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class OpenSkyAdapter implements DataSourceAdapter {
  name = 'OpenSky Network';
  private baseUrl = 'https://opensky-network.org/api';
  private username?: string;
  private password?: string;

  constructor(username?: string, password?: string) {
    this.username = username;
    this.password = password;
  }

  private async fetch<T>(endpoint: string): Promise<T | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.username && this.password) {
        const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        headers.Authorization = `Basic ${auth}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

      if (!response.ok) {
        logger.warn(`OpenSky API error: ${response.status} ${response.statusText}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      logger.error({ error }, 'OpenSky fetch error');
      return null;
    }
  }

  async getFlightInfo(flight: FlightInput): Promise<FlightData | null> {
    const callsign = flight.callsign?.trim().toUpperCase();
    if (!callsign) return null;

    const data = await this.fetch<OpenSkyAllStatesResponse>(
      `/states/all?icao24=${callsign.toLowerCase()}`
    );

    if (!data || !data.states || data.states.length === 0) {
      return null;
    }

    const state = data.states[0];
    return {
      callsign: state[1]?.trim() || callsign,
      origin: state[2],
      aircraftType: undefined, // OpenSky doesn't provide this in basic API
      registration: state[0],
    };
  }

  async getHistoricalPosition(
    callsign: string,
    _airport: string,
    timestamp: Date
  ): Promise<PositionData | null> {
    // OpenSky historical data requires authentication and specific time windows
    const begin = Math.floor(timestamp.getTime() / 1000) - 600; // 10 min before

    const data = await this.fetch<OpenSkyTrackResponse>(
      `/tracks/all?icao24=${callsign.toLowerCase()}&time=${begin}`
    );

    if (!data || !data.path || data.path.length === 0) {
      return null;
    }

    // Find position closest to landing (lowest altitude on ground)
    const groundPositions = data.path.filter((p) => p[4] === true && p[3] !== null);

    if (groundPositions.length === 0) {
      return null;
    }

    // Get last ground position (most likely parking position)
    const lastPos = groundPositions[groundPositions.length - 1];

    return {
      latitude: lastPos[1],
      longitude: lastPos[2],
      altitude: lastPos[3],
      timestamp: new Date(lastPos[0] * 1000),
      onGround: lastPos[4],
      heading: lastPos[5],
    };
  }
}

interface OpenSkyAllStatesResponse {
  time: number;
  states: Array<
    [
      string, // icao24
      string, // callsign
      string, // origin_country
      number, // time_position
      number, // last_contact
      number, // longitude
      number, // latitude
      number, // baro_altitude
      boolean, // on_ground
      number, // velocity
      number, // true_track
      number, // vertical_rate
      number[], // sensors
      number, // geo_altitude
      string, // squawk
      boolean, // spi
      number // position_source
    ]
  >;
}

interface OpenSkyTrackResponse {
  icao24: string;
  startTime: number;
  endTime: number;
  callsign: string;
  path: Array<
    [
      number, // time
      number, // latitude
      number, // longitude
      number, // altitude
      boolean, // on_ground
      number // heading
    ]
  >;
}
