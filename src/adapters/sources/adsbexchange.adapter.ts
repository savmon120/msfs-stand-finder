import {
  DataSourceAdapter,
  FlightInput,
  FlightData,
  PositionData,
} from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class ADSBExchangeAdapter implements DataSourceAdapter {
  name = 'ADS-B Exchange';
  private baseUrl = 'https://adsbexchange-com1.p.rapidapi.com/v2';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string): Promise<T | null> {
    if (!this.apiKey) {
      logger.warn('ADS-B Exchange API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com',
        },
      });

      if (!response.ok) {
        logger.warn(`ADS-B Exchange API error: ${response.status}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      logger.error({ error }, 'ADS-B Exchange fetch error');
      return null;
    }
  }

  async getFlightInfo(flight: FlightInput): Promise<FlightData | null> {
    const callsign = flight.callsign?.trim().toUpperCase();
    if (!callsign) return null;

    const data = await this.fetch<ADSBResponse>(`/callsign/${callsign}/`);

    if (!data || !data.ac || data.ac.length === 0) {
      return null;
    }

    const aircraft = data.ac[0];
    return {
      callsign: aircraft.flight?.trim() || callsign,
      aircraftType: aircraft.t,
      registration: aircraft.r,
    };
  }

  async getHistoricalPosition(
    _callsign: string,
    _airport: string,
    _timestamp: Date
  ): Promise<PositionData | null> {
    // ADS-B Exchange historical requires paid tier
    logger.info('Historical position lookup not available in free tier');
    return null;
  }
}

interface ADSBResponse {
  ac: Array<{
    flight?: string; // callsign
    r?: string; // registration
    t?: string; // aircraft type
    lat?: number;
    lon?: number;
    alt_baro?: number;
    alt_geom?: number;
    gs?: number; // ground speed
    track?: number; // heading
    baro_rate?: number;
    geom_rate?: number;
    category?: string;
    nav_altitude_mcp?: number;
    nav_heading?: number;
    seen?: number;
    seen_pos?: number;
  }>;
  total: number;
  ctime: number;
  ptime: number;
}
