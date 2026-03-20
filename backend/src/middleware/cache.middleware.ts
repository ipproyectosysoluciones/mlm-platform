import { Request, Response, NextFunction } from 'express';
import { getCache, setCache, deleteCache, CACHE_KEYS, CACHE_TTL } from '../config/redis';

export { CACHE_KEYS, CACHE_TTL };

export interface CacheOptions {
  key: string | ((req: Request) => string);
  ttl?: number;
  enabled?: boolean;
}

export function cacheMiddleware(options: CacheOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (options.enabled === false) return next();

    const cacheKey = typeof options.key === 'function' ? options.key(req) : options.key;

    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }

      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = (data: unknown) => {
        if (res.statusCode === 200) {
          setCache(cacheKey, JSON.stringify(data), options.ttl || CACHE_TTL.medium);
        }
        return originalJson(data);
      };

      next();
    } catch {
      next();
    }
  };
}

export async function invalidateCache(key: string | string[]): Promise<void> {
  const keys = Array.isArray(key) ? key : [key];
  await Promise.all(keys.map((k) => deleteCache(k)));
}
