import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { StandResolutionEngine } from '../services/stand-resolution.service.js';
import { FlightInputSchema, AirportQuerySchema, StandReportSchema } from '../types/schemas.js';
import { logger } from '../utils/logger.js';

export async function standRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  const standEngine = new StandResolutionEngine(prisma);

  // GET /api/stand - Main stand resolution endpoint
  fastify.get('/api/stand', async (request, reply) => {
    try {
      const query = FlightInputSchema.parse(request.query);

      if (!query.flight && !query.callsign) {
        return reply.code(400).send({
          error: 'Either flight or callsign parameter required',
        });
      }

      const resolution = await standEngine.resolveStand({
        flightNumber: query.flight,
        callsign: query.callsign,
        date: query.date ? new Date(query.date) : undefined,
        airport: query.airport,
      });

      return reply.send({
        flight: query.flight || query.callsign,
        airport: query.airport,
        stand: resolution.stand,
        confidence: resolution.confidence,
        fallbackStage: resolution.fallbackStage,
        fallbackStageName: resolution.fallbackStageName,
        sources: resolution.dataSources,
        terminal: resolution.terminal,
        timestamp: resolution.timestamp,
        metadata: resolution.metadata,
      });
    } catch (error) {
      logger.error({ error }, 'Stand resolution error');
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // GET /api/airport/:icao/stands - Get all stands for an airport
  fastify.get('/api/airport/:icao/stands', async (request, reply) => {
    try {
      const { icao } = request.params as { icao: string };

      const stands = await prisma.stand.findMany({
        where: {
          airportId: icao.toUpperCase(),
          isActive: true,
        },
        orderBy: [{ terminal: 'asc' }, { standName: 'asc' }],
      });

      const airport = await prisma.airport.findUnique({
        where: { id: icao.toUpperCase() },
      });

      return reply.send({
        airport: {
          icao: airport?.id,
          iata: airport?.iata,
          name: airport?.name,
        },
        stands: stands.map((s) => ({
          name: s.standName,
          terminal: s.terminal,
          maxWingspanM: s.maxWingspanM,
          maxLengthM: s.maxLengthM,
          aircraftSizeCode: s.aircraftSizeCode,
          latitude: s.latitude,
          longitude: s.longitude,
          airlinePreference: s.airlinePreference,
        })),
        total: stands.length,
      });
    } catch (error) {
      logger.error({ error }, 'Get stands error');
      return reply.code(500).send({
        error: 'Failed to retrieve stands',
      });
    }
  });

  // GET /api/airports - Search airports
  fastify.get('/api/airports', async (request, reply) => {
    try {
      const query = AirportQuerySchema.parse(request.query);

      let where = {};

      if (query.icao) {
        where = { id: query.icao.toUpperCase() };
      } else if (query.iata) {
        where = { iata: query.iata.toUpperCase() };
      } else if (query.search) {
        where = {
          OR: [
            { id: { contains: query.search.toUpperCase() } },
            { iata: { contains: query.search.toUpperCase() } },
            { name: { contains: query.search } },
            { city: { contains: query.search } },
          ],
        };
      }

      const airports = await prisma.airport.findMany({
        where,
        take: 50,
        orderBy: { name: 'asc' },
      });

      return reply.send({
        airports: airports.map((a) => ({
          icao: a.id,
          iata: a.iata,
          name: a.name,
          city: a.city,
          country: a.country,
        })),
        total: airports.length,
      });
    } catch (error) {
      logger.error({ error }, 'Search airports error');
      return reply.code(500).send({
        error: 'Failed to search airports',
      });
    }
  });

  // POST /api/crowdsource/stand-report - Submit crowdsourced stand report
  fastify.post('/api/crowdsource/stand-report', async (request, reply) => {
    try {
      const data = StandReportSchema.parse(request.body);

      const report = await prisma.crowdsourcedReport.create({
        data: {
          airportId: data.airportId,
          standName: data.standName,
          flightIdentifier: data.flightIdentifier,
          timestamp: new Date(data.timestamp),
          reporterId: data.reporterId,
          notes: data.notes,
          moderationStatus: 'pending',
        },
      });

      return reply.code(201).send({
        id: report.id,
        status: 'pending',
        message: 'Thank you for your contribution! Report is pending moderation.',
      });
    } catch (error) {
      logger.error({ error }, 'Crowdsource report error');
      return reply.code(400).send({
        error: 'Invalid report data',
      });
    }
  });

  // GET /api/crowdsource/reports/:airportId - Get crowdsourced reports for airport
  fastify.get('/api/crowdsource/reports/:airportId', async (request, reply) => {
    try {
      const { airportId } = request.params as { airportId: string };

      const reports = await prisma.crowdsourcedReport.findMany({
        where: {
          airportId: airportId.toUpperCase(),
          moderationStatus: 'approved',
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100,
      });

      return reply.send({
        airportId: airportId.toUpperCase(),
        reports: reports.map((r) => ({
          id: r.id,
          standName: r.standName,
          flightIdentifier: r.flightIdentifier,
          timestamp: r.timestamp,
          confidenceScore: r.confidenceScore,
          verified: r.verified,
        })),
        total: reports.length,
      });
    } catch (error) {
      logger.error({ error }, 'Get reports error');
      return reply.code(500).send({
        error: 'Failed to retrieve reports',
      });
    }
  });

  // GET /api/health - Health check
  fastify.get('/api/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
    });
  });
}
