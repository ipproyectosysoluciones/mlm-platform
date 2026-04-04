/**
 * @fileoverview Email Campaign Store - Zustand store for email campaign state management
 * @description Manages email templates, campaigns, sending, monitoring, and logs
 *              Gestiona plantillas de email, campañas, envíos, monitoreo y logs
 * @module stores/emailCampaignStore
 * @author MLM Platform
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  EmailTemplate,
  EmailTemplateCreatePayload,
  EmailCampaign,
  EmailCampaignDetail,
  EmailCampaignCreatePayload,
  EmailCampaignStatus,
  CampaignLogEntry,
  CampaignLogsParams,
  RetryFailedResponse,
} from '../types';
import { emailCampaignService } from '../services/emailCampaignService';

// ============================================
// Types / Tipos
// ============================================

interface EmailCampaignState {
  // Template data / Datos de plantillas
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;

  // Campaign data / Datos de campañas
  campaigns: EmailCampaign[];
  selectedCampaign: EmailCampaignDetail | null;
  activeTab: EmailCampaignStatus | 'all';

  // Logs / Logs
  campaignLogs: CampaignLogEntry[];
  logsTotal: number;

  // UI State / Estado de UI
  isLoading: boolean;
  isCreatingTemplate: boolean;
  isCreatingCampaign: boolean;
  isSending: boolean;
  isRetrying: boolean;
  isLoadingLogs: boolean;
  error: string | null;
  templateError: string | null;
  campaignError: string | null;

  // Polling / Polling
  pollingInterval: ReturnType<typeof setInterval> | null;

  // Template Actions / Acciones de plantillas
  createTemplate: (data: EmailTemplateCreatePayload) => Promise<EmailTemplate>;
  fetchTemplates: () => Promise<void>;
  selectTemplate: (template: EmailTemplate | null) => void;

  // Campaign Actions / Acciones de campañas
  createCampaign: (data: EmailCampaignCreatePayload) => Promise<EmailCampaign>;
  fetchCampaigns: (status?: string) => Promise<void>;
  fetchCampaignDetail: (id: string) => Promise<void>;
  sendCampaign: (id: string, sendNow: boolean) => Promise<EmailCampaign>;
  retryFailed: (id: string) => Promise<RetryFailedResponse>;
  setActiveTab: (tab: EmailCampaignStatus | 'all') => void;

  // Logs Actions / Acciones de logs
  fetchCampaignLogs: (id: string, params?: CampaignLogsParams) => Promise<void>;

  // Polling Actions / Acciones de polling
  startPolling: (campaignId: string, intervalMs?: number) => void;
  stopPolling: () => void;

  // Utils
  clearErrors: () => void;
  reset: () => void;
}

// ============================================
// Initial State / Estado inicial
// ============================================

const initialState = {
  templates: [],
  selectedTemplate: null,
  campaigns: [],
  selectedCampaign: null,
  activeTab: 'all' as EmailCampaignStatus | 'all',
  campaignLogs: [],
  logsTotal: 0,
  isLoading: false,
  isCreatingTemplate: false,
  isCreatingCampaign: false,
  isSending: false,
  isRetrying: false,
  isLoadingLogs: false,
  error: null,
  templateError: null,
  campaignError: null,
  pollingInterval: null,
};

// ============================================
// Store / Store
// ============================================

export const useEmailCampaignStore = create<EmailCampaignState>((set, get) => ({
  ...initialState,

  // ==========================================
  // Template Actions / Acciones de plantillas
  // ==========================================

  /**
   * Create a new email template
   * Crear una nueva plantilla de email
   */
  createTemplate: async (data: EmailTemplateCreatePayload) => {
    set({ isCreatingTemplate: true, templateError: null });
    try {
      const template = await emailCampaignService.createTemplate(data);
      set((state) => ({
        templates: [template, ...state.templates],
        selectedTemplate: template,
        isCreatingTemplate: false,
      }));
      return template;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create template';
      set({ templateError: message, isCreatingTemplate: false });
      throw error;
    }
  },

  /**
   * Fetch all email templates
   * Obtener todas las plantillas de email
   */
  fetchTemplates: async () => {
    set({ isLoading: true, templateError: null });
    try {
      const templates = await emailCampaignService.listTemplates();
      set({ templates, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch templates';
      set({ templateError: message, isLoading: false });
    }
  },

  /**
   * Select a template for editing
   * Seleccionar una plantilla para editar
   */
  selectTemplate: (template: EmailTemplate | null) => {
    set({ selectedTemplate: template });
  },

  // ==========================================
  // Campaign Actions / Acciones de campañas
  // ==========================================

  /**
   * Create a new email campaign
   * Crear una nueva campaña de email
   */
  createCampaign: async (data: EmailCampaignCreatePayload) => {
    set({ isCreatingCampaign: true, campaignError: null });
    try {
      const campaign = await emailCampaignService.createCampaign(data);
      set((state) => ({
        campaigns: [campaign, ...state.campaigns],
        isCreatingCampaign: false,
      }));
      return campaign;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create campaign';
      set({ campaignError: message, isCreatingCampaign: false });
      throw error;
    }
  },

  /**
   * Fetch campaigns with optional status filter
   * Obtener campañas con filtro de estado opcional
   */
  fetchCampaigns: async (status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const campaigns = await emailCampaignService.listCampaigns(status);
      set({ campaigns, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch campaigns';
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Fetch detailed campaign info with stats
   * Obtener información detallada de campaña con estadísticas
   */
  fetchCampaignDetail: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const campaign = await emailCampaignService.getCampaign(id);
      set({ selectedCampaign: campaign, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch campaign details';
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Send or schedule a campaign
   * Enviar o programar una campaña
   */
  sendCampaign: async (id: string, sendNow: boolean) => {
    set({ isSending: true, campaignError: null });
    try {
      const campaign = await emailCampaignService.sendCampaign(id, { sendNow });
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...campaign } : c)),
        isSending: false,
      }));
      return campaign;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send campaign';
      set({ campaignError: message, isSending: false });
      throw error;
    }
  },

  /**
   * Retry failed emails for a campaign
   * Reintentar emails fallidos de una campaña
   */
  retryFailed: async (id: string) => {
    set({ isRetrying: true, campaignError: null });
    try {
      const result = await emailCampaignService.retryFailed(id);
      set({ isRetrying: false });
      // Refresh campaign detail after retry
      get().fetchCampaignDetail(id);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retry emails';
      set({ campaignError: message, isRetrying: false });
      throw error;
    }
  },

  /**
   * Set the active status tab filter
   * Establecer el filtro de tab de estado activo
   */
  setActiveTab: (tab: EmailCampaignStatus | 'all') => {
    set({ activeTab: tab });
    const status = tab === 'all' ? undefined : tab;
    get().fetchCampaigns(status);
  },

  // ==========================================
  // Logs Actions / Acciones de logs
  // ==========================================

  /**
   * Fetch campaign delivery logs
   * Obtener logs de entrega de campaña
   */
  fetchCampaignLogs: async (id: string, params?: CampaignLogsParams) => {
    set({ isLoadingLogs: true, error: null });
    try {
      const response = await emailCampaignService.getCampaignLogs(id, params);
      set({
        campaignLogs: response.data,
        logsTotal: response.pagination.total,
        isLoadingLogs: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch campaign logs';
      set({ error: message, isLoadingLogs: false });
    }
  },

  // ==========================================
  // Polling Actions / Acciones de polling
  // ==========================================

  /**
   * Start polling campaign stats every N ms (default 10s)
   * Iniciar polling de estadísticas de campaña cada N ms (default 10s)
   */
  startPolling: (campaignId: string, intervalMs = 10_000) => {
    const state = get();
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval);
    }

    const interval = setInterval(() => {
      get().fetchCampaignDetail(campaignId);
    }, intervalMs);

    set({ pollingInterval: interval });
  },

  /**
   * Stop polling
   * Detener polling
   */
  stopPolling: () => {
    const state = get();
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval);
      set({ pollingInterval: null });
    }
  },

  // ==========================================
  // Utils
  // ==========================================

  /**
   * Clear all errors
   * Limpiar todos los errores
   */
  clearErrors: () => set({ error: null, templateError: null, campaignError: null }),

  /**
   * Reset store to initial state
   * Resetear el store al estado inicial
   */
  reset: () => {
    const state = get();
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval);
    }
    set(initialState);
  },
}));

