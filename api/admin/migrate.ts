import { PrismaClient } from '@prisma/client';
import { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic security - require a secret key in query params
  const { secret } = req.query;
  
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized - invalid secret' });
  }

  try {
    // Use db push to create/update schema without migrations
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Airport" (
        "id" TEXT PRIMARY KEY,
        "iata" TEXT,
        "name" TEXT NOT NULL,
        "city" TEXT,
        "country" TEXT NOT NULL,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "altitude" DOUBLE PRECISION,
        "timezone" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Stand" (
        "id" TEXT PRIMARY KEY,
        "airportId" TEXT NOT NULL,
        "standName" TEXT NOT NULL,
        "terminal" TEXT,
        "gate" TEXT,
        "pier" TEXT,
        "maxWingspanM" DOUBLE PRECISION,
        "maxLengthM" DOUBLE PRECISION,
        "aircraftSizeCode" TEXT,
        "jetBridgeAvailable" BOOLEAN NOT NULL DEFAULT false,
        "contactStand" BOOLEAN NOT NULL DEFAULT false,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("airportId") REFERENCES "Airport"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Aircraft" (
        "id" TEXT PRIMARY KEY,
        "icaoType" TEXT NOT NULL UNIQUE,
        "iataType" TEXT,
        "manufacturer" TEXT,
        "model" TEXT,
        "wingspanM" DOUBLE PRECISION,
        "lengthM" DOUBLE PRECISION,
        "heightM" DOUBLE PRECISION,
        "sizeCode" TEXT,
        "category" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add category column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Aircraft" ADD COLUMN IF NOT EXISTS "category" TEXT;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AirlineTerminalAssignment" (
        "id" TEXT PRIMARY KEY,
        "airportId" TEXT NOT NULL,
        "airlineIcao" TEXT NOT NULL,
        "airlineIata" TEXT,
        "terminal" TEXT NOT NULL,
        "pier" TEXT,
        "priority" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("airportId") REFERENCES "Airport"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CrowdsourcedReport" (
        "id" TEXT PRIMARY KEY,
        "standName" TEXT NOT NULL,
        "flightIdentifier" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL,
        "reporterId" TEXT,
        "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
        "verified" BOOLEAN NOT NULL DEFAULT false,
        "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
        "upvotes" INTEGER NOT NULL DEFAULT 0,
        "downvotes" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "airportId" TEXT NOT NULL,
        FOREIGN KEY ("airportId") REFERENCES "Airport"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Stand_airportId_idx" ON "Stand"("airportId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AirlineTerminalAssignment_airportId_idx" ON "AirlineTerminalAssignment"("airportId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CrowdsourcedReport_airportId_idx" ON "CrowdsourcedReport"("airportId");`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Stand_airportId_standName_key" ON "Stand"("airportId", "standName");`);

    return res.status(200).json({ 
      message: 'Database schema created successfully',
      tables: ['Airport', 'Stand', 'Aircraft', 'AirlineTerminalAssignment', 'CrowdsourcedReport']
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ 
      error: 'Failed to create database schema',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
