/**
 * @fileoverview React 19 data fetching hooks
 * @description Hooks for data fetching with Suspense support using React 19 use() pattern
 *              Hooks para fetching de datos con soporte para Suspense usando React 19
 * @module hooks/useData
 */

import { use, useState, useEffect } from 'react';

interface UseDataOptions<T> {
  fetcher: () => Promise<T>;
  fallback?: T;
}

interface UseDataResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for async data fetching with loading and error states
 * @template T - Type of data being fetched
 * @param options - Configuration object with fetcher and optional fallback
 * @returns Object with data, error, isLoading states and refetch function
 */
export function useData<T>({ fetcher, fallback }: UseDataOptions<T>): UseDataResult<T> {
  const [data, setData] = useState<T | null>(fallback ?? null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err as Error);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  return { data, error, isLoading, refetch };
}

/**
 * Promise-based use() pattern for React 19
 * This hook suspends until the promise resolves
 * @template T - Type of the promise result
 * @param promise - Promise or function that returns a Promise
 * @returns The resolved promise value
 * @throws Will throw if the promise rejects
 */
export function usePromise<T>(promise: Promise<T> | (() => Promise<T>)): T {
  return use(typeof promise === 'function' ? promise() : promise);
}

/**
 * Hook for managing multiple async data sources
 * @template T - Type of data being fetched
 * @param promises - Array of promises to resolve
 * @returns Array of resolved data in the same order as input
 */
export function usePromises<T>(promises: Promise<T>[]): T[] {
  return use(Promise.all(promises));
}

/**
 * Hook for data that can be refetched
 * @template T - Type of data being fetched
 * @param fetcher - Function that fetches the data
 * @param deps - Dependencies that trigger refetch
 * @returns Object with data, refetch function, and loading state
 */
export function useRefetchableData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): {
  data: T | null;
  refetch: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, refetch, isLoading, error };
}
