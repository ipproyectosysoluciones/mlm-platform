import api from './api';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';
export type LeadSource = 'website' | 'referral' | 'social' | 'landing_page' | 'manual' | 'other';

export interface Lead {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  company: string | null;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  currency: string;
  notes: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  totalValue: number;
  conversionRate: number;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Automation status summary from n8n workflow executions.
 * Resumen de estado de automatización de ejecuciones de workflows n8n.
 */
export interface AutomationStatus {
  totalExecutions: number;
  pendingFollowUps: number;
  lastActionAt: string | null;
}

/**
 * Single workflow execution record with optional lead data.
 * Registro de ejecución de workflow con datos opcionales del lead.
 */
export interface WorkflowExecutionRecord {
  id: string;
  leadId: string;
  workflowName: string;
  actionType: string;
  status: string;
  n8nExecutionId: string;
  errorMessage: string | null;
  createdAt: string;
  Lead?: {
    contactName: string;
    contactPhone: string | null;
  };
}

/**
 * Paginated response for workflow executions.
 * Respuesta paginada de ejecuciones de workflows.
 */
export interface AutomationExecutionsResponse {
  data: WorkflowExecutionRecord[];
  total: number;
  page: number;
  limit: number;
}

class CRMService {
  async getLeads(filters?: LeadFilters): Promise<{ leads: Lead[]; pagination: any }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get(`/crm?${params.toString()}`);
    return data.data;
  }

  async getLeadById(id: string): Promise<Lead> {
    const { data } = await api.get(`/crm/${id}`);
    return data.data;
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const { data } = await api.post('/crm', lead);
    return data.data;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data } = await api.put(`/crm/${id}`, updates);
    return data.data;
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
    const { data } = await api.put(`/crm/${id}`, { status });
    return data.data;
  }

  async deleteLead(id: string): Promise<void> {
    await api.delete(`/crm/${id}`);
  }

  async getStats(): Promise<LeadStats> {
    const { data } = await api.get('/crm/stats');
    return data.data;
  }

  async createTask(
    leadId: string,
    task: { type: string; title: string; description?: string; dueDate?: string }
  ) {
    const { data } = await api.post(`/crm/${leadId}/tasks`, task);
    return data.data;
  }

  async completeTask(taskId: string) {
    const { data } = await api.patch(`/crm/tasks/${taskId}/complete`);
    return data.data;
  }

  async addCommunication(
    leadId: string,
    comm: { type: string; direction: string; content: string; subject?: string }
  ) {
    const { data } = await api.post(`/crm/${leadId}/communications`, comm);
    return data.data;
  }

  async getCommunications(leadId: string) {
    const { data } = await api.get(`/crm/${leadId}/communications`);
    return data.data;
  }

  async getUpcomingTasks() {
    const { data } = await api.get('/crm/tasks');
    return data.data;
  }

  /**
   * Get automation status summary (total executions, pending follow-ups, last action).
   * Obtener resumen de estado de automatización (total ejecuciones, seguimientos pendientes, última acción).
   */
  async getAutomationStatus(): Promise<AutomationStatus> {
    const { data } = await api.get('/crm/automation/status');
    return data.data;
  }

  /**
   * Get paginated list of workflow executions.
   * Obtener lista paginada de ejecuciones de workflows.
   * @param page - Page number (default 1) / Número de página (default 1)
   * @param limit - Items per page (default 20, max 100) / Items por página (default 20, máx 100)
   */
  async getAutomationExecutions(page = 1, limit = 20): Promise<AutomationExecutionsResponse> {
    const { data } = await api.get('/crm/automation/executions', {
      params: { page, limit },
    });
    return { data: data.data, total: data.total, page: data.page, limit: data.limit };
  }
}

export const crmService = new CRMService();
