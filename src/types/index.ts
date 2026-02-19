export interface FlightInput {
  flightNumber?: string; // e.g., "BA1489"
  callsign?: string; // e.g., "BAW1489"
  date?: Date;
  airport?: string; // ICAO or IATA
}

export interface NormalizedFlight {
  callsign: string;
  flightNumber: string;
  airlineIcao: string;
  airlineIata?: string;
  departureAirport?: string;
  arrivalAirport: string;
  aircraftType?: string;
  scheduledArrival?: Date;
}

export interface StandResolution {
  stand: string;
  confidence: number; // 0.0 to 1.0
  fallbackStage: number; // 1-4
  fallbackStageName: string;
  dataSources: string[];
  terminal?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DataSourceAdapter {
  name: string;
  getFlightInfo(flight: FlightInput): Promise<FlightData | null>;
  getHistoricalPosition(
    callsign: string,
    airport: string,
    timestamp: Date
  ): Promise<PositionData | null>;
}

export interface FlightData {
  callsign: string;
  flightNumber?: string;
  origin?: string;
  destination?: string;
  aircraftType?: string;
  registration?: string;
  scheduledArrival?: Date;
  actualArrival?: Date;
  status?: string;
}

export interface PositionData {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: Date;
  onGround: boolean;
  heading?: number;
  speed?: number;
}

export interface StandCandidate {
  standName: string;
  confidence: number;
  reason: string;
  distance?: number; // meters from position
  terminal?: string;
}

export interface AirportStand {
  standName: string;
  terminal?: string;
  latitude?: number;
  longitude?: number;
  maxWingspanM?: number;
  maxLengthM?: number;
  aircraftSizeCode?: string;
  airlinePreference?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

export enum FallbackStage {
  HISTORICAL_POSITION = 1,
  AIRLINE_PATTERN = 2,
  TERMINAL_ASSIGNMENT = 3,
  AIRCRAFT_SIZE = 4,
}

export const FallbackStageNames: Record<FallbackStage, string> = {
  [FallbackStage.HISTORICAL_POSITION]: 'Historical ADS-B Position',
  [FallbackStage.AIRLINE_PATTERN]: 'Airline Stand Pattern',
  [FallbackStage.TERMINAL_ASSIGNMENT]: 'Terminal Assignment',
  [FallbackStage.AIRCRAFT_SIZE]: 'Aircraft Size Compatibility',
};

export interface Config {
  port: number;
  host: string;
  databaseUrl: string;
  redisUrl?: string;
  useRedis: boolean;
  cacheTtlSeconds: number;
  flightCacheTtlSeconds: number;
  logLevel: string;
  logPretty: boolean;
  corsOrigin: string;
  rateLimitMax: number;
  rateLimitTimeWindow: number;
  apiKeys: {
    adsbexchange?: string;
    aviationstack?: string;
    openskyUsername?: string;
    openskyPassword?: string;
  };
}
