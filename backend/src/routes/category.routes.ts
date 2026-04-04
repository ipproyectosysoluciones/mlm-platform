/**
 * @fileoverview Category Routes - Category CRUD and tree operations
 * @description Defines API routes for category management.
 *             Public routes for reading, admin routes for write operations.
 * @module routes/category.routes
 * @author MLM Development Team
 *
 * @example
 * // English: GET /api/categories/tree - Get category tree
 * const response = await fetch('/api/categories/tree');
 *
 * // Español: GET /api/categories/tree - Obtener árbol de categorías
 * const response = await fetch('/api/categories/tree');
 */
import { Router, Router as ExpressRouter } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getCategoryTree,
  getCategoryBreadcrumb,
  getCategoryById,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryAdmin,
  listCategoriesAdmin,
} from '../controllers/CategoryController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     summary: Get category tree
 *     description: Get hierarchical category tree structure
 *     tags: [categories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories
 *     responses:
 *       200:
 *         description: Category tree structure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryTree'
 */
router.get('/tree', asyncHandler(getCategoryTree));

/**
 * @swagger
 * /categories/{id}/breadcrumb:
 *   get:
 *     summary: Get category breadcrumb
 *     description: Get path from root to category
 *     tags: [categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Breadcrumb path
 *       404:
 *         description: Category not found
 */
router.get('/:id/breadcrumb', asyncHandler(getCategoryBreadcrumb));

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Get category with children
 *     tags: [categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/:id', asyncHandler(getCategoryById));

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List all categories
 *     description: Get flat list of categories with optional filters
 *     tags: [categories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Category list
 */
router.get('/', asyncHandler(listCategories));

// ============================================
// ADMIN ROUTES
// ============================================

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: List all categories (admin)
 *     description: Get flat list of categories with full details
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category list
 */
router.get('/', asyncHandler(listCategoriesAdmin));

/**
 * @swagger
 * /admin/categories/{id}:
 *   get:
 *     summary: Get category by ID (admin)
 *     description: Get category with parent and children
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/:id', asyncHandler(getCategoryAdmin));

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Create a new category
 *     description: Create a new category with optional parent
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Category slug already exists
 */
router.post('/', asyncHandler(createCategory));

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Update a category
 *     description: Update category details
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               isActive:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Category not found
 */
router.put('/:id', asyncHandler(updateCategory));

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Soft delete a category (sets isActive to false)
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category deleted
 *       400:
 *         description: Cannot delete - has products or children
 *       404:
 *         description: Category not found
 */
router.delete('/:id', asyncHandler(deleteCategory));

export default router;
