/**
 * @fileoverview Data preloading utilities for critical app data
 * @description Utilities for preloading critical data during app initialization
 *              Utilidades para precargar datos críticos durante la inicialización de la app
 * @module lib/preload
 */

/**
 * Map to store preloaded data
 */
const preloadedData = new Map<string, unknown>();

/**
 * Preload critical data during app initialization
 * @template T - Type of data to preload
 * @param key - Unique key for the preloaded data
 * @param fetcher - Function that returns a Promise with the data
 *
 * @example
 * preloadData('user', () => api.getCurrentUser());
 * preloadData('config', () => api.getConfig());
 */
export function preloadData<T>(key: string, fetcher: () => Promise<T>): void {
  if (!preloadedData.has(key)) {
    preloadedData.set(key, fetcher());
  }
}

/**
 * Get preloaded data by key
 * @template T - Type of the preloaded data
 * @param key - Key of the preloaded data
 * @returns The preloaded data or undefined if not found
 * @throws Will throw if the data is still loading (promise pending)
 *
 * @example
 * const user = getPreloadedData<User>('user');
 */
export function getPreloadedData<T>(key: string): T | undefined {
  const data = preloadedData.get(key);
  if (data instanceof Promise) {
    throw data; // Let Suspense handle the promise
  }
  return data as T;
}

/**
 * Check if data has been preloaded
 * @param key - Key to check
 * @returns True if data exists and is not a pending promise
 */
export function hasPreloadedData(key: string): boolean {
  const data = preloadedData.get(key);
  return data !== undefined && !(data instanceof Promise);
}

/**
 * Get preloaded data or return fallback
 * @template T - Type of the preloaded data
 * @param key - Key of the preloaded data
 * @param fallback - Fallback value if data not found
 * @returns The preloaded data or fallback value
 */
export function getPreloadedDataOrFallback<T>(key: string, fallback: T): T {
  const data = preloadedData.get(key);
  if (data instanceof Promise) {
    return fallback;
  }
  return (data as T) ?? fallback;
}

/**
 * Clear all preloaded data
 * Useful for logout or app reset
 */
export function clearPreloadedData(): void {
  preloadedData.clear();
}

/**
 * Remove specific preloaded data
 * @param key - Key to remove
 */
export function removePreloadedData(key: string): void {
  preloadedData.delete(key);
}

/**
 * Get all preloaded data keys
 * @returns Array of preloaded data keys
 */
export function getPreloadedKeys(): string[] {
  return Array.from(preloadedData.keys());
}

/**
 * Preload multiple data sources at once
 * @template T - Type of data map
 * @param dataMap - Object with keys and fetchers
 *
 * @example
 * await preloadMultiple({
 *   user: () => api.getCurrentUser(),
 *   config: () => api.getConfig(),
 *   stats: () => api.getDashboardStats(),
 * });
 */
export async function preloadMultiple<T extends Record<string, () => Promise<unknown>>>(
  dataMap: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const keys = Object.keys(dataMap) as (keyof T)[];

  for (const key of keys) {
    preloadData(key as string, dataMap[key]);
  }

  // Wait for all data to resolve
  const entries = await Promise.all(
    keys.map(async (key) => {
      const data = preloadedData.get(key as string);
      return [key, data instanceof Promise ? await data : data] as const;
    })
  );

  const result = {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
  for (const [key, value] of entries) {
    result[key as keyof T] = value as Awaited<ReturnType<T[keyof T]>>;
  }

  return result;
}
