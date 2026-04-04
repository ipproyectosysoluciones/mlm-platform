/**
 * @fileoverview VendorController - Vendor management endpoints
 * @description Controller for vendor registration, profile, dashboard, and payouts
 * @module controllers/VendorController
 * @author MLM Development Team
 *
 * @example
 * // English: Register as vendor
 * POST /api/vendors/register
 * Body: { businessName, contactEmail, contactPhone }
 *
 * // Español: Registrarse como vendedor
 * POST /api/vendors/register
 * Body: { businessName, contactEmail, contactPhone }
 */
import { Request, Response } from 'express';
import { vendorService } from '../services/VendorService';
import { authenticate, requireVendor } from '../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { body, param, query, validationResult } from 'express-validator';
import { Product } from '../models';

// Validation rules
export const vendorValidationRules = {
  register: [
    body('businessName').notEmpty().trim().isLength({ min: 2, max: 255 }),
    body('contactEmail').isEmail().normalizeEmail(),
    body('contactPhone').optional().isString().trim().isLength({ max: 50 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
  ],
  requestPayout: [
    body('amount').isFloat({ min: 1 }),
    body('paymentMethod').optional().isString().trim().isLength({ max: 50 }),
  ],
};

/**
 * Register as a vendor
 * Registrarse como vendedor
 *
 * @route POST /api/vendors/register
 * @access Authenticated user
 * @body { businessName, contactEmail, contactPhone?, description?, address? }
 */
export const registerVendor = [
  authenticate,
  vendorValidationRules.register,
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
      const userId = (req as AuthenticatedRequest).userId!;
      const { businessName, contactEmail, contactPhone, description, address } = req.body;

      const vendor = await vendorService.register(userId, {
        businessName,
        contactEmail,
        contactPhone,
        description,
        address,
      });

      res.status(201).json({
        success: true,
        data: vendor,
      });
    } catch (error: any) {
      console.error('Register vendor error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to register vendor',
        },
      });
    }
  },
];

/**
 * Get vendor profile (current vendor)
 * Obtener perfil del vendedor (vendedor actual)
 *
 * @route GET /api/vendors/me
 * @access Vendor
 */
export const getVendorProfile = [
  authenticate,
  requireVendor,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const vendor = await vendorService.getByUserId(userId);

      if (!vendor) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Vendor profile not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: vendor,
      });
    } catch (error: any) {
      console.error('Get vendor profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to get vendor profile',
        },
      });
    }
  },
];

/**
 * Get vendor products
 * Obtener productos del vendedor
 *
 * @route GET /api/vendors/me/products
 * @access Vendor
 */
export const getVendorProducts = [
  authenticate,
  requireVendor,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const vendor = await vendorService.getByUserId(userId);

      if (!vendor) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Vendor profile not found',
          },
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      const { rows: products, count } = await Product.findAndCountAll({
        where: { vendorId: vendor.id },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: products,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error: any) {
      console.error('Get vendor products error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to get vendor products',
        },
      });
    }
  },
];

/**
 * Get vendor dashboard
 * Obtener panel del vendedor
 *
 * @route GET /api/vendors/me/dashboard
 * @access Vendor
 */
export const getVendorDashboard = [
  authenticate,
  requireVendor,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const vendor = await vendorService.getByUserId(userId);

      if (!vendor) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Vendor profile not found',
          },
        });
        return;
      }

      const dashboard = await vendorService.getDashboard(vendor.id);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      console.error('Get vendor dashboard error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to get vendor dashboard',
        },
      });
    }
  },
];

/**
 * Request payout
 * Solicitar pago
 *
 * @route POST /api/vendors/me/payouts
 * @access Vendor
 */
export const requestPayout = [
  authenticate,
  requireVendor,
  vendorValidationRules.requestPayout,
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
      const userId = (req as AuthenticatedRequest).userId!;
      const vendor = await vendorService.getByUserId(userId);

      if (!vendor) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Vendor profile not found',
          },
        });
        return;
      }

      const { amount, paymentMethod } = req.body;
      const payout = await vendorService.requestPayout(vendor.id, amount, paymentMethod);

      res.status(201).json({
        success: true,
        data: payout,
      });
    } catch (error: any) {
      console.error('Request payout error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to request payout',
        },
      });
    }
  },
];
