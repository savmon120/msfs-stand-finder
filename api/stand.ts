import { PrismaClient } from '@prisma/client';
import { StandResolutionEngine } from '../src/services/stand-resolution.service';
import { FlightInputSchema } from '../src/types/schemas';

const prisma = new PrismaClient();
const standEngine = new StandResolutionEngine(prisma);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { flight, callsign, date, airport } = req.query;

    if (!flight && !callsign) {
      return res.status(400).json({
        error: 'Either flight or callsign parameter required',
      });
    }

    const flightInput = {
      flightNumber: flight as string | undefined,
      callsign: callsign as string | undefined,
      date: date ? new Date(date as string) : undefined,
      airport: airport as string | undefined,
    };

    const resolution = await standEngine.resolveStand(flightInput);

    return res.status(200).json({
      flight: flight || callsign,
      airport: resolution.metadata?.airport || airport,
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
    console.error('Stand resolution error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
