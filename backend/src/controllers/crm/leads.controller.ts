/**
 * @fileoverview Leads Controller - Lead management endpoints
 * @description Handles CRUD operations for CRM leads
 * @module controllers/crm/leads
 */
import { Response } from 'express';
import { body } from 'express-validator';
import { crmService } from '../../services/CRMService';
import { AppError } from '../../middleware/error.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Validation rules for creating a new lead
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

/**
 * Validation rules for updating a lead
 */
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
 * Get all leads with pagination and filters
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
 */
export async function getLeadById(req: AuthenticatedRequest, res: Response) {
  try {
    const lead = await crmService.getLeadById(req.params.id, req.user!.id);
    if (!lead) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
    res.json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(404, 'NOT_FOUND', 'Lead not found');
  }
}

/**
 * Create a new lead
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
 */
export async function updateLead(req: AuthenticatedRequest, res: Response) {
  try {
    const lead = await crmService.updateLead(req.params.id, req.user!.id, req.body);
    if (!lead) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
    res.json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(404, 'NOT_FOUND', 'Lead not found');
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(req: AuthenticatedRequest, res: Response) {
  const deleted = await crmService.deleteLead(req.params.id, req.user!.id);
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
  res.json({ success: true, message: 'Lead deleted' });
}

/**
 * Get CRM statistics
 */
export async function getCRMStats(req: AuthenticatedRequest, res: Response) {
  const stats = await crmService.getCRMStats(req.user!.id);
  res.json({ success: true, data: stats });
}

/**
 * Get CRM alerts
 */
export async function getCRMAlerts(req: AuthenticatedRequest, res: Response) {
  const daysInactive = req.query.daysInactive ? parseInt(req.query.daysInactive as string) : 7;
  const alerts = await crmService.getCRMAlerts(req.user!.id, daysInactive);
  res.json({ success: true, data: alerts });
}
