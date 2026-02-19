import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Basic security - require a secret key in query params
  const { secret } = req.query;
  
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized - invalid secret' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed - use POST' });
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
          icaoCode: 'A320',
          iataCode: '320',
          name: 'Airbus A320',
          manufacturer: 'Airbus',
          category: 'C',
          wingspan: 35.8,
          length: 37.57,
        },
      }),
      prisma.aircraft.create({
        data: {
          icaoCode: 'B738',
          iataCode: '738',
          name: 'Boeing 737-800',
          manufacturer: 'Boeing',
          category: 'C',
          wingspan: 35.79,
          length: 39.5,
        },
      }),
      prisma.aircraft.create({
        data: {
          icaoCode: 'B77W',
          iataCode: '77W',
          name: 'Boeing 777-300ER',
          manufacturer: 'Boeing',
          category: 'E',
          wingspan: 64.8,
          length: 73.86,
        },
      }),
      prisma.aircraft.create({
        data: {
          icaoCode: 'A388',
          iataCode: '388',
          name: 'Airbus A380-800',
          manufacturer: 'Airbus',
          category: 'F',
          wingspan: 79.75,
          length: 72.72,
        },
      }),
    ]);

    // Create airlines
    const airlines = await Promise.all([
      prisma.airline.create({
        data: {
          icaoCode: 'BAW',
          iataCode: 'BA',
          name: 'British Airways',
          country: 'United Kingdom',
        },
      }),
      prisma.airline.create({
        data: {
          icaoCode: 'EZY',
          iataCode: 'U2',
          name: 'easyJet',
          country: 'United Kingdom',
        },
      }),
      prisma.airline.create({
        data: {
          icaoCode: 'RYR',
          iataCode: 'FR',
          name: 'Ryanair',
          country: 'Ireland',
        },
      }),
    ]);

    // Create London Heathrow
    const heathrow = await prisma.airport.create({
      data: {
        icaoCode: 'EGLL',
        iataCode: 'LHR',
        name: 'London Heathrow Airport',
        city: 'London',
        country: 'United Kingdom',
        latitude: 51.4700,
        longitude: -0.4543,
        elevation: 83,
        timezone: 'Europe/London',
      },
    });

    // Create stands for Heathrow Terminal 5
    const heathrowStands = await Promise.all([
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standNumber: '501',
          terminal: '5',
          latitude: 51.4702,
          longitude: -0.4877,
          maxWingspan: 65.0,
          maxLength: 74.0,
          aircraft: { connect: [{ id: aircraft[2].id }, { id: aircraft[3].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standNumber: '502',
          terminal: '5',
          latitude: 51.4705,
          longitude: -0.4880,
          maxWingspan: 65.0,
          maxLength: 74.0,
          aircraft: { connect: [{ id: aircraft[2].id }, { id: aircraft[3].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standNumber: '510',
          terminal: '5',
          latitude: 51.4698,
          longitude: -0.4870,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standNumber: '511',
          terminal: '5',
          latitude: 51.4700,
          longitude: -0.4872,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: heathrow.id,
          standNumber: '512',
          terminal: '5',
          latitude: 51.4702,
          longitude: -0.4874,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
    ]);

    // Create London Gatwick
    const gatwick = await prisma.airport.create({
      data: {
        icaoCode: 'EGKK',
        iataCode: 'LGW',
        name: 'London Gatwick Airport',
        city: 'London',
        country: 'United Kingdom',
        latitude: 51.1537,
        longitude: -0.1821,
        elevation: 202,
        timezone: 'Europe/London',
      },
    });

    // Create stands for Gatwick North Terminal
    const gatwickStands = await Promise.all([
      prisma.stand.create({
        data: {
          airportId: gatwick.id,
          standNumber: '101',
          terminal: 'North',
          latitude: 51.1540,
          longitude: -0.1825,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: gatwick.id,
          standNumber: '102',
          terminal: 'North',
          latitude: 51.1542,
          longitude: -0.1827,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: gatwick.id,
          standNumber: '103',
          terminal: 'North',
          latitude: 51.1544,
          longitude: -0.1829,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: gatwick.id,
          standNumber: '104',
          terminal: 'North',
          latitude: 51.1546,
          longitude: -0.1831,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: gatwick.id,
          standNumber: '105',
          terminal: 'North',
          latitude: 51.1548,
          longitude: -0.1833,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
    ]);

    // Create Manchester
    const manchester = await prisma.airport.create({
      data: {
        icaoCode: 'EGCC',
        iataCode: 'MAN',
        name: 'Manchester Airport',
        city: 'Manchester',
        country: 'United Kingdom',
        latitude: 53.3537,
        longitude: -2.2750,
        elevation: 257,
        timezone: 'Europe/London',
      },
    });

    // Create stands for Manchester Terminal 1
    const manchesterStands = await Promise.all([
      prisma.stand.create({
        data: {
          airportId: manchester.id,
          standNumber: '201',
          terminal: '1',
          latitude: 53.3540,
          longitude: -2.2755,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: manchester.id,
          standNumber: '202',
          terminal: '1',
          latitude: 53.3542,
          longitude: -2.2757,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: manchester.id,
          standNumber: '203',
          terminal: '1',
          latitude: 53.3544,
          longitude: -2.2759,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: manchester.id,
          standNumber: '204',
          terminal: '1',
          latitude: 53.3546,
          longitude: -2.2761,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
      prisma.stand.create({
        data: {
          airportId: manchester.id,
          standNumber: '205',
          terminal: '1',
          latitude: 53.3548,
          longitude: -2.2763,
          maxWingspan: 36.0,
          maxLength: 40.0,
          aircraft: { connect: [{ id: aircraft[0].id }, { id: aircraft[1].id }] },
        },
      }),
    ]);

    // Create airline terminal assignments
    await Promise.all([
      prisma.airlineTerminalAssignment.create({
        data: {
          airlineId: airlines[0].id, // British Airways
          airportId: heathrow.id,
          terminal: '5',
          probability: 0.95,
        },
      }),
      prisma.airlineTerminalAssignment.create({
        data: {
          airlineId: airlines[1].id, // easyJet
          airportId: gatwick.id,
          terminal: 'North',
          probability: 0.85,
        },
      }),
      prisma.airlineTerminalAssignment.create({
        data: {
          airlineId: airlines[2].id, // Ryanair
          airportId: manchester.id,
          terminal: '1',
          probability: 0.80,
        },
      }),
    ]);

    const summary = {
      aircraft: aircraft.length,
      airlines: airlines.length,
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
