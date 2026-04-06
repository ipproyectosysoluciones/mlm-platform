/**
 * @fileoverview Email Campaign Service - API client for email campaign operations
 * @description Service for handling email templates, campaigns, sending, and monitoring
 *              Servicio para gestionar plantillas de email, campañas, envíos y monitoreo
 * @module services/emailCampaignService
 * @author Nexo Real Development Team
 */

import api from './api';
import type {
  EmailTemplate,
  EmailTemplateCreatePayload,
  EmailCampaign,
  EmailCampaignDetail,
  EmailCampaignCreatePayload,
  EmailCampaignSendPayload,
  CampaignLogsResponse,
  CampaignLogsParams,
  RetryFailedResponse,
} from '../types';

/**
 * @namespace emailCampaignService
 * @description Email Campaign API methods / Métodos de API de Email Campaign
 */
export const emailCampaignService = {
  // ==========================================
  // Templates / Plantillas
  // ==========================================

  /**
   * Create a new email template
   * Crear una nueva plantilla de email
   * @param {EmailTemplateCreatePayload} data - Template data / Datos de la plantilla
   * @returns {Promise<EmailTemplate>} Created template / Plantilla creada
   */
  createTemplate: async (data: EmailTemplateCreatePayload): Promise<EmailTemplate> => {
    const response = await api.post<{ success: boolean; data: EmailTemplate }>(
      '/email-templates',
      data
    );
    return response.data.data!;
  },

  /**
   * List all email templates
   * Listar todas las plantillas de email
   * @returns {Promise<EmailTemplate[]>} Templates list / Lista de plantillas
   */
  listTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await api.get<{ success: boolean; data: EmailTemplate[] }>('/email-templates');
    return response.data.data!;
  },

  /**
   * Get a template by ID
   * Obtener una plantilla por ID
   * @param {string} id - Template ID / ID de la plantilla
   * @returns {Promise<EmailTemplate>} Template / Plantilla
   */
  getTemplate: async (id: string): Promise<EmailTemplate> => {
    const response = await api.get<{ success: boolean; data: EmailTemplate }>(
      `/email-templates/${id}`
    );
    return response.data.data!;
  },

  /**
   * Update an email template
   * Actualizar una plantilla de email
   * @param {string} id - Template ID / ID de la plantilla
   * @param {Partial<EmailTemplateCreatePayload>} data - Updated fields / Campos actualizados
   * @returns {Promise<EmailTemplate>} Updated template / Plantilla actualizada
   */
  updateTemplate: async (
    id: string,
    data: Partial<EmailTemplateCreatePayload>
  ): Promise<EmailTemplate> => {
    const response = await api.put<{ success: boolean; data: EmailTemplate }>(
      `/email-templates/${id}`,
      data
    );
    return response.data.data!;
  },

  // ==========================================
  // Campaigns / Campañas
  // ==========================================

  /**
   * Create a new email campaign
   * Crear una nueva campaña de email
   * @param {EmailCampaignCreatePayload} data - Campaign data / Datos de la campaña
   * @returns {Promise<EmailCampaign>} Created campaign / Campaña creada
   */
  createCampaign: async (data: EmailCampaignCreatePayload): Promise<EmailCampaign> => {
    const response = await api.post<{ success: boolean; data: EmailCampaign }>(
      '/email-campaigns',
      data
    );
    return response.data.data!;
  },

  /**
   * List all campaigns with optional status filter
   * Listar todas las campañas con filtro de estado opcional
   * @param {string} [status] - Filter by status / Filtrar por estado
   * @returns {Promise<EmailCampaign[]>} Campaigns list / Lista de campañas
   */
  listCampaigns: async (status?: string): Promise<EmailCampaign[]> => {
    const params = status ? { status } : {};
    const response = await api.get<{ success: boolean; data: EmailCampaign[] }>(
      '/email-campaigns',
      { params }
    );
    return response.data.data!;
  },

  /**
   * Get campaign details with stats
   * Obtener detalles de campaña con estadísticas
   * @param {string} id - Campaign ID / ID de la campaña
   * @returns {Promise<EmailCampaignDetail>} Campaign detail / Detalle de campaña
   */
  getCampaign: async (id: string): Promise<EmailCampaignDetail> => {
    const response = await api.get<{ success: boolean; data: EmailCampaignDetail }>(
      `/email-campaigns/${id}`
    );
    return response.data.data!;
  },

  /**
   * Send or schedule a campaign
   * Enviar o programar una campaña
   * @param {string} id - Campaign ID / ID de la campaña
   * @param {EmailCampaignSendPayload} data - Send options / Opciones de envío
   * @returns {Promise<EmailCampaign>} Updated campaign / Campaña actualizada
   */
  sendCampaign: async (id: string, data: EmailCampaignSendPayload): Promise<EmailCampaign> => {
    const response = await api.post<{ success: boolean; data: EmailCampaign }>(
      `/email-campaigns/${id}/send`,
      data
    );
    return response.data.data!;
  },

  /**
   * Get campaign delivery logs
   * Obtener logs de entrega de campaña
   * @param {string} id - Campaign ID / ID de la campaña
   * @param {CampaignLogsParams} [params] - Query params / Parámetros de consulta
   * @returns {Promise<CampaignLogsResponse>} Logs response / Respuesta de logs
   */
  getCampaignLogs: async (
    id: string,
    params?: CampaignLogsParams
  ): Promise<CampaignLogsResponse> => {
    const response = await api.get<CampaignLogsResponse>(`/email-campaigns/${id}/logs`, { params });
    return response.data;
  },

  /**
   * Retry failed emails for a campaign
   * Reintentar emails fallidos de una campaña
   * @param {string} id - Campaign ID / ID de la campaña
   * @returns {Promise<RetryFailedResponse>} Retry result / Resultado del reintento
   */
  retryFailed: async (id: string): Promise<RetryFailedResponse> => {
    const response = await api.post<RetryFailedResponse>(`/email-campaigns/${id}/retry-failed`);
    return response.data;
  },

  /**
   * Pause a sending campaign
   * Pausar una campaña en envío
   * @param {string} id - Campaign ID / ID de la campaña
   * @returns {Promise<EmailCampaign>} Updated campaign / Campaña actualizada
   */
  pauseCampaign: async (id: string): Promise<EmailCampaign> => {
    const response = await api.post<{ success: boolean; data: EmailCampaign }>(
      `/email-campaigns/${id}/pause`
    );
    return response.data.data!;
  },
};
