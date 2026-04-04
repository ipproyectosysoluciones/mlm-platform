/**
 * @fileoverview CategoryService - Category management with hierarchical support
 * @description Handles CRUD operations, tree structure, and breadcrumb generation.
 *             Maximum depth of 5 levels is enforced.
 * @module services/CategoryService
 * @author MLM Development Team
 *
 * @example
 * // English: Get category tree
 * const tree = await categoryService.getTree();
 *
 * // Español: Obtener árbol de categorías
 * const tree = await categoryService.getTree();
 *
 * @example
 * // English: Get breadcrumb for a category
 * const breadcrumb = await categoryService.getBreadcrumb('category-id');
 *
 * // Español: Obtener migas de pan para una categoría
 * const breadcrumb = await categoryService.getBreadcrumb('category-id');
 */
import { Op } from 'sequelize';
import { Category, MAX_CATEGORY_DEPTH, Product } from '../models';
import { AppError } from '../middleware/error.middleware';
import type { CategoryAttributes, CategoryCreationAttributes } from '../types';
import type { CategoryCreation } from '../models/Category';

export interface CategoryTreeNode extends CategoryAttributes {
  children: CategoryTreeNode[];
}

export interface CategoryBreadcrumbItem {
  id: string;
  name: string;
  slug: string;
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryListOptions {
  isActive?: boolean;
  parentId?: string | null;
  includeInactive?: boolean;
}

export class CategoryService {
  /**
   * Get category by ID
   * @param {string} id - Category UUID
   * @returns {Promise<Category>} Category instance
   * @throws {AppError} 404 if not found
   */
  async findById(id: string): Promise<Category> {
    const category = await Category.findByPk(id);
    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    }
    return category;
  }

