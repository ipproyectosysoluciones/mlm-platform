/**
 * @fileoverview Admin Category Routes - Admin category operations
 * @description Defines API routes for admin category management.
 * @module routes/admin-category.routes
 * @author MLM Development Team
 */
import { Router, Router as ExpressRouter } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryAdmin,
  listCategoriesAdmin,
} from '../controllers/CategoryController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// All routes require authentication and admin role
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
