import { Response } from 'express';
import { body, query } from 'express-validator';
import { crmService } from '../services/CRMService';
import { AppError } from '../middleware/error.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { LeadStatus, LeadSource } from '../models/Lead';

export const createLeadValidation = [
  body('contactName').notEmpty().withMessage('Contact name is required'),
  body('contactEmail').isEmail().withMessage('Valid email is required'),
  body('contactPhone').optional().isString(),
  body('company').optional().isString(),
  body('source').optional().isIn(['website', 'referral', 'social', 'landing_page', 'manual', 'other']),
  body('value').optional().isFloat({ min: 0 }),
  body('currency').optional().isIn(['USD', 'COP', 'MXN']),
  body('notes').optional().isString(),
];

export const updateLeadValidation = [
  body('contactName').optional().isString(),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isString(),
  body('company').optional().isString(),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  body('value').optional().isFloat({ min: 0 }),
  body('notes').optional().isString(),
];

export async function getLeads(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.id;
  const leads = await crmService.getLeads(userId, {
    status: req.query.status as any,
    source: req.query.source as any,
    search: req.query.search as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
  });
  res.json({ success: true, data: leads });
}

export async function getLeadById(req: AuthenticatedRequest, res: Response) {
  const lead = await crmService.getLeadById(req.params.id, req.user!.id);
  if (!lead) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
  res.json({ success: true, data: lead });
}

export async function createLead(req: AuthenticatedRequest, res: Response) {
  const lead = await crmService.createLead({
    userId: req.user!.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: lead });
}

export async function updateLead(req: AuthenticatedRequest, res: Response) {
  const lead = await crmService.updateLead(req.params.id, req.user!.id, req.body);
  if (!lead) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
  res.json({ success: true, data: lead });
}

export async function deleteLead(req: AuthenticatedRequest, res: Response) {
  const deleted = await crmService.deleteLead(req.params.id, req.user!.id);
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
  res.json({ success: true, message: 'Lead deleted' });
}

export async function getCRMStats(req: AuthenticatedRequest, res: Response) {
  const stats = await crmService.getCRMStats(req.user!.id);
  res.json({ success: true, data: stats });
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
  const task = await crmService.createTask({
    leadId: req.params.leadId,
    userId: req.user!.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: task });
}

export async function completeTask(req: AuthenticatedRequest, res: Response) {
  const task = await crmService.completeTask(req.params.taskId, req.user!.id);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');
  res.json({ success: true, data: task });
}

export async function addCommunication(req: AuthenticatedRequest, res: Response) {
  const comm = await crmService.addCommunication({
    leadId: req.params.leadId,
    userId: req.user!.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: comm });
}

export async function getLeadCommunications(req: AuthenticatedRequest, res: Response) {
  const comms = await crmService.getLeadCommunications(req.params.leadId, req.user!.id);
  res.json({ success: true, data: comms });
}

export async function getUpcomingTasks(req: AuthenticatedRequest, res: Response) {
  const tasks = await crmService.getUpcomingTasks(req.user!.id);
  res.json({ success: true, data: tasks });
}