  /**
   * Get category by slug
   * @param {string} slug - Category slug
   * @returns {Promise<Category>} Category instance
   * @throws {AppError} 404 if not found
   */
  async findBySlug(slug: string): Promise<Category> {
    const category = await Category.findOne({ where: { slug } });
    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    }
    return category;
  }

  /**
   * Create a new category
   * @param {CreateCategoryDto} data - Category data
   * @returns {Promise<Category>} Created category
   * @throws {AppError} 400 if parent chain exceeds max depth or parent not found
   */
  async create(data: CreateCategoryDto): Promise<Category> {
    // Validate parent chain depth if parentId provided
    if (data.parentId) {
      // Validate parent exists AND is active
      const parent = await Category.findByPk(data.parentId);
      if (!parent) {
        throw new AppError(400, 'CATEGORY_PARENT_NOT_FOUND', 'Parent category not found');
      }
      if (!parent.isActive) {
        throw new AppError(
          400,
          'CATEGORY_PARENT_INACTIVE',
          'Cannot create child of inactive category'
        );
      }

      const depth = await this.getDepth(data.parentId);
      if (depth >= MAX_CATEGORY_DEPTH) {
        throw new AppError(
          400,
          'CATEGORY_DEPTH_EXCEEDED',
          `Category depth cannot exceed ${MAX_CATEGORY_DEPTH} levels`
        );
      }
    }

    // Check for duplicate slug
    const existing = await Category.findOne({ where: { slug: data.slug } });
    if (existing) {
      throw new AppError(409, 'CATEGORY_SLUG_EXISTS', 'Category slug already exists');
    }

    const category = await Category.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    } as CategoryCreation);

    return category;
  }

  /**
   * Update an existing category
   * @param {string} id - Category UUID
   * @param {UpdateCategoryDto} data - Update data
   * @returns {Promise<Category>} Updated category
   * @throws {AppError} 400 if parent chain would exceed max depth
   */
  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    // Validate parent chain depth if changing parentId
    if (data.parentId !== undefined && data.parentId !== null) {
      // Prevent circular reference
      if (data.parentId === id) {
        throw new AppError(400, 'CATEGORY_CIRCULAR_REF', 'Category cannot be its own parent');
      }

      // Check if new parent is a descendant
      const isDescendant = await this.isDescendant(data.parentId, id);
      if (isDescendant) {
        throw new AppError(
          400,
          'CATEGORY_CIRCULAR_REF',
          'Cannot set a descendant as parent (circular reference)'
        );
      }

      const depth = await this.getDepth(data.parentId);
      if (depth >= MAX_CATEGORY_DEPTH) {
        throw new AppError(
          400,
          'CATEGORY_DEPTH_EXCEEDED',
          `Category depth cannot exceed ${MAX_CATEGORY_DEPTH} levels`
        );
      }
    }

    // Check for duplicate slug if changing
    if (data.slug && data.slug !== category.slug) {
      const existing = await Category.findOne({ where: { slug: data.slug } });
      if (existing) {
        throw new AppError(409, 'CATEGORY_SLUG_EXISTS', 'Category slug already exists');
      }
    }

    await category.update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    });

    return category.reload();
  }

  /**
   * Delete a category (soft delete by deactivating)
   * @param {string} id - Category UUID
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    const category = await this.findById(id);

    // Check if category has products
    const productCount = await Product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new AppError(
        400,
        'CATEGORY_HAS_PRODUCTS',
        `Cannot delete category with ${productCount} products. Move or delete products first.`
      );
    }

    // Check if category has children
    const childCount = await Category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new AppError(
        400,
        'CATEGORY_HAS_CHILDREN',
        `Cannot delete category with ${childCount} child categories. Delete children first.`
      );
    }

    await category.update({ isActive: false });
  }

  /**
   * Hard delete a category (use with caution)
   * @param {string} id - Category UUID
   * @returns {Promise<void>}
   */
  async hardDelete(id: string): Promise<void> {
    const category = await this.findById(id);

    // Move children to parent of deleted category
    await Category.update({ parentId: category.parentId }, { where: { parentId: id } });

    await category.destroy();
  }

  /**
   * Get category tree (hierarchical structure)
   * @param {CategoryListOptions} options - Filter options
   * @returns {Promise<CategoryTreeNode[]>} Tree structure
   */
  async getTree(options: CategoryListOptions = {}): Promise<CategoryTreeNode[]> {
    const where: Record<string, unknown> = {};

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (!options.includeInactive) {
      where.isActive = true;
    }

    if (options.parentId !== undefined) {
      where.parentId = options.parentId;
    }

    const categories = await Category.findAll({
      where,
      order: [
        ['sortOrder', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return this.buildTree(categories, null);
  }

  /**
   * Get breadcrumb for a category (path from root to category)
   * @param {string} id - Category UUID
   * @returns {Promise<CategoryBreadcrumbItem[]>} Breadcrumb path
   */
  async getBreadcrumb(id: string): Promise<CategoryBreadcrumbItem[]> {
    const category = await this.findById(id);
    const breadcrumb: CategoryBreadcrumbItem[] = [];

    // Walk up the tree collecting ancestors
    let current: Category | null = category;
    while (current) {
      breadcrumb.unshift({
        id: current.id,
        name: current.name,
        slug: current.slug,
      });

      if (current.parentId) {
        current = await Category.findByPk(current.parentId);
      } else {
        current = null;
      }
    }

    return breadcrumb;
  }

  /**
   * Get all categories as flat list
   * @param {CategoryListOptions} options - Filter options
   * @returns {Promise<Category[]>} Flat category list
   */
  async list(options: CategoryListOptions = {}): Promise<Category[]> {
    const where: Record<string, unknown> = {};

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (!options.includeInactive) {
      where.isActive = true;
    }

    return Category.findAll({
      where,
      order: [
        ['sortOrder', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  }

  /**
   * Get depth of a category in the tree (how many levels from root)
   * @param {string} id - Category UUID
   * @returns {Promise<number>} Depth level (0 = root)
   */
  async getDepth(id: string): Promise<number> {
    let depth = 0;
    let current = await Category.findByPk(id);

    while (current && current.parentId) {
      depth++;
      current = await Category.findByPk(current.parentId);
    }

    return depth;
  }

  /**
   * Check if a category is a descendant of another
   * @param {string} potentialDescendant - Category UUID
   * @param {string} potentialAncestor - Category UUID
   * @returns {Promise<boolean>} True if descendant
   */
  async isDescendant(potentialDescendant: string, potentialAncestor: string): Promise<boolean> {
    let current = await Category.findByPk(potentialDescendant);

    while (current && current.parentId) {
      if (current.parentId === potentialAncestor) {
        return true;
      }
      current = await Category.findByPk(current.parentId);
    }

    return false;
  }

  /**
   * Get category with parent and children
   * @param {string} id - Category UUID
   * @returns {Promise<Category>} Category with associations
   */
  async getWithRelations(id: string): Promise<Category> {
    // Use findOne with paranoid:false to find soft-deleted records,
    // then manually filter by isActive so deleted categories return 404
    const category = await Category.findOne({
      where: { id, isActive: true },
      paranoid: false,
      include: [
        { model: Category, as: 'parent', where: { isActive: true }, required: false },
        { model: Category, as: 'children', where: { isActive: true }, required: false },
      ],
    });

    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    }

    return category;
  }

  /**
   * Build tree structure from flat list
   * @param {Category[]} categories - Flat list of categories
   * @param {string | null} parentId - Parent ID to filter by
   * @returns {CategoryTreeNode[]} Tree structure
   */
  private buildTree(categories: Category[], parentId: string | null): CategoryTreeNode[] {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .map((cat) => ({
        id: cat.id,
        parentId: cat.parentId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        children: this.buildTree(categories, cat.id),
      }));
  }
}

export const categoryService = new CategoryService();
