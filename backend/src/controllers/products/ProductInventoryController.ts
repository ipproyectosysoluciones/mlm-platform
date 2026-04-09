/**
 * @fileoverview ProductInventoryController - Admin inventory management
 * @description Handles inventory operations: reserve, release, adjust stock.
 * @module controllers/products/ProductInventoryController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { productService } from '../../services/ProductService';
import { asyncHandler } from '../../middleware/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import type { ApiResponse } from '../../types';
import type { Product } from '../../models/Product';
import type { InventoryMovement } from '../../models/InventoryMovement';

/**
 * Reserve stock for an order
 * POST /api/admin/products/:id/inventory/reserve
 */
export const reserveStock = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { quantity, referenceId } = req.body;

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!quantity || quantity <= 0) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be a positive number');
    }

    if (!referenceId) {
      throw new AppError(400, 'MISSING_REFERENCE', 'Reference ID is required');
    }

    const product = await productService.reserveStock(id, quantity, referenceId, req.user.id);

    const response: ApiResponse<Product> = {
      success: true,
      data: product.toJSON() as Product,
    };

    res.json(response);
  }
);

/**
 * Release reserved stock
 * POST /api/admin/products/:id/inventory/release
 */
export const releaseStock = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { quantity, referenceId } = req.body;

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!quantity || quantity <= 0) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be a positive number');
    }

    if (!referenceId) {
      throw new AppError(400, 'MISSING_REFERENCE', 'Reference ID is required');
    }

    const product = await productService.releaseStock(id, quantity, referenceId, req.user.id);

    const response: ApiResponse<Product> = {
      success: true,
      data: product.toJSON() as Product,
    };

    res.json(response);
  }
);

/**
 * Adjust stock manually
 * POST /api/admin/products/:id/inventory/adjust
 */
export const adjustStock = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (quantity === undefined || quantity === 0) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity cannot be zero');
    }

    if (!reason || reason.trim() === '') {
      throw new AppError(400, 'MISSING_REASON', 'Reason is required for stock adjustment');
    }

    const product = await productService.adjustStock(id, quantity, reason, req.user.id);

    const response: ApiResponse<Product> = {
      success: true,
      data: product.toJSON() as Product,
    };

    res.json(response);
  }
);

/**
 * Set initial stock
 * POST /api/admin/products/:id/inventory/initial
 */
export const setInitialStock = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!quantity || quantity < 0) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be zero or positive');
    }

    const product = await productService.setInitialStock(id, quantity, req.user.id);

    const response: ApiResponse<Product> = {
      success: true,
      data: product.toJSON() as Product,
    };

    res.json(response);
  }
);

/**
 * Record a return
 * POST /api/admin/products/:id/inventory/return
 */
export const recordReturn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { quantity, reason, referenceId } = req.body;

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!quantity || quantity <= 0) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be a positive number');
    }

    if (!reason || reason.trim() === '') {
      throw new AppError(400, 'MISSING_REASON', 'Reason is required for return');
    }

    const product = await productService.recordReturn(
      id,
      quantity,
      reason,
      referenceId || null,
      req.user.id
    );

    const response: ApiResponse<Product> = {
      success: true,
      data: product.toJSON() as Product,
    };

    res.json(response);
  }
);

/**
 * Get inventory movements for a product
 * GET /api/admin/products/:id/inventory/movements
 */
export const getInventoryMovements = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    await productService.findById(id); // Validate product exists

    const movements = await productService.getInventoryMovements(id, limit);

    const response: ApiResponse<InventoryMovement[]> = {
      success: true,
      data: movements.map((m) => m.toJSON() as InventoryMovement),
    };

    res.json(response);
  }
);

// Import AppError at the end to avoid circular dependency issues
import { AppError } from '../../middleware/error.middleware';
