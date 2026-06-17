/**
 * @fileoverview useCRMAnalytics — CRM analytics report and insights
 * @description Hook for fetching CRM analytics reports with period-based filtering
 *              and CSV export. Uses the analytics API endpoints from api.ts.
 *
 * ES: Hook para obtener reportes de analítica de CRM con filtrado por período
 *     y exportación CSV. Usa los endpoints de analítica de api.ts.
 * EN: Hook for fetching CRM analytics reports with period-based filtering
 *     and CSV export. Uses the analytics API endpoints from api.ts.
 *
 * @module hooks/useCRMAnalytics
 */

import { useState, useCallback } from 'react';
import { crmService } from '../services/api';

// ============================================================================
// Types
// ============================================================================

export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface AnalyticsReport {
  // The shape depends on the API response; using generic record for flexibility
  [key: string]: unknown;
}

export interface UseCRMAnalyticsResult {
  /** Report data / Datos del reporte */
  report: AnalyticsReport | null;
  /** Whether the report is loading / Si el reporte se está cargando */
  isLoading: boolean;
  /** Error from last fetch / Error del último intento de carga */
  error: Error | null;
  /** Selected period / Período seleccionado */
  period: AnalyticsPeriod;
  /** Set the analysis period / Establecer el período de análisis */
  setPeriod: (period: AnalyticsPeriod) => void;
  /** Custom date range start / Inicio de rango de fechas personalizado */
  dateFrom: string;
  /** Set custom date range start / Establecer inicio de rango de fechas */
  setDateFrom: (date: string) => void;
  /** Custom date range end / Fin de rango de fechas personalizado */
  dateTo: string;
  /** Set custom date range end / Establecer fin de rango de fechas */
  setDateTo: (date: string) => void;
  /** Fetch the analytics report / Obtener el reporte de analítica */
  fetchReport: () => Promise<void>;
  /** Export analytics report to CSV / Exportar reporte de analítica a CSV */
  exportReport: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for CRM analytics reports and insights.
 *
 * @returns {UseCRMAnalyticsResult} Report data, period state, and actions
 */
export function useCRMAnalytics(): UseCRMAnalyticsResult {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { period?: AnalyticsPeriod; dateFrom?: string; dateTo?: string } = {};
      if (dateFrom && dateTo) {
        params.dateFrom = dateFrom;
        params.dateTo = dateTo;
      } else {
        params.period = period;
      }

      const response = await crmService.getAnalyticsReport(params);
      if (response.success) {
        setReport(response.data);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load analytics report');
      setError(errorObj);
      console.error('Failed to load analytics report:', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [period, dateFrom, dateTo]);

  const exportReport = useCallback(async () => {
    try {
      const params: { period?: AnalyticsPeriod; dateFrom?: string; dateTo?: string } = {};
      if (dateFrom && dateTo) {
        params.dateFrom = dateFrom;
        params.dateTo = dateTo;
      } else {
        params.period = period;
      }

      const blob = await crmService.exportAnalyticsReport(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export analytics report:', err);
    }
  }, [period, dateFrom, dateTo]);

  return {
    report,
    isLoading,
    error,
    period,
    setPeriod,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    fetchReport,
    exportReport,
  };
}
