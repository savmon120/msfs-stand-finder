import { PrismaClient } from '@prisma/client';
import { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

// OpenSky Network API - Search for flights by callsign in last 7 days
async function getFlightFromOpenSky(flightNumber: string) {
  try {
    // Try last 7 days of data
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 86400);
    
    const response = await fetch(
      `https://opensky-network.org/api/flights/all?begin=${sevenDaysAgo}&end=${now}`,
      { headers: { 'User-Agent': 'Aviation-Stand-Finder/1.0' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json() as any[];
    
    // Find most recent flight matching callsign
    const matchingFlights = data
      .filter((f: any) => f.callsign?.trim().toUpperCase() === flightNumber)
      .sort((a: any, b: any) => (b.lastSeen || 0) - (a.lastSeen || 0));
    
    const flight = matchingFlights[0];
    
    if (flight && flight.estArrivalAirport) {
      return {
        callsign: flight.callsign.trim(),
        arrivalAirport: flight.estArrivalAirport.toUpperCase(),
        departureAirport: flight.estDepartureAirport?.toUpperCase(),
        lastSeen: flight.lastSeen,
      };
    }
    return null;
  } catch (error) {
    console.error('OpenSky error:', error);
    return null;
  }
}

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

    // Try to get real-world flight data
    let airport;
    let flightData = null;
    
    if (!airportIcao) {
      // Attempt to fetch real-world data
      flightData = await getFlightFromOpenSky(flightStr);
      
      if (flightData?.arrivalAirport) {
        airport = await prisma.airport.findUnique({
          where: { id: flightData.arrivalAirport },
        });
      }
    }
    
    // Fallback to manual selection or default
    if (!airport) {
      if (airportIcao) {
        airport = await prisma.airport.findUnique({
          where: { id: String(airportIcao).toUpperCase() },
        });
      } else {
        airport = await prisma.airport.findUnique({ where: { id: 'EGLL' } });
      }
    }

    if (!airport) {
      return res.status(404).json({ error: 'Airport not found' });
    }

    let terminal = null;
    let pier = null;
    if (airlineCode) {
      const assignment = await prisma.airlineTerminalAssignment.findFirst({
        where: {
          airportId: airport.id,
          OR: [{ airlineIcao: airlineCode }, { airlineIata: airlineCode }],
        },
        orderBy: { priority: 'desc' },
      });
      terminal = assignment?.terminal || null;
      pier = assignment?.pier || null;
    }

    // Prioritize stands by pier match, then terminal match
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

    // Prefer stands matching the airline's assigned pier
    let selectedStand;
    if (pier) {
      const pierStands = stands.filter(s => s.standName.startsWith(pier));
      selectedStand = pierStands.length > 0 
        ? pierStands[Math.floor(Math.random() * pierStands.length)]
        : stands[Math.floor(Math.random() * stands.length)];
    } else {
      selectedStand = stands[Math.floor(Math.random() * stands.length)];
    }

    return res.status(200).json({
      flight: flightStr,
      airport: airport.id,
      stand: selectedStand.standName,
      confidence: flightData ? 0.9 : (terminal ? 0.8 : 0.5),
      fallbackStage: flightData ? 'realtime_data' : (terminal ? 'airline_terminal' : 'random'),
      fallbackStageName: flightData ? 'Real-time Flight Data' : (terminal ? 'Airline Terminal Assignment' : 'Random Stand'),
      sources: flightData ? ['opensky', 'database'] : ['database'],
      terminal: terminal || selectedStand.terminal || 'N/A',
      timestamp: new Date().toISOString(),
      metadata: {
        airport: airport.name,
        airportIcao: airport.id,
        airline: airlineCode,
        realTimeData: flightData ? true : false,
        departureAirport: flightData?.departureAirport,
      },
    });
  } catch (error) {
    console.error('Stand resolution error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
