/**
 * @fileoverview CRMService - Customer Relationship Management operations
 * @description Manages leads, tasks, communications, and CRM statistics for the MLM platform.
 *              Gestiona leads, tareas, comunicaciones y estadísticas de CRM para la plataforma MLM.
 * @module services/CRMService
 * @author MLM Development Team
 *
 * @example
 * // English: Create a new lead
 * const lead = await crmService.createLead({ userId, contactName, contactEmail });
 *
 * // English: Get CRM stats
 * const stats = await crmService.getCRMStats(userId);
 *
 * // Español: Crear un nuevo lead
 * const lead = await crmService.createLead({ userId, contactName, contactEmail });
 *
 * // Español: Obtener estadísticas de CRM
 * const stats = await crmService.getCRMStats(userId);
 */
import { Op, WhereOptions } from 'sequelize';
import { Lead, LeadStatus, LeadSource } from '../models/Lead';
import Task from '../models/Task';
import Communication from '../models/Communication';
import { User } from '../models';

/**
 * Lead filter options for queries
 * Opciones de filtro de leads para consultas
 */
export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  page?: number;
  limit?: number;
  // Filtros avanzados
  createdAtFrom?: string;
  createdAtTo?: string;
  valueMin?: number;
  valueMax?: number;
  nextFollowUpFrom?: string;
  nextFollowUpTo?: string;
}

/**
 * Lead statistics aggregation
 * Agregación de estadísticas de leads
 */
export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  totalValue: number;
  conversionRate: number;
}

/**
 * Period types for analytics
 */
export type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Analytics report data structure
 */
export interface AnalyticsReport {
  period: {
    type: PeriodType;
    dateFrom: string;
    dateTo: string;
  };
  leads: {
    total: number;
    created: number;
    won: number;
    lost: number;
    active: number;
  };
  value: {
    total: number;
    average: number;
    won: number;
  };
  conversion: {
    rate: number;
    avgTimeToWin: number;
  };
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  trend: Array<{ date: string; created: number; won: number }>;
}

/**
 * CRM Service - Lead, task, and communication management
 * Servicio de CRM - Gestión de leads, tareas y comunicaciones
 */
export class CRMService {
  // ============================================================
  // LEADS / LEADS
  // ============================================================

  /**
   * Create a new lead
   * Crear un nuevo lead
   * @param {Object} data - Lead creation data / Datos de creación del lead
   * @param {string} data.userId - Owning user ID / ID del usuario propietario
   * @param {string} data.contactName - Contact name / Nombre del contacto
   * @param {string} data.contactEmail - Contact email / Email del contacto
   * @param {string} [data.contactPhone] - Contact phone / Teléfono del contacto
   * @param {string} [data.company] - Company name / Nombre de empresa
   * @param {string} [data.source] - Lead source / Fuente del lead
   * @param {number} [data.value] - Estimated value / Valor estimado
   * @param {string} [data.currency] - Currency code / Código de moneda
   * @param {string} [data.notes] - Additional notes / Notas adicionales
   * @returns {Promise<Lead>} Created lead instance / Instancia del lead creado
   * @example
   * // English: Create a new lead
   * const lead = await crmService.createLead({
   *   userId: 'user-123',
   *   contactName: 'John Doe',
   *   contactEmail: 'john@example.com',
   *   source: 'website',
   *   value: 5000
   * });
   *
   * // Español: Crear un nuevo lead
   * const lead = await crmService.createLead({
   *   userId: 'usuario-123',
   *   contactName: 'Juan Pérez',
   *   contactEmail: 'juan@ejemplo.com',
   *   source: 'website',
   *   value: 5000
   * });
   */
  async createLead(data: {
    userId: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    company?: string;
    source?: LeadSource;
    value?: number;
    currency?: string;
    notes?: string;
    referredBy?: string;
  }): Promise<Lead> {
    return Lead.create({
      userId: data.userId,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      company: data.company || null,
      status: 'new',
      source: data.source || 'website',
      value: data.value || 0,
      currency: data.currency || 'USD',
      notes: data.notes || null,
      referredBy: data.referredBy || null,
      metadata: {},
    });
  }

