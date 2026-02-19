import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Sample UK airport stands data
const ukStandsData = [
  // London Heathrow (EGLL)
  {
    airport: 'EGLL',
    stands: [
      { name: 'A1', terminal: 'T2', maxWingspanM: 36, aircraftSizeCode: 'C', lat: 51.4706, lon: -0.4619 },
      { name: 'A2', terminal: 'T2', maxWingspanM: 36, aircraftSizeCode: 'C', lat: 51.4708, lon: -0.4617 },
      { name: 'A10', terminal: 'T2', maxWingspanM: 52, aircraftSizeCode: 'D', lat: 51.4720, lon: -0.4600, airlinePreference: 'BAW' },
      { name: 'B32', terminal: 'T5', maxWingspanM: 80, aircraftSizeCode: 'F', lat: 51.4705, lon: -0.4885, airlinePreference: 'BAW' },
      { name: 'B35', terminal: 'T5', maxWingspanM: 80, aircraftSizeCode: 'F', lat: 51.4710, lon: -0.4890, airlinePreference: 'BAW' },
      { name: 'B40', terminal: 'T5', maxWingspanM: 65, aircraftSizeCode: 'E', lat: 51.4715, lon: -0.4895, airlinePreference: 'BAW' },
      { name: 'C52', terminal: 'T5', maxWingspanM: 52, aircraftSizeCode: 'D', lat: 51.4700, lon: -0.4900, airlinePreference: 'BAW' },
    ],
  },
  // London Gatwick (EGKK)
  {
    airport: 'EGKK',
    stands: [
      { name: '1', terminal: 'North', maxWingspanM: 36, aircraftSizeCode: 'C', lat: 51.1537, lon: -0.1821 },
      { name: '10', terminal: 'North', maxWingspanM: 52, aircraftSizeCode: 'D', lat: 51.1540, lon: -0.1825 },
      { name: '20', terminal: 'South', maxWingspanM: 36, aircraftSizeCode: 'C', lat: 51.1480, lon: -0.1900 },
      { name: '50', terminal: 'South', maxWingspanM: 52, aircraftSizeCode: 'D', lat: 51.1485, lon: -0.1905 },
    ],
  },
  // Manchester (EGCC)
  {
    airport: 'EGCC',
    stands: [
      { name: '1', terminal: 'T1', maxWingspanM: 36, aircraftSizeCode: 'C', lat: 53.3537, lon: -2.2750 },
      { name: '10', terminal: 'T1', maxWingspanM: 52, aircraftSizeCode: 'D', lat: 53.3540, lon: -2.2755 },
      { name: '20', terminal: 'T2', maxWingspanM: 52, aircraftSizeCode: 'D', lat: 53.3545, lon: -2.2760 },
      { name: '30', terminal: 'T3', maxWingspanM: 65, aircraftSizeCode: 'E', lat: 53.3550, lon: -2.2765 },
    ],
  },
];

// Sample airline terminal assignments
const airlineAssignments = [
  // Heathrow
  { airport: 'EGLL', airline: 'BAW', iata: 'BA', terminal: 'T5', priority: 1 },
  { airport: 'EGLL', airline: 'AAL', iata: 'AA', terminal: 'T3', priority: 1 },
  { airport: 'EGLL', airline: 'UAL', iata: 'UA', terminal: 'T2', priority: 1 },
  { airport: 'EGLL', airline: 'AFR', iata: 'AF', terminal: 'T4', priority: 1 },
  { airport: 'EGLL', airline: 'DLH', iata: 'LH', terminal: 'T2', priority: 1 },
  { airport: 'EGLL', airline: 'UAE', iata: 'EK', terminal: 'T3', priority: 1 },
  
  // Gatwick
  { airport: 'EGKK', airline: 'BAW', iata: 'BA', terminal: 'South', priority: 1 },
  { airport: 'EGKK', airline: 'EZY', iata: 'U2', terminal: 'North', priority: 1 },
  
  // Manchester
  { airport: 'EGCC', airline: 'RYR', iata: 'FR', terminal: 'T3', priority: 1 },
  { airport: 'EGCC', airline: 'EZY', iata: 'U2', terminal: 'T1', priority: 1 },
];

async function importStands() {
  logger.info('Starting stands import...');

  try {
    let standCount = 0;

    for (const airportData of ukStandsData) {
      for (const stand of airportData.stands) {
        await prisma.stand.upsert({
          where: {
            airportId_standName: {
              airportId: airportData.airport,
              standName: stand.name,
            },
          },
          update: {
            terminal: stand.terminal,
            maxWingspanM: stand.maxWingspanM,
            aircraftSizeCode: stand.aircraftSizeCode,
            latitude: stand.lat,
            longitude: stand.lon,
            airlinePreference: stand.airlinePreference,
          },
          create: {
            airportId: airportData.airport,
            standName: stand.name,
            terminal: stand.terminal,
            maxWingspanM: stand.maxWingspanM,
            aircraftSizeCode: stand.aircraftSizeCode,
            latitude: stand.lat,
            longitude: stand.lon,
            airlinePreference: stand.airlinePreference,
          },
        });

        standCount++;
      }
    }

    logger.info(`Imported ${standCount} stands`);

    // Import airline assignments
    let assignmentCount = 0;

    for (const assignment of airlineAssignments) {
      await prisma.airlineTerminalAssignment.upsert({
        where: {
          airportId_airlineIcao_terminal: {
            airportId: assignment.airport,
            airlineIcao: assignment.airline,
            terminal: assignment.terminal,
          },
        },
        update: {
          airlineIata: assignment.iata,
          priority: assignment.priority,
        },
        create: {
          airportId: assignment.airport,
          airlineIcao: assignment.airline,
          airlineIata: assignment.iata,
          terminal: assignment.terminal,
          priority: assignment.priority,
        },
      });

      assignmentCount++;
    }

    logger.info(`Imported ${assignmentCount} airline terminal assignments`);
    logger.info('Stands import complete');
  } catch (error) {
    logger.error({ error }, 'Stands import failed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importStands();
