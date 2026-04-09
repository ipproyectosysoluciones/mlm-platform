/**
 * @fileoverview LeadController - Lead management endpoints
 * @description Handles lead CRUD operations, import/export, and search/filtering.
 *              Gestiona operaciones CRUD de leads, importación/exportación y búsqueda/filtrado.
 * @module controllers/crm/LeadController
 * @author MLM Development Team
 */

import { Response } from 'express';
import { body } from 'express-validator';
import { crmService } from '../../services/CRMService';
import { AppError } from '../../middleware/error.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

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