// ============================================
// Selector Hooks / Hooks selectores
// ============================================

/**
 * Hook for template state and actions
 * Hook para estado y acciones de plantillas
 */
export const useEmailTemplates = () =>
  useEmailCampaignStore(
    useShallow((state) => ({
      templates: state.templates,
      selectedTemplate: state.selectedTemplate,
      isLoading: state.isLoading,
      isCreatingTemplate: state.isCreatingTemplate,
      templateError: state.templateError,
      createTemplate: state.createTemplate,
      fetchTemplates: state.fetchTemplates,
      selectTemplate: state.selectTemplate,
      clearErrors: state.clearErrors,
    }))
  );

/**
 * Hook for campaign list state
 * Hook para estado de lista de campañas
 */
export const useEmailCampaigns = () =>
  useEmailCampaignStore(
    useShallow((state) => ({
      campaigns: state.campaigns,
      activeTab: state.activeTab,
      isLoading: state.isLoading,
      isCreatingCampaign: state.isCreatingCampaign,
      error: state.error,
      campaignError: state.campaignError,
      fetchCampaigns: state.fetchCampaigns,
      createCampaign: state.createCampaign,
      setActiveTab: state.setActiveTab,
      clearErrors: state.clearErrors,
    }))
  );

/**
 * Hook for campaign monitoring state
 * Hook para estado de monitoreo de campañas
 */
export const useEmailCampaignMonitor = () =>
  useEmailCampaignStore(
    useShallow((state) => ({
      selectedCampaign: state.selectedCampaign,
      isLoading: state.isLoading,
      isSending: state.isSending,
      isRetrying: state.isRetrying,
      campaignError: state.campaignError,
      fetchCampaignDetail: state.fetchCampaignDetail,
      sendCampaign: state.sendCampaign,
      retryFailed: state.retryFailed,
      startPolling: state.startPolling,
      stopPolling: state.stopPolling,
    }))
  );

/**
 * Hook for campaign logs state
 * Hook para estado de logs de campañas
 */
export const useEmailCampaignLogs = () =>
  useEmailCampaignStore(
    useShallow((state) => ({
      campaignLogs: state.campaignLogs,
      logsTotal: state.logsTotal,
      isLoadingLogs: state.isLoadingLogs,
      error: state.error,
      fetchCampaignLogs: state.fetchCampaignLogs,
    }))
  );

export default useEmailCampaignStore;
