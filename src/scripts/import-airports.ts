import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

async function importAirports() {
  logger.info('Starting airport import from OurAirports...');

  try {
    // Fetch OurAirports data
    const response = await fetch('https://davidmegginson.github.io/ourairports-data/airports.csv');
    const csvText = await response.text();
    
    const lines = csvText.split('\n').slice(1); // Skip header
    let imported = 0;
    let skipped = 0;

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split(',').map(p => p.replace(/^"|"$/g, ''));
      
      const [
        _id, ident, type, name, latitudeDeg, longitudeDeg, 
        elevationFt, _continent, isoCountry, _isoRegion, 
        municipality, _scheduledService, gpsCode, iataCode
      ] = parts;

      // Only import major airports
      if (type !== 'large_airport' && type !== 'medium_airport') {
        skipped++;
        continue;
      }

      const icao = gpsCode || ident;
      if (!icao || icao.length !== 4) {
        skipped++;
        continue;
      }

      try {
        await prisma.airport.upsert({
          where: { id: icao },
          update: {
            iata: iataCode || null,
            name: name,
            city: municipality || null,
            country: isoCountry,
            latitude: parseFloat(latitudeDeg),
            longitude: parseFloat(longitudeDeg),
            altitude: elevationFt ? parseInt(elevationFt) : null,
          },
          create: {
            id: icao,
            iata: iataCode || null,
            name: name,
            city: municipality || null,
            country: isoCountry,
            latitude: parseFloat(latitudeDeg),
            longitude: parseFloat(longitudeDeg),
            altitude: elevationFt ? parseInt(elevationFt) : null,
          },
        });

        imported++;
        
        if (imported % 100 === 0) {
          logger.info(`Imported ${imported} airports...`);
        }
      } catch (error) {
        logger.warn({ error, icao }, 'Failed to import airport');
      }
    }

    logger.info(`Airport import complete: ${imported} imported, ${skipped} skipped`);
  } catch (error) {
    logger.error({ error }, 'Airport import failed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importAirports();
