import dotenv from 'dotenv';
import { Config } from './types/index.js';

dotenv.config();

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  redisUrl: process.env.REDIS_URL,
  useRedis: process.env.USE_REDIS === 'true',
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),
  flightCacheTtlSeconds: parseInt(process.env.FLIGHT_CACHE_TTL_SECONDS || '86400', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  logPretty: process.env.LOG_PRETTY === 'true',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitTimeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000', 10),
  apiKeys: {
    adsbexchange: process.env.ADSBEXCHANGE_API_KEY,
    aviationstack: process.env.AVIATIONSTACK_API_KEY,
    openskyUsername: process.env.OPENSKY_USERNAME,
    openskyPassword: process.env.OPENSKY_PASSWORD,
  },
};
