import { PrismaClient } from '@prisma/client';
import { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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
    // Extract ICAO code from the dynamic route
    const { icao } = req.query;

    if (!icao || typeof icao !== 'string') {
      return res.status(400).json({ error: 'ICAO code is required' });
    }

    const icaoCode = icao.toUpperCase();

    // Check if airport exists (id is ICAO code in schema)
    const airport = await prisma.airport.findUnique({
      where: { id: icaoCode },
    });

    if (!airport) {
      return res.status(404).json({ 
        error: 'Airport not found',
        icao: icaoCode 
      });
    }

    // Get all stands for this airport
    const stands = await prisma.stand.findMany({
      where: { airportId: airport.id },
      orderBy: [
        { terminal: 'asc' },
        { standName: 'asc' },
      ],
    });

    return res.status(200).json({
      airport: {
        icaoCode: airport.id,
        iataCode: airport.iata,
        name: airport.name,
        city: airport.city,
        country: airport.country,
      },
      stands: stands.map(stand => ({
        id: stand.id,
        standName: stand.standName,
        terminal: stand.terminal,
        latitude: stand.latitude,
        longitude: stand.longitude,
        maxWingspanM: stand.maxWingspanM,
        maxLengthM: stand.maxLengthM,
        aircraftSizeCode: stand.aircraftSizeCode,
        airlinePreference: stand.airlinePreference,
      })),
      total: stands.length,
    });
  } catch (error) {
    console.error('Stands fetch error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch stands',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
