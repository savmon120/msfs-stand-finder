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
    const { search, limit = '50' } = req.query;

    let airports;
    if (search && typeof search === 'string') {
      airports = await prisma.airport.findMany({
        where: {
          OR: [
            { id: { contains: search.toUpperCase() } },
            { iata: { contains: search.toUpperCase() } },
            { name: { contains: search } },
            { city: { contains: search } },
            { country: { contains: search } },
          ],
        },
        take: parseInt(limit as string, 10),
        orderBy: { id: 'asc' },
      });
    } else {
      airports = await prisma.airport.findMany({
        take: parseInt(limit as string, 10),
        orderBy: { id: 'asc' },
      });
    }

    return res.status(200).json(airports);
  } catch (error) {
    console.error('Airport search error:', error);
    return res.status(500).json({ 
      error: 'Failed to search airports',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
