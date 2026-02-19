import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
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
    // Vercel passes this as req.query in file-based routing
    const { icao } = req.query;

    if (!icao || typeof icao !== 'string') {
      return res.status(400).json({ error: 'ICAO code is required' });
    }

    const icaoCode = icao.toUpperCase();

    // Check if airport exists
    const airport = await prisma.airport.findUnique({
      where: { icaoCode },
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
        { standNumber: 'asc' },
      ],
      include: {
        airlinePreferences: {
          include: {
            airline: true,
          },
        },
        aircraft: {
          select: {
            icaoCode: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return res.status(200).json({
      airport: {
        icaoCode: airport.icaoCode,
        iataCode: airport.iataCode,
        name: airport.name,
        city: airport.city,
        country: airport.country,
      },
      stands: stands.map(stand => ({
        id: stand.id,
        standNumber: stand.standNumber,
        terminal: stand.terminal,
        latitude: stand.latitude,
        longitude: stand.longitude,
        maxWingspan: stand.maxWingspan,
        maxLength: stand.maxLength,
        airlinePreferences: stand.airlinePreferences.map(pref => ({
          airlineIcao: pref.airline.icaoCode,
          airlineIata: pref.airline.iataCode,
          airlineName: pref.airline.name,
          probability: pref.probability,
        })),
        supportedAircraft: stand.aircraft.map(ac => ({
          icaoCode: ac.icaoCode,
          name: ac.name,
          category: ac.category,
        })),
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