  /**
   * Import leads from CSV
   * Importar leads desde CSV
   */
  async importLeadsFromCSV(
    userId: string,
    csvContent: string
  ): Promise<{ imported: number; errors: string[]; total: number }> {
    const { parse } = await import('csv-parse');

    return new Promise((resolve, reject) => {
      const errors: string[] = [];
      let imported = 0;
      let total = 0;

      const parser = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });

      parser.on('readable', async function () {
        let record;
        while ((record = parser.read()) !== null) {
          total++;
          try {
            if (!record.contactName || !record.contactEmail) {
              errors.push(`Row ${total}: Missing name or email`);
              continue;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(record.contactEmail)) {
              errors.push(`Row ${total}: Invalid email: ${record.contactEmail}`);
              continue;
            }

            const validSources = [
              'website',
              'referral',
              'social',
              'landing_page',
              'manual',
              'other',
              'import',
            ];
            const source =
              record.source && validSources.includes(record.source.toLowerCase())
                ? record.source.toLowerCase()
                : 'import';

            const value = record.value ? parseFloat(record.value) : 0;
            if (isNaN(value) || value < 0) {
              errors.push(`Row ${total}: Invalid value: ${record.value}`);
              continue;
            }

            await Lead.create({
              userId,
              contactName: record.contactName.trim(),
              contactEmail: record.contactEmail.trim().toLowerCase(),
              contactPhone: record.contactPhone?.trim() || null,
              company: record.company?.trim() || null,
              status: 'new',
              source: source as LeadSource,
              value: value,
              currency: record.currency?.trim() || 'USD',
              notes: record.notes?.trim() || null,
              metadata: { importedAt: new Date().toISOString() },
            });

            imported++;
          } catch (err) {
            errors.push(`Row ${total}: Error - ${err instanceof Error ? err.message : 'Unknown'}`);
          }
        }
      });

      parser.on('error', function (err) {
        reject(err);
      });

      parser.on('end', function () {
        resolve({ imported, errors, total });
      });
    });
  }

  /**
   * Export leads to CSV
   * Exportar leads a CSV
   */
  async exportLeadsToCSV(userId: string, filters: LeadFilters): Promise<string> {
    const { leads } = await this.getLeads(userId, { ...filters, limit: 10000 });

    const headers = [
      'contactName',
      'contactEmail',
      'contactPhone',
      'company',
      'status',
      'source',
      'value',
      'currency',
      'notes',
      'createdAt',
    ];
    const rows = leads.map((lead) => [
      lead.contactName,
      lead.contactEmail,
      lead.contactPhone || '',
      lead.company || '',
      lead.status,
      lead.source,
      lead.value.toString(),
      lead.currency,
      lead.notes || '',
      new Date(lead.createdAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Get leads with pagination and filters
   * Obtener leads con paginación y filtros
   * @param {string} userId - User ID / ID del usuario
   * @param {LeadFilters} filters - Filter options / Opciones de filtro
   * @returns {Promise<{leads: Lead[], pagination: Object}>} Paginated leads / Leads paginados
   * @example
   * // English: Get filtered leads
   * const { leads, pagination } = await crmService.getLeads(userId, { status: 'new', limit: 20 });
   *
   * // Español: Obtener leads filtrados
   * const { leads, pagination } = await crmService.getLeads(userId, { status: 'new', limit: 20 });
   */
  async getLeads(userId: string, filters: LeadFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const where: WhereOptions = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.search) {
      (where as Record<string, unknown>)[Op.or as unknown as string] = [
        { contactName: { [Op.like]: `%${filters.search}%` } },
        { contactEmail: { [Op.like]: `%${filters.search}%` } },
        { company: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    // Filtro por rango de fecha de creación
    if (filters.createdAtFrom) {
      where.createdAt = { ...where.createdAt, [Op.gte]: new Date(filters.createdAtFrom) };
    }
    if (filters.createdAtTo) {
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: new Date(filters.createdAtTo + 'T23:59:59'),
      };
    }

    // Filtro por rango de valor
    if (filters.valueMin !== undefined) {
      where.value = { ...where.value, [Op.gte]: filters.valueMin };
    }
    if (filters.valueMax !== undefined) {
      where.value = { ...where.value, [Op.lte]: filters.valueMax };
    }

    // Filtro por rango de próximo seguimiento
    if (filters.nextFollowUpFrom) {
      where.nextFollowUpAt = {
        ...where.nextFollowUpAt,
        [Op.gte]: new Date(filters.nextFollowUpFrom),
      };
    }
    if (filters.nextFollowUpTo) {
      where.nextFollowUpAt = {
        ...where.nextFollowUpAt,
        [Op.lte]: new Date(filters.nextFollowUpTo + 'T23:59:59'),
      };
    }

    const { rows, count } = await Lead.findAndCountAll({
      where,
      include: [{ model: User, as: 'assignedUser', attributes: ['id', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      leads: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get lead by ID with related data
   * Obtener lead por ID con datos relacionados
   * @param {string} id - Lead ID / ID del lead
   * @param {string} userId - User ID for authorization / ID del usuario para autorización
   * @returns {Promise<Lead | null>} Lead with tasks and communications / Lead con tareas y comunicaciones
   */
  async getLeadById(id: string, userId: string): Promise<Lead | null> {
    return Lead.findOne({
      where: { id, userId },
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'email'] },
        { model: Task, as: 'tasks', order: [['createdAt', 'DESC']] },
        { model: Communication, as: 'communications', order: [['createdAt', 'DESC']] },
      ],
    });
  }

  /**
   * Update lead status
   * Actualizar estado del lead
   * @param {string} id - Lead ID / ID del lead
   * @param {string} userId - User ID for authorization / ID del usuario
   * @param {LeadStatus} status - New status / Nuevo estado
   * @returns {Promise<Lead | null>} Updated lead / Lead actualizado
   */
  async updateLeadStatus(id: string, userId: string, status: LeadStatus): Promise<Lead | null> {
    const lead = await Lead.findOne({ where: { id, userId } });
    if (!lead) return null;

    await lead.update({ status });
    return lead;
  }

  /**
   * Update lead with allowed fields only
   * Actualizar lead solo con campos permitidos
   * @param {string} id - Lead ID / ID del lead
   * @param {string} userId - User ID for authorization / ID del usuario
   * @param {Partial<Lead>} data - Data to update / Datos a actualizar
   * @returns {Promise<Lead | null>} Updated lead / Lead actualizado
   */
  async updateLead(id: string, userId: string, data: Partial<Lead>): Promise<Lead | null> {
    const lead = await Lead.findOne({ where: { id, userId } });
    if (!lead) return null;

    const allowedFields = [
      'contactName',
      'contactEmail',
      'contactPhone',
      'company',
      'status',
      'source',
      'value',
      'currency',
      'notes',
      'nextFollowUpAt',
      'assignedTo',
    ];
    const updates: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (data[key as keyof Lead] !== undefined) {
        updates[key] = data[key as keyof Lead];
      }
    }

    await lead.update(updates);
    return lead;
  }

  /**
   * Delete a lead
   * Eliminar un lead
   * @param {string} id - Lead ID / ID del lead
   * @param {string} userId - User ID for authorization / ID del usuario
   * @returns {Promise<boolean>} True if deleted / True si fue eliminado
   */
  async deleteLead(id: string, userId: string): Promise<boolean> {
    const deleted = await Lead.destroy({ where: { id, userId } });
    return deleted > 0;
  }

  // ============================================================
  // STATS / ESTADÍSTICAS
  // ============================================================

  /**
   * Get CRM statistics for a user
   * Obtener estadísticas de CRM para un usuario
   * @param {string} userId - User ID / ID del usuario
   * @returns {Promise<LeadStats>} Statistics including totals and breakdowns / Estadísticas con totales y desgloses
   * @example
   * // English: Get CRM stats
   * const stats = await crmService.getCRMStats(userId);
   * console.log(`Conversion rate: ${stats.conversionRate.toFixed(2)}%`);
   *
   * // Español: Obtener estadísticas de CRM
   * const stats = await crmService.getCRMStats(userId);
   * console.log(`Tasa de conversión: ${stats.conversionRate.toFixed(2)}%`);
   */
  async getCRMStats(userId: string): Promise<LeadStats> {
    const leads = await Lead.findAll({ where: { userId } });
    const total = leads.length;

    const byStatus: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
    };
    const bySource: Record<string, number> = {
      website: 0,
      referral: 0,
      social: 0,
      landing_page: 0,
      manual: 0,
      other: 0,
    };
    let totalValue = 0;
    let wonCount = 0;

    for (const lead of leads) {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      totalValue += Number(lead.value);
      if (lead.status === 'won') wonCount++;
    }

    return {
      total,
      byStatus: byStatus as Record<LeadStatus, number>,
      bySource: bySource as Record<LeadSource, number>,
      totalValue,
      conversionRate: total > 0 ? (wonCount / total) * 100 : 0,
    };
  }

  // ============================================================
  // TASKS / TAREAS
  // ============================================================

  /**
   * Create a task for a lead
   * Crear una tarea para un lead
   * @param {Object} data - Task creation data / Datos de creación de tarea
   * @returns {Promise<Task>} Created task / Tarea creada
   */
  async createTask(data: {
    leadId: string;
    userId: string;
    type: string;
    title: string;
    description?: string;
    dueDate?: Date;
  }): Promise<Task> {
    return Task.create({
      leadId: data.leadId,
      userId: data.userId,
      type: data.type as any,
      title: data.title,
      description: data.description || null,
      status: 'pending',
      dueDate: data.dueDate || null,
    });
  }

  /**
   * Mark a task as completed
   * Marcar una tarea como completada
   * @param {string} id - Task ID / ID de la tarea
   * @param {string} userId - User ID for authorization / ID del usuario
   * @returns {Promise<Task | null>} Completed task / Tarea completada
   */
  async completeTask(id: string, userId: string): Promise<Task | null> {
    const task = await Task.findOne({ where: { id, userId } });
    if (!task) return null;

    await task.update({ status: 'completed', completedAt: new Date() });
    return task;
  }

  // ============================================================
  // COMMUNICATIONS / COMUNICACIONES
  // ============================================================

  /**
   * Add a communication record for a lead
   * Agregar un registro de comunicación para un lead
   * @param {Object} data - Communication data / Datos de comunicación
   * @returns {Promise<Communication>} Created communication / Comunicación creada
   */
  async addCommunication(data: {
    leadId: string;
    userId: string;
    type: string;
    direction: string;
    subject?: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<Communication> {
    const comm = await Communication.create({
      leadId: data.leadId,
      userId: data.userId,
      type: data.type as any,
      direction: data.direction as any,
      subject: data.subject || null,
      content: data.content,
      metadata: data.metadata || {},
    });

    await Lead.update({ lastContactAt: new Date() }, { where: { id: data.leadId } });
    return comm;
  }

  /**
   * Get all communications for a lead
   * Obtener todas las comunicaciones de un lead
   * @param {string} leadId - Lead ID / ID del lead
   * @param {string} userId - User ID for authorization / ID del usuario
   * @returns {Promise<Communication[]>} List of communications / Lista de comunicaciones
   */
  async getLeadCommunications(leadId: string, userId: string): Promise<Communication[]> {
    return Communication.findAll({
      where: { leadId, userId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get tasks for a specific lead
   * Obtener tareas de un lead específico
   * @param {string} leadId - Lead ID / ID del lead
   * @param {string} userId - User ID for authorization / ID del usuario
   * @returns {Promise<Task[]>} List of tasks / Lista de tareas
   */
  async getLeadTasks(leadId: string, userId: string): Promise<Task[]> {
    return Task.findAll({
      where: { leadId, userId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get upcoming tasks for a user
   * Obtener tareas próximas para un usuario
   * @param {string} userId - User ID / ID del usuario
   * @param {number} [limit=10] - Maximum number of tasks / Número máximo de tareas
   * @returns {Promise<Task[]>} List of upcoming tasks / Lista de tareas próximas
   * @example
   * // English: Get today's tasks
   * const tasks = await crmService.getUpcomingTasks(userId, 5);
   *
   * // Español: Obtener tareas de hoy
   * const tasks = await crmService.getUpcomingTasks(userId, 5);
   */
  async getUpcomingTasks(userId: string, limit = 10): Promise<Task[]> {
    return Task.findAll({
      where: {
        userId,
        status: 'pending',
        dueDate: { [Op.gte]: new Date() },
      },
      include: [{ model: Lead, as: 'lead' }],
      order: [['dueDate', 'ASC']],
      limit,
    });
  }

  // ============================================================
  // ANALYTICS / ANALÍTICA
  // ============================================================

  /**
   * Get analytics report by period
   * Obtener reporte de analítica por período
   * @param {string} userId - User ID / ID del usuario
   * @param {Object} options - Report options / Opciones del reporte
   * @returns {Promise<AnalyticsReport>} Analytics report / Reporte de analítica
   */
  async getAnalyticsReport(
    userId: string,
    options: { period?: PeriodType; dateFrom?: string; dateTo?: string }
  ): Promise<AnalyticsReport> {
    const { period = 'month', dateFrom, dateTo } = options;

    // Calculate date range based on period
    let startDate: Date;
    let endDate: Date = new Date();

    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
    } else {
      switch (period) {
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
      }
    }

    // Get all leads for user
    const allLeads = await Lead.findAll({ where: { userId } });

    // Filter by date range
    const periodLeads = allLeads.filter((lead) => {
      const created = new Date(lead.createdAt);
      return created >= startDate && created <= endDate;
    });

    // Calculate metrics
    const total = periodLeads.length;
    const won = periodLeads.filter((l) => l.status === 'won').length;
    const lost = periodLeads.filter((l) => l.status === 'lost').length;
    const active = periodLeads.filter((l) => !['won', 'lost'].includes(l.status)).length;

    // Value calculations
    const totalValue = periodLeads.reduce((sum, l) => sum + Number(l.value), 0);
    const wonValue = periodLeads
      .filter((l) => l.status === 'won')
      .reduce((sum, l) => sum + Number(l.value), 0);
    const avgValue = total > 0 ? totalValue / total : 0;

    // By status
    const byStatus: Record<string, number> = {};
    for (const lead of periodLeads) {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    }

    // By source
    const bySource: Record<string, number> = {};
    for (const lead of periodLeads) {
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
    }

    // Conversion rate
    const closed = won + lost;
    const conversionRate = closed > 0 ? (won / closed) * 100 : 0;

    // Average time to win (in days)
    let avgTimeToWin = 0;
    const wonLeads = periodLeads.filter((l) => l.status === 'won');
    if (wonLeads.length > 0) {
      const totalDays = wonLeads.reduce((sum, l) => {
        const created = new Date(l.createdAt).getTime();
        const updated = new Date(l.updatedAt).getTime();
        return sum + (updated - created) / (1000 * 60 * 60 * 24);
      }, 0);
      avgTimeToWin = totalDays / wonLeads.length;
    }

    // Trend data (group by day/week depending on period)
    const trendMap = new Map<string, { created: number; won: number }>();

    // Determine grouping based on period
    const groupBy = period === 'week' ? 'day' : period === 'year' ? 'month' : 'week';

    for (const lead of periodLeads) {
      const date = new Date(lead.createdAt);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Weekly - get week number
        const weekNum = Math.ceil(
          (date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        key = `${startDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      }

      const existing = trendMap.get(key) || { created: 0, won: 0 };
      existing.created += 1;
      if (lead.status === 'won') existing.won += 1;
      trendMap.set(key, existing);
    }

    const trend = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        created: data.created,
        won: data.won,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: {
        type: period,
        dateFrom: startDate.toISOString().split('T')[0],
        dateTo: endDate.toISOString().split('T')[0],
      },
      leads: {
        total,
        created: total,
        won,
        lost,
        active,
      },
      value: {
        total: totalValue,
        average: avgValue,
        won: wonValue,
      },
      conversion: {
        rate: conversionRate,
        avgTimeToWin,
      },
      byStatus,
      bySource,
      trend,
    };
  }
}

export const crmService = new CRMService();
