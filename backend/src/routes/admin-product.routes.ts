/**
 * @fileoverview Admin Product Routes - Admin product CRUD and inventory operations
 * @description Defines API routes for admin product management with authentication and authorization.
 * @module routes/admin-product.routes
 * @author MLM Development Team
 *
 * @example
 * // English: Admin creates a product
 * router.post('/', requireAdmin, createProduct);
 *
 * // Español: Admin crea un producto
 * router.post('/', requireAdmin, createProduct);
 */
import { Router, Router as ExpressRouter } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductAdmin,
  listProductsAdmin,
} from '../controllers/products/ProductWriteController';
import {
  reserveStock,
  releaseStock,
  adjustStock,
  setInitialStock,
  recordReturn,
  getInventoryMovements,
} from '../controllers/products/ProductInventoryController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: List all products (admin)
 *     description: Get paginated list of all products with admin filters
 *     tags: [admin, products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [physical, digital, subscription, service]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: minStock
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxStock
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product list
 */
router.get('/', asyncHandler(listProductsAdmin));

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     summary: Get product by ID (admin)
 *     description: Get full product details including category
 *     tags: [admin, products]
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
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', asyncHandler(getProductAdmin));

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product with all fields
 *     tags: [admin, products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProduct'
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error
 */
router.post('/', asyncHandler(createProduct));

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Update a product
 *     description: Update product details
 *     tags: [admin, products]
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
 *             $ref: '#/components/schemas/UpdateProduct'
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.put('/:id', asyncHandler(updateProduct));

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Soft delete a product (sets isActive to false)
 *     tags: [admin, products]
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
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete('/:id', asyncHandler(deleteProduct));

// ============================================
// INVENTORY MANAGEMENT ROUTES
// ============================================

/**
 * @swagger
 * /admin/products/{id}/inventory/reserve:
 *   post:
 *     summary: Reserve stock
 *     description: Reserve stock for an order
 *     tags: [admin, products, inventory]
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
 *             required:
 *               - quantity
 *               - referenceId
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               referenceId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Stock reserved
 *       400:
 *         description: Insufficient stock
 */
router.post('/:id/inventory/reserve', asyncHandler(reserveStock));

/**
 * @swagger
 * /admin/products/{id}/inventory/release:
 *   post:
 *     summary: Release reserved stock
 *     description: Release stock when order is cancelled
 *     tags: [admin, products, inventory]
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
 *             required:
 *               - quantity
 *               - referenceId
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               referenceId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Stock released
 */
router.post('/:id/inventory/release', asyncHandler(releaseStock));

/**
 * @swagger
 * /admin/products/{id}/inventory/adjust:
 *   post:
 *     summary: Adjust stock manually
 *     description: Manually adjust stock quantity with reason
 *     tags: [admin, products, inventory]
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
 *             required:
 *               - quantity
 *               - reason
 *             properties:
 *               quantity:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock adjusted
 *       400:
 *         description: Invalid adjustment
 */
router.post('/:id/inventory/adjust', asyncHandler(adjustStock));

/**
 * @swagger
 * /admin/products/{id}/inventory/initial:
 *   post:
 *     summary: Set initial stock
 *     description: Set initial stock quantity
 *     tags: [admin, products, inventory]
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
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Initial stock set
 */
router.post('/:id/inventory/initial', asyncHandler(setInitialStock));

/**
 * @swagger
 * /admin/products/{id}/inventory/return:
 *   post:
 *     summary: Record a return
 *     description: Record returned items
 *     tags: [admin, products, inventory]
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
 *             required:
 *               - quantity
 *               - reason
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               reason:
 *                 type: string
 *               referenceId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Return recorded
 */
router.post('/:id/inventory/return', asyncHandler(recordReturn));

/**
 * @swagger
 * /admin/products/{id}/inventory/movements:
 *   get:
 *     summary: Get inventory movements
 *     description: Get audit trail of stock changes
 *     tags: [admin, products, inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of inventory movements
 */
router.get('/:id/inventory/movements', asyncHandler(getInventoryMovements));

export default router;
