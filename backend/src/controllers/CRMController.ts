/**
 * @fileoverview CRMController - Customer Relationship Management endpoints
 * @description Handles CRM operations including lead management, tasks, and communications tracking.
 *              Gestiona operaciones de CRM incluyendo gestión de leads, tareas y seguimiento de comunicaciones.
 * @module controllers/CRMController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { body, query } from 'express-validator';
import { crmService } from '../services/CRMService';
import { AppError } from '../middleware/error.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { LeadStatus, LeadSource } from '../models/Lead';

/**
 * Validation rules for creating a new lead
 * Reglas de validación para crear un nuevo lead
 */
export const createLeadValidation = [
  body('contactName').notEmpty().withMessage('Contact name is required'),
  body('contactEmail').isEmail().withMessage('Valid email is required'),
  body('contactPhone').optional().isString(),
  body('company').optional().isString(),
  body('source')
    .optional()
    .isIn(['website', 'referral', 'social', 'landing_page', 'manual', 'other']),
  body('value').optional().isFloat({ min: 0 }),
  body('currency').optional().isIn(['USD', 'COP', 'MXN']),
  body('notes').optional().isString(),
];

export const updateLeadValidation = [
  body('contactName').optional().isString(),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isString(),
  body('company').optional().isString(),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  body('value').optional().isFloat({ min: 0 }),
  body('notes').optional().isString(),
];

/**
 * Validation rules for creating a task
 * Reglas de validación para crear una tarea
 */
export const createTaskValidation = [
  body('title').notEmpty().withMessage('Task title is required'),
  body('type').optional().isIn(['call', 'email', 'meeting', 'follow_up', 'note', 'other']),
  body('description').optional().isString(),
  body('dueDate').optional().isISO8601().withMessage('Valid date is required'),
];

/**
 * Get all leads with pagination and filters
 * Obtiene todos los leads con paginación y filtros
 *
 * @param req - Query params: status, source, search, page, limit
 * @param res - Response with paginated leads
 */
export async function getLeads(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.id;
  const leads = await crmService.getLeads(userId, {
    status: req.query.status as any,
    source: req.query.source as any,
    search: req.query.search as string,
    createdAtFrom: req.query.createdAtFrom as string,
    createdAtTo: req.query.createdAtTo as string,
    valueMin: req.query.valueMin ? parseFloat(req.query.valueMin as string) : undefined,
    valueMax: req.query.valueMax ? parseFloat(req.query.valueMax as string) : undefined,
    nextFollowUpFrom: req.query.nextFollowUpFrom as string,
    nextFollowUpTo: req.query.nextFollowUpTo as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
  });
  res.json({ success: true, data: leads });
}

/**
 * Get lead by ID
 * Obtiene un lead por ID
 *
 * @param req - Path params: id
 * @param res - Response with lead details
 * @throws {AppError} 404 - If lead not found
 */
export async function getLeadById(req: AuthenticatedRequest, res: Response) {
  const lead = await crmService.getLeadById(req.params.id, req.user!.id);
  if (!lead) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
  res.json({ success: true, data: lead });
}

/**
 * Create a new lead
 * Crea un nuevo lead
 *
 * @param req - Body: contactName, contactEmail, contactPhone, company, source, value, currency, notes
 * @param res - Response with created lead
 */
export async function createLead(req: AuthenticatedRequest, res: Response) {
  const lead = await crmService.createLead({
    userId: req.user!.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: lead });
}

/**
 * Import leads from CSV
 * Importar leads desde archivo CSV
 *
 * @param req - Body: csv (CSV content as string)
 * @param res - Response with import results
 */
export async function importLeads(req: AuthenticatedRequest, res: Response) {
  const { csv } = req.body;

  if (!csv || typeof csv !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'CSV content is required');
  }

  const result = await crmService.importLeadsFromCSV(req.user!.id, csv);
  res.status(200).json({ success: true, data: result });
}

/**
 * Export leads to CSV
 * Exportar leads a CSV
 */
