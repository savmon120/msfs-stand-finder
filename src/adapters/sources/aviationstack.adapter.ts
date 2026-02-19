import {
  DataSourceAdapter,
  FlightInput,
  FlightData,
  PositionData,
} from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class AviationStackAdapter implements DataSourceAdapter {
  name = 'AviationStack';
  private baseUrl = 'http://api.aviationstack.com/v1';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
    if (!this.apiKey) {
      logger.warn('AviationStack API key not configured');
      return null;
    }

    try {
      const queryParams = new URLSearchParams({
        access_key: this.apiKey,
        ...params,
      });

      const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`);

      if (!response.ok) {
        logger.warn(`AviationStack API error: ${response.status}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      logger.error({ error }, 'AviationStack fetch error');
      return null;
    }
  }

  async getFlightInfo(flight: FlightInput): Promise<FlightData | null> {
    const flightNumber = flight.flightNumber || flight.callsign;
    if (!flightNumber) return null;

    const params: Record<string, string> = {
      flight_iata: flightNumber,
    };

    if (flight.date) {
      params.flight_date = flight.date.toISOString().split('T')[0];
    }

    const data = await this.fetch<AviationStackResponse>('/flights', params);

    if (!data || !data.data || data.data.length === 0) {
      return null;
    }

    const flightData = data.data[0];
    return {
      callsign: flightData.flight.icao || flightData.flight.iata,
      flightNumber: flightData.flight.iata,
      origin: flightData.departure.iata,
      destination: flightData.arrival.iata,
      aircraftType: flightData.aircraft?.iata,
      registration: flightData.aircraft?.registration,
      scheduledArrival: flightData.arrival.scheduled
        ? new Date(flightData.arrival.scheduled)
        : undefined,
      actualArrival: flightData.arrival.actual ? new Date(flightData.arrival.actual) : undefined,
      status: flightData.flight_status,
    };
  }

  async getHistoricalPosition(
    _callsign: string,
    _airport: string,
    _timestamp: Date
  ): Promise<PositionData | null> {
    // AviationStack doesn't provide detailed position tracking
    logger.info('Position tracking not available in AviationStack');
    return null;
  }
}

interface AviationStackResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: Array<{
    flight_date: string;
    flight_status: string;
    departure: {
      airport: string;
      timezone: string;
      iata: string;
      icao: string;
      terminal?: string;
      gate?: string;
      delay?: number;
      scheduled: string;
      estimated?: string;
      actual?: string;
      estimated_runway?: string;
      actual_runway?: string;
    };
    arrival: {
      airport: string;
      timezone: string;
      iata: string;
      icao: string;
      terminal?: string;
      gate?: string;
      baggage?: string;
      delay?: number;
      scheduled: string;
      estimated?: string;
      actual?: string;
      estimated_runway?: string;
      actual_runway?: string;
    };
    airline: {
      name: string;
      iata: string;
      icao: string;
    };
    flight: {
      number: string;
      iata: string;
      icao: string;
      codeshared?: {
        airline_name: string;
        airline_iata: string;
        airline_icao: string;
        flight_number: string;
        flight_iata: string;
        flight_icao: string;
      };
    };
    aircraft?: {
      registration: string;
      iata: string;
      icao: string;
      icao24: string;
    };
    live?: {
      updated: string;
      latitude: number;
      longitude: number;
      altitude: number;
      direction: number;
      speed_horizontal: number;
      speed_vertical: number;
      is_ground: boolean;
    };
  }>;
}
