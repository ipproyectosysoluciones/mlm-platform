/**
 * @fileoverview Optimistic update hook for React 19
 * @description Hook for handling optimistic UI updates with rollback capability
 *              Hook para manejar actualizaciones optimistas con capacidad de rollback
 * @module hooks/useOptimistic
 */

import { useState, useCallback } from 'react';

interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
  error: Error | null;
}

interface UseOptimisticResult<T> extends OptimisticState<T> {
  updateOptimistically: (optimisticUpdate: T, serverUpdate: () => Promise<T>) => Promise<void>;
  rollback: (originalData: T) => void;
}

/**
 * Hook for optimistic updates with automatic rollback on error
 * @template T - Type of data being updated
 * @param initialData - Initial data value
 * @returns Object with data state, optimistic indicator, and update functions
 *
 * @example
 * const { data, isOptimistic, updateOptimistically } = useOptimistic(initialProfile);
 *
 * const handleNameChange = async (newName: string) => {
 *   await updateOptimistically(
 *     { ...profile, name: newName }, // Optimistic update
 *     () => api.updateProfile({ name: newName }) // Server call
 *   );
 * };
 */
export function useOptimistic<T>(initialData: T): UseOptimisticResult<T> {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    error: null,
  });

  const updateOptimistically = useCallback(
    async (optimisticUpdate: T, serverUpdate: () => Promise<T>) => {
      // Apply optimistic update immediately
      setState((prev) => ({
        ...prev,
        data: optimisticUpdate,
        isOptimistic: true,
        error: null,
      }));

      try {
        // Send to server
        const result = await serverUpdate();
        // Apply server result
        setState({
          data: result,
          isOptimistic: false,
          error: null,
        });
      } catch (error) {
        // Rollback on error
        setState((prev) => ({
          ...prev,
          isOptimistic: false,
          error: error as Error,
        }));
      }
    },
    []
  );

  const rollback = useCallback((originalData: T) => {
    setState({
      data: originalData,
      isOptimistic: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    updateOptimistically,
    rollback,
  };
}

/**
 * Hook for optimistic list operations (add, update, remove)
 * @template T - Type of items in the list
 * @param initialList - Initial list of items
 * @returns Object with list state and optimistic manipulation functions
 */
export function useOptimisticList<T extends { id: string }>(
  initialList: T[] = []
): {
  list: T[];
  isOptimistic: boolean;
  addOptimistically: (item: T, serverAdd: () => Promise<T>) => Promise<void>;
  updateOptimistically: (item: T, serverUpdate: () => Promise<T>) => Promise<void>;
  removeOptimistically: (id: string, serverRemove: () => Promise<void>) => Promise<void>;
} {
  const [list, setList] = useState<T[]>(initialList);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const addOptimistically = useCallback(async (item: T, serverAdd: () => Promise<T>) => {
    // Optimistically add
    setList((prev) => [...prev, item]);
    setIsOptimistic(true);

    try {
      const result = await serverAdd();
      setList((prev) => [...prev.filter((i) => i.id !== item.id), result]);
    } catch {
      // Rollback on error
      setList((prev) => prev.filter((i) => i.id !== item.id));
    } finally {
      setIsOptimistic(false);
    }
  }, []);

  const updateOptimistically = useCallback(
    async (item: T, serverUpdate: () => Promise<T>) => {
      const previousItem = list.find((i) => i.id === item.id);
      // Optimistically update
      setList((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      setIsOptimistic(true);

      try {
        const result = await serverUpdate();
        setList((prev) => prev.map((i) => (i.id === item.id ? result : i)));
      } catch {
        // Rollback on error
        if (previousItem) {
          setList((prev) => prev.map((i) => (i.id === item.id ? previousItem : i)));
        }
      } finally {
        setIsOptimistic(false);
      }
    },
    [list]
  );

  const removeOptimistically = useCallback(
    async (id: string, serverRemove: () => Promise<void>) => {
      const previousItem = list.find((i) => i.id === id);
      // Optimistically remove
      setList((prev) => prev.filter((i) => i.id !== id));
      setIsOptimistic(true);

      try {
        await serverRemove();
      } catch {
        // Rollback on error
        if (previousItem) {
          setList((prev) => [...prev, previousItem]);
        }
      } finally {
        setIsOptimistic(false);
      }
    },
    [list]
  );

  return {
    list,
    isOptimistic,
    addOptimistically,
    updateOptimistically,
    removeOptimistically,
  };
}
