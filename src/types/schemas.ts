import { z } from 'zod';

export const FlightInputSchema = z.object({
  flight: z.string().optional(),
  callsign: z.string().optional(),
  date: z.string().optional(),
  airport: z.string().optional(),
});

export const StandReportSchema = z.object({
  airportId: z.string().min(3).max(4),
  standName: z.string().min(1),
  flightIdentifier: z.string().optional(),
  timestamp: z.string().datetime(),
  reporterId: z.string().optional(),
  notes: z.string().optional(),
});

export const AirportQuerySchema = z.object({
  icao: z.string().min(4).max(4).optional(),
  iata: z.string().min(3).max(3).optional(),
  search: z.string().optional(),
});

export type FlightInputDTO = z.infer<typeof FlightInputSchema>;
export type StandReportDTO = z.infer<typeof StandReportSchema>;
export type AirportQueryDTO = z.infer<typeof AirportQuerySchema>;
