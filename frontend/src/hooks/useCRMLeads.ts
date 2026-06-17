/**
 * @fileoverview useCRMLeads — lead CRUD, filtering, and detail loading
 * @description Encapsulates lead list state, filter state, CRUD operations,
 *              lead detail loading (with tasks + communications), status changes,
 *              task completion, and CSV export logic extracted from CRM.tsx.
 *
 * ES: Hook que encapsula el estado de lista de leads, filtros, operaciones CRUD,
 *     carga de detalle (con tareas + comunicaciones), cambios de estado,
 *     finalización de tareas y exportación CSV extraídos de CRM.tsx.
 * EN: Hook encapsulating lead list state, filters, CRUD operations,
 *     detail loading (with tasks + communications), status changes,
 *     task completion, and CSV export extracted from CRM.tsx.
 *
 * @module hooks/useCRMLeads
 */

import { useState, useEffect, useCallback } from 'react';
import { crmService } from '../services/api';
import { initialLeadFormData } from '../components/crm';
import type { LeadFormData } from '../components/crm';
import type { Lead, Task, Communication } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseCRMLeadsResult {
  // Lead list
  leads: Lead[];
  leadsLoading: boolean;

  // Filters
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sourceFilter: string;
  setSourceFilter: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  valueMin: string;
  setValueMin: (value: string) => void;
  valueMax: string;
  setValueMax: (value: string) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (value: boolean) => void;

  // Lead detail
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  leadTasks: Task[];
  leadCommunications: Communication[];

  // Lead form
  showLeadForm: boolean;
  setShowLeadForm: (value: boolean) => void;
  leadFormData: LeadFormData;
  setLeadFormData: (value: LeadFormData) => void;
  editingLead: Lead | null;
  setEditingLead: (value: Lead | null) => void;

  // Email templates
  selectedTemplate: string;
  setSelectedTemplate: (value: string) => void;
  showEmailTemplates: boolean;
  setShowEmailTemplates: (value: boolean) => void;

  // Actions
  loadLeads: () => Promise<void>;
  loadLeadDetails: (leadId: string) => Promise<void>;
  handleCreateLead: () => Promise<void>;
  handleUpdateLead: () => Promise<void>;
  handleDeleteLead: (leadId: string) => Promise<void>;
  handleStatusChange: (leadId: string, newStatus: string) => Promise<void>;
  handleTaskComplete: (taskId: string, completed: boolean) => Promise<void>;
  handleExportLeads: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook encapsulating all lead-related state and operations from CRM.tsx.
 *
 * @returns {UseCRMLeadsResult} Lead state, setters, and action handlers
 */
export function useCRMLeads(): UseCRMLeadsResult {
  // ── Lead list ─────────────────────────────────────────────────────────
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  // ── Filters ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── Lead detail ──────────────────────────────────────────────────────
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadTasks, setLeadTasks] = useState<Task[]>([]);
  const [leadCommunications, setLeadCommunications] = useState<Communication[]>([]);

  // ── Lead form ────────────────────────────────────────────────────────
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState<LeadFormData>(initialLeadFormData);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // ── Email templates ──────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);

  // ── Load leads on filter change ──────────────────────────────────────
  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const params: {
        status?: string;
        source?: string;
        search?: string;
        createdAtFrom?: string;
        createdAtTo?: string;
        valueMin?: number;
        valueMax?: number;
        limit: number;
      } = {
        limit: 50,
      };
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (searchQuery) params.search = searchQuery;
      if (dateFrom) params.createdAtFrom = dateFrom;
      if (dateTo) params.createdAtTo = dateTo;
      if (valueMin) params.valueMin = parseFloat(valueMin);
      if (valueMax) params.valueMax = parseFloat(valueMax);

      const response = await crmService.getLeads(params);
      if (response.success) {
        setLeads(response.data.leads || []);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  }, [statusFilter, sourceFilter, searchQuery, dateFrom, dateTo, valueMin, valueMax]);

  // Auto-load leads when filters change
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // ── Load lead details ────────────────────────────────────────────────
  const loadLeadDetails = useCallback(async (leadId: string) => {
    try {
      const [leadRes, tasksRes, commsRes] = await Promise.all([
        crmService.getLead(leadId),
        crmService.getTasks(leadId),
        crmService.getCommunications(leadId),
      ]);

      if (leadRes.success) setSelectedLead(leadRes.data);
      if (tasksRes.success) setLeadTasks(tasksRes.data || []);
      if (commsRes.success) setLeadCommunications(commsRes.data || []);
    } catch (error) {
      console.error('Failed to load lead details:', error);
    }
  }, []);

  // ── Create lead ──────────────────────────────────────────────────────
  const handleCreateLead = useCallback(async () => {
    try {
      const response = await crmService.createLead(leadFormData);
      if (response.success) {
        await loadLeads();
        setShowLeadForm(false);
        setLeadFormData(initialLeadFormData);
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  }, [leadFormData, loadLeads]);

  // ── Update lead ──────────────────────────────────────────────────────
  const handleUpdateLead = useCallback(async () => {
    if (!editingLead) return;
    try {
      const response = await crmService.updateLead(editingLead.id, leadFormData);
      if (response.success) {
        await loadLeads();
        setEditingLead(null);
        setShowLeadForm(false);
        setLeadFormData(initialLeadFormData);
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  }, [editingLead, leadFormData, loadLeads]);

  // ── Delete lead ──────────────────────────────────────────────────────
  const handleDeleteLead = useCallback(
    async (leadId: string) => {
      try {
        const response = await crmService.deleteLead(leadId);
        if (response.success) {
          await loadLeads();
          if (selectedLead?.id === leadId) {
            setSelectedLead(null);
          }
        }
      } catch (error) {
        console.error('Failed to delete lead:', error);
      }
    },
    [loadLeads, selectedLead?.id]
  );

  // ── Change lead status ───────────────────────────────────────────────
  const handleStatusChange = useCallback(
    async (leadId: string, newStatus: string) => {
      try {
        const response = await crmService.updateLead(leadId, { status: newStatus });
        if (response.success) {
          await loadLeads();
          if (selectedLead?.id === leadId) {
            loadLeadDetails(leadId);
          }
        }
      } catch (error) {
        console.error('Failed to update lead status:', error);
      }
    },
    [loadLeads, loadLeadDetails, selectedLead?.id]
  );

  // ── Complete task ────────────────────────────────────────────────────
  const handleTaskComplete = useCallback(
    async (taskId: string, completed: boolean) => {
      try {
        const response = await crmService.updateTask(taskId, {
          status: completed ? 'completed' : 'pending',
        });
        if (response.success && selectedLead) {
          loadLeadDetails(selectedLead.id);
        }
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    },
    [loadLeadDetails, selectedLead]
  );

  // ── Export leads ────────────────────────────────────────────────────
  const handleExportLeads = useCallback(async () => {
    try {
      const blob = await crmService.exportLeads({
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        search: searchQuery || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [statusFilter, sourceFilter, searchQuery]);

  return {
    // Lead list
    leads,
    leadsLoading,

    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    valueMin,
    setValueMin,
    valueMax,
    setValueMax,
    showAdvancedFilters,
    setShowAdvancedFilters,

    // Lead detail
    selectedLead,
    setSelectedLead,
    leadTasks,
    leadCommunications,

    // Lead form
    showLeadForm,
    setShowLeadForm,
    leadFormData,
    setLeadFormData,
    editingLead,
    setEditingLead,

    // Email templates
    selectedTemplate,
    setSelectedTemplate,
    showEmailTemplates,
    setShowEmailTemplates,

    // Actions
    loadLeads,
    loadLeadDetails,
    handleCreateLead,
    handleUpdateLead,
    handleDeleteLead,
    handleStatusChange,
    handleTaskComplete,
    handleExportLeads,
  };
}
