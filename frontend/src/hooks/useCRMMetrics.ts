/**
 * @fileoverview useCRMMetrics — CRM stats/metrics fetching
 * @description Encapsulates loading CRM dashboard metrics (total leads, won,
 *              in-progress, conversion rate). Extracted from CRM.tsx's `loadStats()`.
 *
 * ES: Hook que encapsula la carga de métricas del dashboard de CRM (total leads,
 *     ganados, en progreso, tasa de conversión). Extraído de `loadStats()` de CRM.tsx.
 * EN: Hook encapsulating loading CRM dashboard metrics (total leads, won,
 *     in-progress, conversion rate). Extracted from CRM.tsx's `loadStats()`.
 *
 * @module hooks/useCRMMetrics
 */

import { useState, useCallback } from 'react';
import { crmService } from '../services/api';
import type { CRMStats } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseCRMMetricsResult {
  /** CRM stats (total, won, in-progress, conversion) / Estadísticas de CRM */
  stats: CRMStats | null;
  /** Whether stats are loading / Si las estadísticas se están cargando */
  isLoading: boolean;
  /** Error from last fetch / Error del último intento de carga */
  error: Error | null;
  /** Load stats from the API / Cargar estadísticas desde la API */
  loadStats: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for fetching CRM dashboard metrics.
 *
 * @returns {UseCRMMetricsResult} Stats, loading/error state, and load function
 */
export function useCRMMetrics(): UseCRMMetricsResult {
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await crmService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load CRM stats');
      setError(errorObj);
      console.error('Failed to load stats:', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { stats, isLoading, error, loadStats };
}
