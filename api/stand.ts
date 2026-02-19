import { PrismaClient } from '@prisma/client';
import { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { flight, airport: airportIcao } = req.query;

    if (!flight) {
      return res.status(400).json({ error: 'Flight parameter required' });
    }

    const flightStr = String(flight).toUpperCase();
    const airlineMatch = flightStr.match(/^([A-Z]{2,3})/);
    const airlineCode = airlineMatch ? airlineMatch[1] : null;

    let airport;
    if (airportIcao) {
      airport = await prisma.airport.findUnique({
        where: { id: String(airportIcao).toUpperCase() },
      });
    } else {
      airport = await prisma.airport.findUnique({ where: { id: 'EGLL' } });
    }

    if (!airport) {
      return res.status(404).json({ error: 'Airport not found' });
    }

    let terminal = null;
    if (airlineCode) {
      const assignment = await prisma.airlineTerminalAssignment.findFirst({
        where: {
          airportId: airport.id,
          OR: [{ airlineIcao: airlineCode }, { airlineIata: airlineCode }],
        },
        orderBy: { priority: 'desc' },
      });
      terminal = assignment?.terminal || null;
    }

    const stands = await prisma.stand.findMany({
      where: {
        airportId: airport.id,
        ...(terminal ? { terminal } : {}),
        isActive: true,
      },
    });

    if (stands.length === 0) {
      return res.status(404).json({ 
        error: 'No available stands found',
        airport: airport.id,
        terminal: terminal || 'unknown'
      });
    }

    const selectedStand = stands[Math.floor(Math.random() * stands.length)];

    return res.status(200).json({
      flight: flightStr,
      airport: airport.id,
      stand: selectedStand.standName,
      confidence: terminal ? 0.8 : 0.5,
      fallbackStage: terminal ? 'airline_terminal' : 'random',
      fallbackStageName: terminal ? 'Airline Terminal Assignment' : 'Random Stand',
      sources: ['database'],
      terminal: terminal || selectedStand.terminal || 'N/A',
      timestamp: new Date().toISOString(),
      metadata: {
        airport: airport.name,
        airportIcao: airport.id,
        airline: airlineCode,
      },
    });
  } catch (error) {
    console.error('Stand resolution error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
