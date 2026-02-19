import NodeCache from 'node-cache';
import { createClient, RedisClientType } from 'redis';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { CacheEntry } from '../types/index.js';

export class CacheService {
  private memoryCache: NodeCache;
  private redisClient?: RedisClientType;
  private useRedis: boolean;

  constructor() {
    this.memoryCache = new NodeCache({
      stdTTL: config.cacheTtlSeconds,
      checkperiod: 120,
      useClones: false,
    });

    this.useRedis = config.useRedis;

    if (this.useRedis && config.redisUrl) {
      this.initRedis();
    }
  }

  private async initRedis() {
    try {
      this.redisClient = createClient({ url: config.redisUrl });

      this.redisClient.on('error', (err) => {
        logger.error({ err }, 'Redis error');
        this.useRedis = false;
      });

      await this.redisClient.connect();
      logger.info('Redis connected');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Redis, using memory cache only');
      this.useRedis = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memValue = this.memoryCache.get<CacheEntry<T>>(key);
    if (memValue && new Date(memValue.expiresAt) > new Date()) {
      return memValue.data;
    }

    // Try Redis if available
    if (this.useRedis && this.redisClient) {
      try {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          const parsed = JSON.parse(redisValue) as CacheEntry<T>;
          if (new Date(parsed.expiresAt) > new Date()) {
            // Store in memory cache for faster access
            this.memoryCache.set(key, parsed);
            return parsed.data;
          }
        }
      } catch (error) {
        logger.error({ error, key }, 'Redis get error');
      }
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || config.cacheTtlSeconds;
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl * 1000),
    };

    // Set in memory cache
    this.memoryCache.set(key, entry, ttl);

    // Set in Redis if available
    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttl, JSON.stringify(entry));
      } catch (error) {
        logger.error({ error, key }, 'Redis set error');
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.del(key);

    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        logger.error({ error, key }, 'Redis delete error');
      }
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.flushAll();

    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.flushDb();
      } catch (error) {
        logger.error({ error }, 'Redis clear error');
      }
    }
  }

  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      redis: this.useRedis,
    };
  }
}

export const cacheService = new CacheService();
