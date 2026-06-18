/**
 * @fileoverview CRM service - CRM API methods
 * @module services/api/crm
 */
import api from './client';

/**
 * @namespace crmService
 * @description CRM API methods / Métodos de API de CRM
 */
export const crmService = {
  /**
   * Get leads list
   * Obtener lista de leads
   */
  getLeads: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    source?: string;
    search?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    valueMin?: number;
    valueMax?: number;
    nextFollowUpFrom?: string;
    nextFollowUpTo?: string;
  }) => {
    const response = await api.get('/crm', { params });
    return response.data;
  },

  /**
   * Get lead by ID
   * Obtener lead por ID
   */
  getLead: async (leadId: string) => {
    const response = await api.get(`/crm/${leadId}`);
    return response.data;
  },

  /**
   * Create new lead
   * Crear nuevo lead
   */
  createLead: async (data: {
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    company?: string;
    source?: string;
    notes?: string;
  }) => {
    const response = await api.post('/crm', data);
    return response.data;
  },

  /**
   * Import leads from CSV
   * Importar leads desde CSV
   */
  importLeads: async (csv: string) => {
    const response = await api.post('/crm/import', { csv });
    return response.data;
  },

  /**
   * Export leads to CSV
   * Exportar leads a CSV
   */
  exportLeads: async (params?: { status?: string; source?: string; search?: string }) => {
    const response = await api.get('/crm/export', { params, responseType: 'blob' });
    return response.data;
  },

  /**
   * Update lead
   * Actualizar lead
   */
  updateLead: async (
    leadId: string,
    data: Partial<{
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      company: string;
      status: string;
      notes: string;
    }>
  ) => {
    const response = await api.patch(`/crm/${leadId}`, data);
    return response.data;
  },

  /**
   * Delete lead
   * Eliminar lead
   */
  deleteLead: async (leadId: string) => {
    const response = await api.delete(`/crm/${leadId}`);
    return response.data;
  },

  /**
   * Get CRM stats
   * Obtener estadísticas de CRM
   */
  getStats: async () => {
    const response = await api.get('/crm/stats');
    return response.data;
  },

  /**
   * Create task for lead
   * Crear tarea para lead
   */
  createTask: async (
    leadId: string,
    data: {
      title: string;
      description?: string;
      dueDate?: string;
      type?: string;
    }
  ) => {
    const response = await api.post(`/crm/${leadId}/tasks`, data);
    return response.data;
  },

  /**
   * Get tasks for lead
   * Obtener tareas de lead
   */
  getTasks: async (leadId: string) => {
    const response = await api.get(`/crm/${leadId}/tasks`);
    return response.data;
  },

  /**
   * Update task
   * Actualizar tarea
   */
  updateTask: async (
    taskId: string,
    data: { status?: string; title?: string; description?: string }
  ) => {
    const response = await api.patch(`/crm/tasks/${taskId}`, data);
    return response.data;
  },

  /**
   * Delete task
   * Eliminar tarea
   */
  deleteTask: async (taskId: string) => {
    const response = await api.delete(`/crm/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Get upcoming tasks
   * Obtener tareas próximas
   */
  getUpcomingTasks: async () => {
    const response = await api.get('/crm/tasks');
    return response.data;
  },

  /**
   * Add communication to lead
   * Agregar comunicación a lead
   */
  addCommunication: async (
    leadId: string,
    data: {
      type: string;
      subject?: string;
      content: string;
      direction?: string;
    }
  ) => {
    const response = await api.post(`/crm/${leadId}/communications`, data);
    return response.data;
  },

  /**
   * Get communications for lead
   * Obtener comunicaciones de lead
   */
  getCommunications: async (leadId: string) => {
    const response = await api.get(`/crm/${leadId}/communications`);
    return response.data;
  },

  /**
   * Get analytics report by period
   * Obtener reporte de analítica por período
   */
  getAnalyticsReport: async (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/crm/analytics/report', { params });
    return response.data;
  },

  /**
   * Get CRM alerts
   * Obtener alertas de CRM
   */
  getAlerts: async (params?: { daysInactive?: number }) => {
    const response = await api.get('/crm/alerts', { params });
    return response.data;
  },

  /**
   * Export analytics report to CSV
   * Exportar reporte de analítica a CSV
   */
  exportAnalyticsReport: async (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/crm/analytics/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
