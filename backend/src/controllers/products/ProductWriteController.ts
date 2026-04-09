/**
 * @fileoverview ProductWriteController - Admin product CRUD operations
 * @description Handles product creation, update, and deletion for admin users.
 * @module controllers/products/ProductWriteController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { productService } from '../../services/ProductService';
import { asyncHandler } from '../../middleware/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import type { ApiResponse, ProductType } from '../../types';
import type { Product } from '../../models/Product';

/**
 * Create a new product
 * POST /api/admin/products
 */
export const createProduct = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      name,
      platform,
      description,
      price,
      currency,
      durationDays,
      isActive,
      type,
      sku,
      categoryId,
      stock,
      isDigital,
      maxQuantityPerUser,
      metadata,
      images,
    } = req.body;

    const product = await productService.create({
      name,
      platform,
      description,
      price,
      currency,
      durationDays,
      isActive,
      type: type as ProductType,
      sku,
      categoryId,
      stock,
      isDigital,
      maxQuantityPerUser,
      metadata,
      images,
    });

    const response: ApiResponse<Product> = {
      success: true,
      data: product.toJSON() as Product,
    };

    res.status(201).json(response);
  }
);

/**
 * Update an existing product
 * PUT /api/admin/products/:id
 */
export const updateProduct = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
      name,
      platform,
      description,
      price,
      currency,
      durationDays,
      isActive,
      type,
      sku,
      categoryId,
      stock,
      isDigital,
      maxQuantityPerUser,
      metadata,
      images,
    } = req.body;

    const product = await productService.update(id, {
      name,
      platform,
      description,
      price,
      currency,
      durationDays,
      isActive,
      type: type as ProductType,
      sku,
      categoryId,
      stock,
      isDigital,
      maxQuantityPerUser,
      metadata,
      images,
    });

    const response: ApiResponse<Product> = {
      success: true,
      data: product.toJSON() as Product,
    };

    res.json(response);
  }
);

/**
 * Delete a product (soft delete)
 * DELETE /api/admin/products/:id
 */
export const deleteProduct = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    await productService.delete(id);

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
    };

    res.json(response);
  }
);

/**
 * Get product by ID (admin view with all details)
 * GET /api/admin/products/:id
 */
export const getProductAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const product = await productService.findByIdWithCategory(id);

    const response: ApiResponse<Product> = {
      success: true,
      data: product.toJSON() as Product,
    };

    res.json(response);
  }
);

/**
 * List all products (admin view with filters)
 * GET /api/admin/products
 */
export const listProductsAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const platform = req.query.platform as string | undefined;
    const isActive =
      req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const type = req.query.type as ProductType | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const minStock = req.query.minStock ? parseInt(req.query.minStock as string) : undefined;
    const maxStock = req.query.maxStock ? parseInt(req.query.maxStock as string) : undefined;
    const search = req.query.search as string | undefined;

    const result = await productService.getProductList({
      page,
      limit,
      platform: platform as Product['platform'] | undefined,
      isActive,
      type,
      categoryId,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      search,
    });

    // Response format: ApiResponse<Product[]> with top-level pagination (matches ProductReadController)
    const response: ApiResponse<Product[]> = {
      success: true,
      data: result.rows.map((p) => p.toJSON() as Product),
      pagination: {
        total: result.count,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };

    res.json(response);
  }
);
