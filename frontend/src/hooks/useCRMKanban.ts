/**
 * @fileoverview useCRMKanban — kanban board data and drag-and-drop status updates
 * @description Encapsulates loading leads for kanban display, grouping by status,
 *              and handling drag-and-drop status changes. Abstracts the kanban
 *              state management for the KanbanBoard component.
 *
 * ES: Hook que encapsula la carga de leads para visualización kanban,
 *     agrupación por estado y manejo de cambios de estado por drag-and-drop.
 * EN: Hook encapsulating loading leads for kanban display, grouping by status,
 *     and handling drag-and-drop status changes.
 *
 * @module hooks/useCRMKanban
 */

import { useState, useEffect, useCallback } from 'react';
import { crmService } from '../services/crmService';
import type { Lead, LeadStatus, LeadStats } from '../services/crmService';

// ============================================================================
// Types
// ============================================================================

export interface UseCRMKanbanResult {
  /** All leads for the kanban board / Todos los leads para el tablero */
  leads: Lead[];
  /** Kanban stats summary / Resumen de estadísticas del kanban */
  stats: LeadStats | null;
  /** Whether data is loading / Si los datos se están cargando */
  isLoading: boolean;
  /** Error from last fetch / Error del último intento de carga */
  error: Error | null;
  /** Filter leads by status / Filtrar leads por estado */
  getLeadsByStatus: (status: LeadStatus) => Lead[];
  /** Handle drag-and-drop status change / Manejar cambio de estado por drag-and-drop */
  handleDragEnd: (leadId: string, newStatus: LeadStatus) => Promise<void>;
  /** Reload all kanban data / Recargar todos los datos del kanban */
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for kanban board data management.
 *
 * @returns {UseCRMKanbanResult} Kanban leads, stats, loading state, and actions
 */
export function useCRMKanban(): UseCRMKanbanResult {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCRMData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leadsData, statsData] = await Promise.all([
        crmService.getLeads({ limit: 100 }),
        crmService.getStats(),
      ]);
      setLeads(leadsData.leads);
      setStats(statsData);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load kanban data');
      setError(errorObj);
      console.error('Failed to load CRM data:', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCRMData();
  }, [loadCRMData]);

  const getLeadsByStatus = useCallback(
    (status: LeadStatus): Lead[] => {
      return leads.filter((lead) => lead.status === status);
    },
    [leads]
  );

  const handleDragEnd = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    try {
      await crmService.updateLeadStatus(leadId, newStatus);
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead))
      );
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  }, []);

  return {
    leads,
    stats,
    isLoading,
    error,
    getLeadsByStatus,
    handleDragEnd,
    refetch: loadCRMData,
  };
}
