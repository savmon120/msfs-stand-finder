import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

async function seed() {
  logger.info('Starting database seed...');

  try {
    // Create UK airports first
    const ukAirports = [
      {
        id: 'EGLL',
        iata: 'LHR',
        name: 'London Heathrow Airport',
        city: 'London',
        country: 'GB',
        latitude: 51.4706,
        longitude: -0.4619,
        altitude: 83,
      },
      {
        id: 'EGKK',
        iata: 'LGW',
        name: 'London Gatwick Airport',
        city: 'London',
        country: 'GB',
        latitude: 51.1537,
        longitude: -0.1821,
        altitude: 202,
      },
      {
        id: 'EGCC',
        iata: 'MAN',
        name: 'Manchester Airport',
        city: 'Manchester',
        country: 'GB',
        latitude: 53.3537,
        longitude: -2.2750,
        altitude: 257,
      },
    ];

    for (const airport of ukAirports) {
      await prisma.airport.upsert({
        where: { id: airport.id },
        update: airport,
        create: airport,
      });
    }

    logger.info(`Created ${ukAirports.length} airports`);

    // Create sample aircraft types
    const aircraftTypes = [
      { icaoType: 'A320', iataType: '320', manufacturer: 'Airbus', model: 'A320', wingspanM: 35.8, lengthM: 37.57, sizeCode: 'C' },
      { icaoType: 'B738', iataType: '738', manufacturer: 'Boeing', model: '737-800', wingspanM: 35.79, lengthM: 39.5, sizeCode: 'C' },
      { icaoType: 'A388', iataType: '388', manufacturer: 'Airbus', model: 'A380-800', wingspanM: 79.75, lengthM: 72.72, sizeCode: 'F' },
      { icaoType: 'B77W', iataType: '77W', manufacturer: 'Boeing', model: '777-300ER', wingspanM: 64.8, lengthM: 73.9, sizeCode: 'E' },
    ];

    for (const aircraft of aircraftTypes) {
      await prisma.aircraft.upsert({
        where: { icaoType: aircraft.icaoType },
        update: aircraft,
        create: aircraft,
      });
    }

    logger.info('Database seed complete');
  } catch (error) {
    logger.error({ error }, 'Database seed failed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
