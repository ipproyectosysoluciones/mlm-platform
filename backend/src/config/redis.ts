import Redis from 'ioredis';
import { config } from './env';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  // Skip Redis if not configured
  if (process.env.REDIS_ENABLED !== 'true') {
    console.log('⚠️ Redis disabled (set REDIS_ENABLED=true to enable)');
    return null;
  }

  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      redis = null;
    });

    return redis;
  } catch (error) {
    console.error('❌ Redis init failed:', error);
    return null;
  }
}

export function getCache(key: string): Promise<string | null> {
  const client = getRedis();
  if (!client) return Promise.resolve(null);
  return client.get(key);
}

export async function setCache(key: string, value: string, ttlSeconds = 300): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.setex(key, ttlSeconds, value);
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.del(key);
}

export function clearCachePattern(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return Promise.resolve();

  return new Promise((resolve) => {
    const stream = client.scanStream({
      match: pattern,
      count: 100,
    });

    stream.on('data', (keys: string[]) => {
      if (keys.length > 0) {
        client.del(...keys);
      }
    });

    stream.on('end', () => resolve());
    stream.on('error', () => resolve());
  });
}

export const CACHE_KEYS = {
  user: (id: string) => `user:${id}`,
  tree: (id: string) => `tree:${id}`,
  dashboard: (id: string) => `dashboard:${id}`,
  stats: () => 'stats:global',
};

export const CACHE_TTL = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  session: 604800, // 7 days
};
