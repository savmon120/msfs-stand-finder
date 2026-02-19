import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { flight, callsign, airportIcao, standNumber, timestamp, source } = req.body;

    // Validation
    if (!flight || !airportIcao || !standNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: flight, airportIcao, standNumber' 
      });
    }

    // Find airport
    const airport = await prisma.airport.findUnique({
      where: { icaoCode: airportIcao.toUpperCase() },
    });

    if (!airport) {
      return res.status(404).json({ 
        error: 'Airport not found',
        icao: airportIcao 
      });
    }

    // Find or create stand
    let stand = await prisma.stand.findFirst({
      where: {
        airportId: airport.id,
        standNumber: standNumber.toUpperCase(),
      },
    });

    if (!stand) {
      // Create stand if it doesn't exist (crowdsourced)
      stand = await prisma.stand.create({
        data: {
          airportId: airport.id,
          standNumber: standNumber.toUpperCase(),
          terminal: null,
          latitude: null,
          longitude: null,
        },
      });
    }

    // Create crowdsourced report
    const report = await prisma.crowdsourcedReport.create({
      data: {
        flight: flight.toUpperCase(),
        callsign: callsign?.toUpperCase() || null,
        standId: stand.id,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        source: source || 'web',
        verified: false,
      },
    });

    return res.status(201).json({
      message: 'Report submitted successfully',
      reportId: report.id,
      flight: report.flight,
      stand: stand.standNumber,
      airport: airport.icaoCode,
    });
  } catch (error) {
    console.error('Crowdsource report error:', error);
    return res.status(500).json({ 
      error: 'Failed to submit report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
