import { PrismaClient } from '@prisma/client';
import {
  FlightInput,
  NormalizedFlight,
  StandResolution,
  StandCandidate,
  FallbackStage,
  FallbackStageNames,
} from '../types/index.js';
import { dataSourceManager } from '../adapters/sources/index.js';
import { cacheService } from './cache.service.js';
import { logger } from '../utils/logger.js';
import {
  normalizeFlightNumber,
  calculateDistance,
  matchesAircraftSize,
} from '../utils/flight-utils.js';
import { config } from '../config.js';

export class StandResolutionEngine {
  constructor(private prisma: PrismaClient) {}

  async resolveStand(input: FlightInput): Promise<StandResolution> {
    logger.info({ input }, 'Resolving stand for flight');

    // Step 1: Normalize flight input
    const normalized = await this.normalizeInput(input);
    logger.debug({ normalized }, 'Normalized flight input');

    // Step 2: Check cache
    const cacheKey = this.getCacheKey(normalized);
    const cached = await cacheService.get<StandResolution>(cacheKey);
    if (cached) {
      logger.info('Returning cached stand resolution');
      return cached;
    }

    // Step 3: Try fallback stages
    let resolution = await this.tryHistoricalPosition(normalized);
    if (resolution) {
      await this.cacheResult(cacheKey, resolution, normalized);
      return resolution;
    }

    resolution = await this.tryAirlinePattern(normalized);
    if (resolution) {
      await this.cacheResult(cacheKey, resolution, normalized);
      return resolution;
    }

    resolution = await this.tryTerminalAssignment(normalized);
    if (resolution) {
      await this.cacheResult(cacheKey, resolution, normalized);
      return resolution;
    }

    resolution = await this.tryAircraftSize(normalized);
    if (resolution) {
      await this.cacheResult(cacheKey, resolution, normalized);
      return resolution;
    }

    // No stand found
    throw new Error('Unable to resolve stand for flight');
  }

  private async normalizeInput(input: FlightInput): Promise<NormalizedFlight> {
    const identifier = input.flightNumber || input.callsign;
    if (!identifier) {
      throw new Error('Flight number or callsign required');
    }

    const parsed = normalizeFlightNumber(identifier);

    // Try to get more info from data sources
    const adapters = dataSourceManager.getAdapters();
    let flightData = null;

    for (const adapter of adapters) {
      try {
        flightData = await adapter.getFlightInfo(input);
        if (flightData) break;
      } catch (error) {
        logger.warn({ adapter: adapter.name, error }, 'Adapter failed');
      }
    }

    return {
      callsign: parsed.callsign || flightData?.callsign || identifier,
      flightNumber: parsed.flightNumber || flightData?.flightNumber || identifier,
      airlineIcao: parsed.airlineIcao || '',
      airlineIata: parsed.airlineIata,
      departureAirport: flightData?.origin,
      arrivalAirport: input.airport || flightData?.destination || '',
      aircraftType: flightData?.aircraftType,
      scheduledArrival: flightData?.scheduledArrival || input.date,
    };
  }

  private async tryHistoricalPosition(
    flight: NormalizedFlight
  ): Promise<StandResolution | null> {
    logger.debug('Trying Stage 1: Historical Position');

    const timestamp = flight.scheduledArrival || new Date();
    const adapters = dataSourceManager.getAdapters();

    for (const adapter of adapters) {
      try {
        const position = await adapter.getHistoricalPosition(
          flight.callsign,
          flight.arrivalAirport,
          timestamp
        );

        if (position && position.onGround) {
          // Find nearest stand
          const stands = await this.prisma.stand.findMany({
            where: {
              airportId: flight.arrivalAirport,
              isActive: true,
              latitude: { not: null },
              longitude: { not: null },
            },
          });

          const candidates: StandCandidate[] = stands
            .filter((s) => s.latitude !== null && s.longitude !== null)
            .map((stand) => {
              const distance = calculateDistance(
                position.latitude,
                position.longitude,
                stand.latitude!,
                stand.longitude!
              );

              return {
                standName: stand.standName,
                confidence: this.calculatePositionConfidence(distance),
                reason: `${distance.toFixed(0)}m from last known position`,
                distance,
                terminal: stand.terminal || undefined,
              };
            })
            .filter((c) => c.distance < 200); // Within 200m

          if (candidates.length > 0) {
            candidates.sort((a, b) => b.confidence - a.confidence);
            const best = candidates[0];

            return {
              stand: best.standName,
              confidence: best.confidence,
              fallbackStage: FallbackStage.HISTORICAL_POSITION,
              fallbackStageName: FallbackStageNames[FallbackStage.HISTORICAL_POSITION],
              dataSources: [adapter.name],
              terminal: best.terminal,
              timestamp: new Date(),
              metadata: { distance: best.distance },
            };
          }
        }
      } catch (error) {
        logger.warn({ adapter: adapter.name, error }, 'Position lookup failed');
      }
    }

    return null;
  }

