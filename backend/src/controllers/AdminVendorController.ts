/**
 * @fileoverview AdminVendorController - Admin vendor management endpoints
 * @description Controller for admin vendor management: list, approve, reject, suspend
 * @module controllers/AdminVendorController
 * @author MLM Development Team
 *
 * @example
 * // English: Approve vendor
 * POST /api/admin/vendors/:id/approve
 *
 * // Español: Aprobar vendedor
 * POST /api/admin/vendors/:id/approve
 */
import { Request, Response } from 'express';
import { vendorService } from '../services/VendorService';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { hasStatusCode, getErrorMessage } from '../utils/HttpError.js';

/**
 * List vendors with pagination and filters
 * Listar vendedores con paginación y filtros
 *
 * @route GET /api/admin/vendors
 * @access Admin
 * @query { page, limit, status }
 */
export const listVendors = [
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const status = req.query.status as string | undefined;

      const { rows: vendors, count } = await vendorService.list({ page, limit, status });

      res.json({
        success: true,
        data: vendors,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to list vendors');
      logger.error({ err: error }, 'List vendors error');
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message,
        },
      });
    }
  },
];

/**
 * Get vendor by ID
 * Obtener vendedor por ID
 *
 * @route GET /api/admin/vendors/:id
 * @access Admin
 */
export const getVendor = [
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const vendor = await vendorService.getById(req.params.id);

      res.json({
        success: true,
        data: vendor,
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to get vendor');
      const statusCode = hasStatusCode(error) ? error.statusCode : 500;
      logger.error({ err: error }, 'Get vendor error');
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message,
        },
      });
    }
  },
];

/**
 * Approve vendor
 * Aprobar vendedor
 *
 * @route POST /api/admin/vendors/:id/approve
 * @access Admin
 */
export const approveVendor = [
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as AuthenticatedRequest).userId!;
      const vendor = await vendorService.approve(req.params.id, adminId);

      res.json({
        success: true,
        data: vendor,
        message: 'Vendor approved successfully',
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to approve vendor');
      const statusCode = hasStatusCode(error) ? error.statusCode : 500;
      logger.error({ err: error }, 'Approve vendor error');
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message,
        },
      });
    }
  },
];

/**
 * Reject vendor
 * Rechazar vendedor
 *
 * @route POST /api/admin/vendors/:id/reject
 * @access Admin
 * @body { reason }
 */
export const rejectVendor = [
  authenticate,
  requireAdmin,
  body('reason').notEmpty().trim().isLength({ max: 500 }),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    try {
      const { reason } = req.body;
      const vendor = await vendorService.reject(req.params.id, reason);

      res.json({
        success: true,
        data: vendor,
        message: 'Vendor rejected',
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to reject vendor');
      const statusCode = hasStatusCode(error) ? error.statusCode : 500;
      logger.error({ err: error }, 'Reject vendor error');
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message,
        },
      });
    }
  },
];

/**
 * Suspend vendor
 * Suspender vendedor
 *
 * @route POST /api/admin/vendors/:id/suspend
 * @access Admin
 * @body { reason }
 */
export const suspendVendor = [
  authenticate,
  requireAdmin,
  body('reason').notEmpty().trim().isLength({ max: 500 }),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    try {
      const { reason } = req.body;
      const vendor = await vendorService.suspend(req.params.id, reason);

      res.json({
        success: true,
        data: vendor,
        message: 'Vendor suspended',
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to suspend vendor');
      const statusCode = hasStatusCode(error) ? error.statusCode : 500;
      logger.error({ err: error }, 'Suspend vendor error');
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message,
        },
      });
    }
  },
];

/**
 * Update vendor commission rate
 * Actualizar tasa de comisión del vendedor
 *
 * @route PATCH /api/admin/vendors/:id/commission-rate
 * @access Admin
 * @body { commissionRate }
 */
export const updateCommissionRate = [
  authenticate,
  requireAdmin,
  body('commissionRate').isFloat({ min: 0, max: 1 }),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    try {
      const { commissionRate } = req.body;
      const vendor = await vendorService.getById(req.params.id);

      vendor.commissionRate = commissionRate;
      await vendor.save();

      res.json({
        success: true,
        data: vendor,
        message: 'Commission rate updated',
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to update commission rate');
      const statusCode = hasStatusCode(error) ? error.statusCode : 500;
      logger.error({ err: error }, 'Update commission rate error');
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message,
        },
      });
    }
  },
];
