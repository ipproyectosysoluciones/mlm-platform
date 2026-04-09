/**
 * @fileoverview CategoryController - Category CRUD and tree operations
 * @description Handles category management, tree structure, and breadcrumb.
 * @module controllers/CategoryController
 * @author MLM Development Team
 *
 * @example
 * // English: GET /api/categories/tree - Get category tree
 * const response = await fetch('/api/categories/tree');
 *
 * // Español: GET /api/categories/tree - Obtener árbol de categorías
 * const response = await fetch('/api/categories/tree');
 */
import { Response } from 'express';
import { categoryService } from '../services/CategoryService';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/error.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types';
import type { Category } from '../models/Category';
import type { CategoryTreeNode, CategoryBreadcrumbItem } from '../services/CategoryService';

/**
 * Get category tree (public)
 * GET /api/categories/tree
 */
export const getCategoryTree = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const includeInactive = req.query.includeInactive === 'true';

    const tree = await categoryService.getTree({ includeInactive });

    const response: ApiResponse<CategoryTreeNode[]> = {
      success: true,
      data: tree,
    };

    res.json(response);
  }
);

/**
 * Get breadcrumb for a category (public)
 * GET /api/categories/:id/breadcrumb
 */
export const getCategoryBreadcrumb = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const breadcrumb = await categoryService.getBreadcrumb(id);

    const response: ApiResponse<CategoryBreadcrumbItem[]> = {
      success: true,
      data: breadcrumb,
    };

    res.json(response);
  }
);

/**
 * Get category by ID (public)
 * GET /api/categories/:id
 */
export const getCategoryById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const category = await categoryService.getWithRelations(id);

    const response: ApiResponse<Category> = {
      success: true,
      data: category.toJSON() as Category,
    };

    res.json(response);
  }
);

/**
 * List all categories (public)
 * GET /api/categories
 */
export const listCategories = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const includeInactive = req.query.includeInactive === 'true';
    const parentId = req.query.parentId as string | undefined;
    const isActive =
      req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const categories = await categoryService.list({
      includeInactive,
      parentId,
      isActive,
    });

    const response: ApiResponse<Category[]> = {
      success: true,
      data: categories.map((c) => c.toJSON() as Category),
    };

    res.json(response);
  }
);

/**
 * Create a new category (admin only)
 * POST /api/admin/categories
 */
export const createCategory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, slug, description, parentId, isActive, sortOrder } = req.body;

    if (!name || name.trim() === '') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Category name is required');
    }

    if (!slug || slug.trim() === '') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Category slug is required');
    }

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Slug must be lowercase alphanumeric with hyphens only'
      );
    }

    const category = await categoryService.create({
      name,
      slug,
      description,
      parentId,
      isActive,
      sortOrder,
    });

    const response: ApiResponse<Category> = {
      success: true,
      data: category.toJSON() as Category,
    };

    res.status(201).json(response);
  }
);

/**
 * Update an existing category (admin only)
 * PUT /api/admin/categories/:id
 */
export const updateCategory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, slug, description, parentId, isActive, sortOrder } = req.body;

    // Validate slug format if provided
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Slug must be lowercase alphanumeric with hyphens only'
      );
    }

    const category = await categoryService.update(id, {
      name,
      slug,
      description,
      parentId,
      isActive,
      sortOrder,
    });

    const response: ApiResponse<Category> = {
      success: true,
      data: category.toJSON() as Category,
    };

    res.json(response);
  }
);

/**
 * Delete a category (admin only - soft delete)
 * DELETE /api/admin/categories/:id
 */
export const deleteCategory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    await categoryService.delete(id);

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
    };

    res.json(response);
  }
);

/**
 * Get category with children (admin view)
 * GET /api/admin/categories/:id
 */
export const getCategoryAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const category = await categoryService.getWithRelations(id);

    const response: ApiResponse<Category> = {
      success: true,
      data: category.toJSON() as Category,
    };

    res.json(response);
  }
);

/**
 * List all categories with full details (admin)
 * GET /api/admin/categories
 */
export const listCategoriesAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const includeInactive = req.query.includeInactive === 'true';
    const parentId = req.query.parentId as string | undefined;

    const categories = await categoryService.list({
      includeInactive,
      parentId,
    });

    const response: ApiResponse<Category[]> = {
      success: true,
      data: categories.map((c) => c.toJSON() as Category),
    };

    res.json(response);
  }
);