export async function exportLeads(req: AuthenticatedRequest, res: Response) {
  const filters = {
    status: req.query.status as any,
    source: req.query.source as any,
    search: req.query.search as string,
    createdAtFrom: req.query.createdAtFrom as string,
    createdAtTo: req.query.createdAtTo as string,
    valueMin: req.query.valueMin ? parseFloat(req.query.valueMin as string) : undefined,
    valueMax: req.query.valueMax ? parseFloat(req.query.valueMax as string) : undefined,
  };

  const csv = await crmService.exportLeadsToCSV(req.user!.id, filters);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=leads-export-${new Date().toISOString().split('T')[0]}.csv`
  );
  res.send(csv);
}

/**
 * Update a lead
 * Actualiza un lead
 *
 * @param req - Path params: id, Body: fields to update
 * @param res - Response with updated lead
 * @throws {AppError} 404 - If lead not found
 */
export async function updateLead(req: AuthenticatedRequest, res: Response) {
  const lead = await crmService.updateLead(req.params.id, req.user!.id, req.body);
  if (!lead) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
  res.json({ success: true, data: lead });
}

/**
 * Delete a lead
 * Elimina un lead
 *
 * @param req - Path params: id
 * @param res - Success response
 * @throws {AppError} 404 - If lead not found
 */
export async function deleteLead(req: AuthenticatedRequest, res: Response) {
  const deleted = await crmService.deleteLead(req.params.id, req.user!.id);
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
  res.json({ success: true, message: 'Lead deleted' });
}

/**
 * Get CRM statistics
 * Obtiene estadísticas de CRM
 *
 * @param req - Authenticated request
 * @param res - Response with CRM stats (total, byStatus, bySource, conversionRate)
 */
export async function getCRMStats(req: AuthenticatedRequest, res: Response) {
  const stats = await crmService.getCRMStats(req.user!.id);
  res.json({ success: true, data: stats });
}

/**
 * Create a task for a lead
 * Crea una tarea para un lead
 *
 * @param req - Path params: leadId, Body: type, title, description, dueDate
 * @param res - Response with created task
 */
export async function createTask(req: AuthenticatedRequest, res: Response) {
  const task = await crmService.createTask({
    leadId: req.params.leadId,
    userId: req.user!.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: task });
}

/**
 * Mark a task as completed
 * Marca una tarea como completada
 *
 * @param req - Path params: taskId
 * @param res - Response with completed task
 * @throws {AppError} 404 - If task not found
 */
export async function completeTask(req: AuthenticatedRequest, res: Response) {
  const task = await crmService.completeTask(req.params.taskId, req.user!.id);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');
  res.json({ success: true, data: task });
}

/**
 * Add a communication record
 * Agrega un registro de comunicación
 *
 * @param req - Path params: leadId, Body: type, direction, subject, content, metadata
 * @param res - Response with created communication
 */
export async function addCommunication(req: AuthenticatedRequest, res: Response) {
  const comm = await crmService.addCommunication({
    leadId: req.params.leadId,
    userId: req.user!.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: comm });
}

/**
 * Get all communications for a lead
 * Obtiene todas las comunicaciones de un lead
 *
 * @param req - Path params: leadId
 * @param res - Response with communications list
 */
export async function getLeadCommunications(req: AuthenticatedRequest, res: Response) {
  const comms = await crmService.getLeadCommunications(req.params.leadId, req.user!.id);
  res.json({ success: true, data: comms });
}

/**
 * Get tasks for a lead
 * Obtiene las tareas de un lead
 *
 * @param req - Path params: leadId
 * @param res - Response with tasks list
 */
export async function getLeadTasks(req: AuthenticatedRequest, res: Response) {
  const tasks = await crmService.getLeadTasks(req.params.leadId, req.user!.id);
  res.json({ success: true, data: tasks });
}

/**
 * Get upcoming tasks
 * Obtiene tareas próximas
 *
 * @param req - Authenticated request
 * @param res - Response with upcoming tasks (limit default 10)
 */
export async function getUpcomingTasks(req: AuthenticatedRequest, res: Response) {
  const tasks = await crmService.getUpcomingTasks(req.user!.id);
  res.json({ success: true, data: tasks });
}

/**
 * Get analytics report by period
 * Obtiene reporte de analítica por período
 *
 * @param req - Query params: period (week, month, quarter, year, custom)
 * @param res - Response with period analytics
 */
export async function getAnalyticsReport(req: AuthenticatedRequest, res: Response) {
  const period = (req.query.period as 'week' | 'month' | 'quarter' | 'year' | 'custom') || 'month';
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  const report = await crmService.getAnalyticsReport(req.user!.id, {
    period,
    dateFrom,
    dateTo,
  });
  res.json({ success: true, data: report });
}

/**
 * Get CRM alerts
 * Obtiene alertas de CRM (leads inactivos, tareas vencidas)
 *
 * @param req - Query params: daysInactive (default 7)
 * @param res - Response with alerts
 */
export async function getCRMAlerts(req: AuthenticatedRequest, res: Response) {
  const daysInactive = req.query.daysInactive ? parseInt(req.query.daysInactive as string) : 7;
  const alerts = await crmService.getCRMAlerts(req.user!.id, daysInactive);
  res.json({ success: true, data: alerts });
}

/**
 * Export analytics report
 * Exporta reporte de analítica a CSV
 *
 * @param req - Query params: period, dateFrom, dateTo
 * @param res - CSV file download
 */
export async function exportAnalyticsReport(req: AuthenticatedRequest, res: Response) {
  const period = (req.query.period as 'week' | 'month' | 'quarter' | 'year' | 'custom') || 'month';
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  const csv = await crmService.exportAnalyticsReport(req.user!.id, {
    period,
    dateFrom,
    dateTo,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=crm-analytics-${new Date().toISOString().split('T')[0]}.csv`
  );
  res.send(csv);
}
