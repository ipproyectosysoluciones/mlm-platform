/**
 * @fileoverview Redis Configuration - Cache management with ioredis
 * @description Redis connection management and caching utilities for MLM platform.
 *             Gestión de conexión Redis y utilidades de cache para plataforma MLM.
 * @module config/redis
 * @author MLM Development Team
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Get or create Redis client connection
 * Obtiene o crea una conexión de cliente Redis
 *
 * Creates a singleton Redis connection with configurable retry strategy.
 * If REDIS_ENABLED is not 'true', returns null gracefully.
 *
 * @returns {Redis | null} Redis client instance or null if disabled
 * @example
 * // English: Get Redis client for caching operations
 * const redis = getRedis();
 * if (redis) {
 *   await redis.set('key', 'value');
 * }
 *
 * // Español: Obtener cliente Redis para operaciones de cache
 * const redis = getRedis();
 * if (redis) {
 *   await redis.set('key', 'value');
 * }
 */
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

/**
 * Get cached value by key
 * Obtiene un valor cacheado por clave
 *
 * Retrieves a cached string value from Redis.
 * Returns null if Redis is disabled or key doesn't exist.
 *
 * @param {string} key - Cache key / Clave de cache
 * @returns {Promise<string | null>} Cached value or null / Valor cacheado o null
 * @example
 * // English: Get user data from cache
 * const userData = await getCache('user:123');
 * if (userData) {
 *   return JSON.parse(userData);
 * }
 *
 * // Español: Obtener datos de usuario del cache
 * const userData = await getCache('user:123');
 * if (userData) {
 *   return JSON.parse(userData);
 * }
 */
export function getCache(key: string): Promise<string | null> {
  const client = getRedis();
  if (!client) return Promise.resolve(null);
  return client.get(key);
}

/**
 * Set cached value with TTL (Time To Live)
 * Establece un valor en cache con TTL (Tiempo de Vida)
 *
 * Stores a string value in Redis with automatic expiration.
 * Uses SETEX command for atomic set-and-expire operation.
 *
 * @param {string} key - Cache key / Clave de cache
 * @param {string} value - Value to cache / Valor a cachear
 * @param {number} ttlSeconds - Time to live in seconds (default: 300 / 5 min) / TTL en segundos
 * @returns {Promise<void>} Resolves when complete / Se resuelve al completar
 * @example
 * // English: Cache user session for 1 hour
 * await setCache('session:abc123', JSON.stringify(userData), 3600);
 *
 * // Español: Cachear sesión de usuario por 1 hora
 * await setCache('session:abc123', JSON.stringify(userData), 3600);
 */
export async function setCache(key: string, value: string, ttlSeconds = 300): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.setex(key, ttlSeconds, value);
}

/**
 * Delete cached value by key
 * Elimina un valor cacheado por clave
 *
 * Removes a specific key from Redis cache.
 * Use this to invalidate specific cache entries.
 *
 * @param {string} key - Cache key to delete / Clave de cache a eliminar
 * @returns {Promise<void>} Resolves when complete / Se resuelve al completar
 * @example
 * // English: Invalidate user cache on profile update
 * await deleteCache('user:123');
 *
 * // Español: Invalidar cache de usuario al actualizar perfil
 * await deleteCache('user:123');
 */
export async function deleteCache(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.del(key);
}

/**
 * Clear all cache keys matching a pattern
 * Limpia todas las claves de cache que coinciden con un patrón
 *
 * Uses Redis SCAN to find all keys matching the pattern,
 * then deletes them in batches. Non-blocking operation.
 *
 * @param {string} pattern - Redis key pattern (e.g., 'user:*', 'session:*') / Patrón de claves Redis
 * @returns {Promise<void>} Resolves when all matching keys are deleted / Se resuelve al eliminar todas las claves
 * @example
 * // English: Clear all user-related cache
 * await clearCachePattern('user:*');
 *
 * // Español: Limpiar todo el cache relacionado con usuarios
 * await clearCachePattern('user:*');
 */
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

/**
 * @constant {Object} CACHE_KEYS
 * @description Cache key generators for consistent naming convention
 *              Generadores de claves de cache para convención de nombres consistente
 *
 * Use these functions to generate cache keys to ensure consistency
 * across the application and avoid naming conflicts.
 *
 * @example
 * // English: Generate cache key for user
 * const userKey = CACHE_KEYS.user('123'); // 'user:123'
 *
 * // Español: Generar clave de cache para usuario
 * const userKey = CACHE_KEYS.user('123'); // 'user:123'
 */
export const CACHE_KEYS = {
  user: (id: string) => `user:${id}`,
  tree: (id: string) => `tree:${id}`,
  dashboard: (id: string) => `dashboard:${id}`,
  stats: () => 'stats:global',
};

/**
 * @constant {Object} CACHE_TTL
 * @description Time-to-live constants for cache expiration
 *              Constantes de tiempo de vida para expiración de cache
 *
 * Use these constants when setting cache TTL to ensure consistent
 * expiration times across the application.
 *
 * @property {number} short - 1 minute (60 seconds) / 1 minuto
 * @property {number} medium - 5 minutes (300 seconds) / 5 minutos
 * @property {number} long - 1 hour (3600 seconds) / 1 hora
 * @property {number} session - 7 days (604800 seconds) / 7 días
 *
 * @example
 * // English: Cache dashboard stats for 5 minutes
 * await setCache(CACHE_KEYS.dashboard('1'), data, CACHE_TTL.medium);
 *
 * // Español: Cachear estadísticas de dashboard por 5 minutos
 * await setCache(CACHE_KEYS.dashboard('1'), data, CACHE_TTL.medium);
 */
export const CACHE_TTL = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  session: 604800, // 7 days
};
