import { PrismaClient } from '@prisma/client';
import { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic security - require a secret key in query params
  const { secret } = req.query;
  
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized - invalid secret' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed - use POST or GET' });
  }

  try {
    // Check if already seeded
    const existingAirports = await prisma.airport.count();
    if (existingAirports > 0) {
      return res.status(400).json({ 
        error: 'Database already seeded',
        airports: existingAirports 
      });
    }

    // Create aircraft types
    const aircraft = await Promise.all([
      prisma.aircraft.create({
        data: {
          icaoType: 'A320',
          iataType: '320',
          manufacturer: 'Airbus',
          model: 'A320',
          wingspanM: 35.8,
          lengthM: 37.57,
          sizeCode: 'C',
          category: 'medium',
        },
      }),
      prisma.aircraft.create({
        data: {
          icaoType: 'B738',
          iataType: '738',
          manufacturer: 'Boeing',
          model: '737-800',
          wingspanM: 35.79,
          lengthM: 39.5,
          sizeCode: 'C',
          category: 'medium',
        },
      }),
      prisma.aircraft.create({
        data: {
          icaoType: 'B77W',
          iataType: '77W',
          manufacturer: 'Boeing',
          model: '777-300ER',
          wingspanM: 64.8,
          lengthM: 73.86,
          sizeCode: 'E',
          category: 'heavy',
        },
      }),
      prisma.aircraft.create({
        data: {
          icaoType: 'A388',
          iataType: '388',
          manufacturer: 'Airbus',
          model: 'A380-800',
          wingspanM: 79.75,
          lengthM: 72.72,
          sizeCode: 'F',
          category: 'super',
        },
      }),
    ]);

    // Create London Heathrow
    const heathrow = await prisma.airport.create({
      data: {
        id: 'EGLL',
        iata: 'LHR',
        name: 'London Heathrow Airport',
        city: 'London',
        country: 'United Kingdom',
        latitude: 51.4700,
        longitude: -0.4543,
        altitude: 83,
        timezone: 'Europe/London',
      },
    });

    // Create stands for Heathrow Terminal 5
    const heathrowStands = await Promise.all([
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standName: '501',
          terminal: '5',
          latitude: 51.4702,
          longitude: -0.4877,
          maxWingspanM: 65.0,
          maxLengthM: 74.0,
          aircraftSizeCode: 'E',
        },
      }),
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standName: '502',
          terminal: '5',
          latitude: 51.4705,
          longitude: -0.4880,
          maxWingspanM: 65.0,
          maxLengthM: 74.0,
          aircraftSizeCode: 'E',
        },
      }),
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standName: '510',
          terminal: '5',
          latitude: 51.4698,
          longitude: -0.4870,
          maxWingspanM: 36.0,
          maxLengthM: 40.0,
          aircraftSizeCode: 'C',
        },
      }),
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standName: '511',
          terminal: '5',
          latitude: 51.4700,
          longitude: -0.4872,
          maxWingspanM: 36.0,
          maxLengthM: 40.0,
          aircraftSizeCode: 'C',
        },
      }),
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standName: '512',
          terminal: '5',
          latitude: 51.4702,
          longitude: -0.4874,
          maxWingspanM: 36.0,
          maxLengthM: 40.0,
          aircraftSizeCode: 'C',
        },
      }),
    ]);

    // Create London Gatwick
    const gatwick = await prisma.airport.create({
      data: {
        id: 'EGKK',
        iata: 'LGW',
        name: 'London Gatwick Airport',
        city: 'London',
        country: 'United Kingdom',
        latitude: 51.1537,
        longitude: -0.1821,
        altitude: 202,
        timezone: 'Europe/London',
      },
    });

    // Create stands for Gatwick North Terminal
    const gatwickStands = await Promise.all([
      prisma.stand.create({ data: { airportId: gatwick.id, standName: '101', terminal: 'North', latitude: 51.1540, longitude: -0.1825, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
      prisma.stand.create({ data: { airportId: gatwick.id, standName: '102', terminal: 'North', latitude: 51.1542, longitude: -0.1827, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
      prisma.stand.create({ data: { airportId: gatwick.id, standName: '103', terminal: 'North', latitude: 51.1544, longitude: -0.1829, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
      prisma.stand.create({ data: { airportId: gatwick.id, standName: '104', terminal: 'North', latitude: 51.1546, longitude: -0.1831, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
      prisma.stand.create({ data: { airportId: gatwick.id, standName: '105', terminal: 'North', latitude: 51.1548, longitude: -0.1833, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
    ]);

    // Create Manchester
    const manchester = await prisma.airport.create({
      data: {
        id: 'EGCC',
        iata: 'MAN',
        name: 'Manchester Airport',
        city: 'Manchester',
        country: 'United Kingdom',
        latitude: 53.3537,
        longitude: -2.2750,
        altitude: 257,
        timezone: 'Europe/London',
      },
    });

    // Create stands for Manchester Terminal 1
    const manchesterStands = await Promise.all([
      prisma.stand.create({ data: { airportId: manchester.id, standName: '201', terminal: '1', latitude: 53.3540, longitude: -2.2755, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
      prisma.stand.create({ data: { airportId: manchester.id, standName: '202', terminal: '1', latitude: 53.3542, longitude: -2.2757, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
      prisma.stand.create({ data: { airportId: manchester.id, standName: '203', terminal: '1', latitude: 53.3544, longitude: -2.2759, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
      prisma.stand.create({ data: { airportId: manchester.id, standName: '204', terminal: '1', latitude: 53.3546, longitude: -2.2761, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
      prisma.stand.create({ data: { airportId: manchester.id, standName: '205', terminal: '1', latitude: 53.3548, longitude: -2.2763, maxWingspanM: 36.0, maxLengthM: 40.0, aircraftSizeCode: 'C' } }),
    ]);

    // Create airline terminal assignments
    await Promise.all([
      prisma.airlineTerminalAssignment.create({
        data: {
          airportId: heathrow.id,
          airlineIcao: 'BAW',
          airlineIata: 'BA',
          terminal: '5',
          priority: 1,
        },
      }),
      prisma.airlineTerminalAssignment.create({
        data: {
          airportId: gatwick.id,
          airlineIcao: 'EZY',
          airlineIata: 'U2',
          terminal: 'North',
          priority: 1,
        },
      }),
      prisma.airlineTerminalAssignment.create({
        data: {
          airportId: manchester.id,
          airlineIcao: 'RYR',
          airlineIata: 'FR',
          terminal: '1',
          priority: 1,
        },
      }),
    ]);

    const summary = {
      aircraft: aircraft.length,
      airports: 3,
      stands: heathrowStands.length + gatwickStands.length + manchesterStands.length,
      terminalAssignments: 3,
    };

    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      summary,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({
      error: 'Failed to seed database',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
