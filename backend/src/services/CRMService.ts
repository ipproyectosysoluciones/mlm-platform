import { Op, WhereOptions } from 'sequelize';
import { Lead, LeadStatus, LeadSource } from '../models/Lead';
import Task from '../models/Task';
import Communication from '../models/Communication';
import { User } from '../models';

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  totalValue: number;
  conversionRate: number;
}

export class CRMService {
  // Leads
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

  async getLeads(userId: string, filters: LeadFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const where: WhereOptions = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.search) {
      where[Op.or] = [
        { contactName: { [Op.like]: `%${filters.search}%` } },
        { contactEmail: { [Op.like]: `%${filters.search}%` } },
        { company: { [Op.like]: `%${filters.search}%` } },
      ];
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

  async updateLeadStatus(id: string, userId: string, status: LeadStatus): Promise<Lead | null> {
    const lead = await Lead.findOne({ where: { id, userId } });
    if (!lead) return null;

    await lead.update({ status });
    return lead;
  }

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

  async deleteLead(id: string, userId: string): Promise<boolean> {
    const deleted = await Lead.destroy({ where: { id, userId } });
    return deleted > 0;
  }

  // Stats
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

  // Tasks
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

  async completeTask(id: string, userId: string): Promise<Task | null> {
    const task = await Task.findOne({ where: { id, userId } });
    if (!task) return null;

    await task.update({ status: 'completed', completedAt: new Date() });
    return task;
  }

  // Communications
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

  async getLeadCommunications(leadId: string, userId: string): Promise<Communication[]> {
    return Communication.findAll({
      where: { leadId, userId },
      order: [['createdAt', 'DESC']],
    });
  }

  // Get upcoming tasks
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
}

export const crmService = new CRMService();