  private async tryAirlinePattern(flight: NormalizedFlight): Promise<StandResolution | null> {
    logger.debug('Trying Stage 2: Airline Pattern');

    const patterns = await this.prisma.airlineStandPattern.findMany({
      where: {
        airportId: flight.arrivalAirport,
        airlineIcao: flight.airlineIcao,
      },
      orderBy: {
        probabilityScore: 'desc',
      },
      take: 3,
    });

    if (patterns.length > 0) {
      const best = patterns[0];
      return {
        stand: best.standName,
        confidence: best.probabilityScore,
        fallbackStage: FallbackStage.AIRLINE_PATTERN,
        fallbackStageName: FallbackStageNames[FallbackStage.AIRLINE_PATTERN],
        dataSources: ['database'],
        timestamp: new Date(),
        metadata: { usageCount: best.usageCount, lastSeen: best.lastSeen },
      };
    }

    return null;
  }

  private async tryTerminalAssignment(flight: NormalizedFlight): Promise<StandResolution | null> {
    logger.debug('Trying Stage 3: Terminal Assignment');

    const assignment = await this.prisma.airlineTerminalAssignment.findFirst({
      where: {
        airportId: flight.arrivalAirport,
        airlineIcao: flight.airlineIcao,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    if (assignment) {
      // Find a suitable stand in that terminal
      const stands = await this.prisma.stand.findMany({
        where: {
          airportId: flight.arrivalAirport,
          terminal: assignment.terminal,
          isActive: true,
        },
      });

      if (stands.length > 0) {
        // Prefer stands with airline preference
        const preferred = stands.find((s) => s.airlinePreference === flight.airlineIcao);
        const selected = preferred || stands[0];

        return {
          stand: selected.standName,
          confidence: 0.7,
          fallbackStage: FallbackStage.TERMINAL_ASSIGNMENT,
          fallbackStageName: FallbackStageNames[FallbackStage.TERMINAL_ASSIGNMENT],
          dataSources: ['database'],
          terminal: assignment.terminal,
          timestamp: new Date(),
        };
      }
    }

    return null;
  }

  private async tryAircraftSize(flight: NormalizedFlight): Promise<StandResolution | null> {
    logger.debug('Trying Stage 4: Aircraft Size');

    // Get aircraft info
    let aircraftWingspan = 0;

    if (flight.aircraftType) {
      const aircraft = await this.prisma.aircraft.findFirst({
        where: { icaoType: flight.aircraftType },
      });

      if (aircraft?.wingspanM) {
        aircraftWingspan = aircraft.wingspanM;
      }
    }

    // Find suitable stands
    const stands = await this.prisma.stand.findMany({
      where: {
        airportId: flight.arrivalAirport,
        isActive: true,
      },
    });

    const suitable = stands.filter((stand) =>
      matchesAircraftSize(aircraftWingspan, stand.maxWingspanM || undefined)
    );

    if (suitable.length > 0) {
      // Prefer stands closer to terminal 1 or main apron
      const selected = suitable[0];

      return {
        stand: selected.standName,
        confidence: 0.5,
        fallbackStage: FallbackStage.AIRCRAFT_SIZE,
        fallbackStageName: FallbackStageNames[FallbackStage.AIRCRAFT_SIZE],
        dataSources: ['database'],
        terminal: selected.terminal || undefined,
        timestamp: new Date(),
      };
    }

    return null;
  }

  private calculatePositionConfidence(distance: number): number {
    // 0-50m = 0.95, 50-100m = 0.8, 100-150m = 0.6, 150-200m = 0.4
    if (distance < 50) return 0.95;
    if (distance < 100) return 0.8;
    if (distance < 150) return 0.6;
    return 0.4;
  }

  private getCacheKey(flight: NormalizedFlight): string {
    return `stand:${flight.flightNumber}:${flight.arrivalAirport}:${flight.scheduledArrival?.toISOString().split('T')[0] || 'today'}`;
  }

  private async cacheResult(
    cacheKey: string,
    resolution: StandResolution,
    flight: NormalizedFlight
  ): Promise<void> {
    await cacheService.set(cacheKey, resolution, config.flightCacheTtlSeconds);

    // Also store in database
    await this.prisma.flightCache.create({
      data: {
        flightIdentifier: flight.flightNumber,
        airportId: flight.arrivalAirport,
        arrivalTimestamp: flight.scheduledArrival || new Date(),
        resolvedStand: resolution.stand,
        confidence: resolution.confidence,
        fallbackLevel: resolution.fallbackStage,
        dataSources: JSON.stringify(resolution.dataSources),
        rawDataJson: JSON.stringify(resolution.metadata),
        expiresAt: new Date(Date.now() + config.flightCacheTtlSeconds * 1000),
      },
    });
  }
}
