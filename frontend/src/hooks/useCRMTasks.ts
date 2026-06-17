/**
 * @fileoverview useCRMTasks — all-tasks loading with loading/error state
 * @description Encapsulates loading all upcoming CRM tasks and managing
 *              loading/error state. Extracted from CRM.tsx's `loadAllTasks()` logic.
 *
 * ES: Hook que encapsula la carga de todas las tareas próximas de CRM y el
 *     manejo del estado de carga/error. Extraído de la lógica `loadAllTasks()` de CRM.tsx.
 * EN: Hook encapsulating loading all upcoming CRM tasks and managing
 *     loading/error state. Extracted from CRM.tsx's `loadAllTasks()` logic.
 *
 * @module hooks/useCRMTasks
 */

import { useState, useCallback } from 'react';
import { crmService } from '../services/api';
import type { Task } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseCRMTasksResult {
  /** All upcoming tasks / Todas las tareas próximas */
  allTasks: Task[];
  /** Whether tasks are currently loading / Si las tareas se están cargando */
  tasksLoading: boolean;
  /** Error from last fetch attempt / Error del último intento de carga */
  error: Error | null;
  /** Reload all tasks / Recargar todas las tareas */
  loadAllTasks: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for loading all upcoming CRM tasks.
 *
 * @returns {UseCRMTasksResult} Tasks array, loading/error state, and reload function
 */
export function useCRMTasks(): UseCRMTasksResult {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadAllTasks = useCallback(async () => {
    setTasksLoading(true);
    setError(null);
    try {
      const response = await crmService.getUpcomingTasks();
      if (response.success) {
        setAllTasks(response.data || []);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load tasks');
      setError(errorObj);
      console.error('Failed to load tasks:', errorObj);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  return { allTasks, tasksLoading, error, loadAllTasks };
}
