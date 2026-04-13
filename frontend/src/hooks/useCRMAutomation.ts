/**
 * @fileoverview useCRMAutomation — polling hook for n8n automation dashboard data
 * @description Fetches automation status and executions on mount, then polls every 60 seconds.
 *              Uses the generic usePolling hook for interval management.
 *
 * ES: Hook de polling para datos del dashboard de automatización n8n.
 *     Consulta estado y ejecuciones al montar, luego cada 60 segundos.
 *     Usa el hook genérico usePolling para manejar el intervalo.
 * EN: Polling hook for n8n automation dashboard data.
 *     Fetches status and executions on mount, then every 60 seconds.
 *     Uses the generic usePolling hook for interval management.
 *
 * @module hooks/useCRMAutomation
 */

import { useState, useCallback } from 'react';
import { crmService } from '../services/crmService';
import type { AutomationStatus, WorkflowExecutionRecord } from '../services/crmService';
import { usePolling } from './usePolling';

/** Polling interval in milliseconds (60 seconds) / Intervalo de polling en ms (60 segundos) */
const POLL_INTERVAL_MS = 60_000;

/**
 * Return type for the useCRMAutomation hook.
 * Tipo de retorno del hook useCRMAutomation.
 */
export interface UseCRMAutomationResult {
  status: AutomationStatus | null;
  executions: WorkflowExecutionRecord[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook that polls CRM automation status and recent executions.
 *
 * ES: Hook que hace polling del estado de automatización CRM y ejecuciones recientes.
 * EN: Hook that polls CRM automation status and recent executions.
 *
 * @returns {UseCRMAutomationResult} Automation data, loading state, error, and refetch function
 */
export function useCRMAutomation(): UseCRMAutomationResult {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecutionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusResult, executionsResult] = await Promise.all([
        crmService.getAutomationStatus(),
        crmService.getAutomationExecutions(),
      ]);
      setStatus(statusResult);
      setExecutions(executionsResult.data);
      setTotal(executionsResult.total);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  usePolling(fetchData, { intervalMs: POLL_INTERVAL_MS });

  return { status, executions, total, isLoading, error, refetch: fetchData };
}
