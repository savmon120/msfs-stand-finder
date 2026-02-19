import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { standRoutes } from './routes/stand.routes.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient({
  log: config.logLevel === 'debug' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

const fastify = Fastify({
  logger: logger,
  trustProxy: true,
});

// Register plugins
await fastify.register(cors, {
  origin: config.corsOrigin,
});

await fastify.register(rateLimit, {
  max: config.rateLimitMax,
  timeWindow: config.rateLimitTimeWindow,
});

// Serve static files (web UI)
await fastify.register(fastifyStatic, {
  root: join(__dirname, '../public'),
  prefix: '/',
});

// Register routes
await fastify.register(async (fastify) => standRoutes(fastify, prisma));

// Root route
fastify.get('/', async (_request, reply) => {
  return reply.sendFile('index.html');
});

// Start server
const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await fastify.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(`Server listening on http://${config.host}:${config.port}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
