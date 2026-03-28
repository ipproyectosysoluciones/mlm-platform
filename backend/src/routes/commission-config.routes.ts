/**
 * @fileoverview Commission Config Routes - Admin endpoints for commission configuration
 * @description CRUD operations for commission rate configurations
 *              Rutas CRUD para configuraciones de tasas de comisión
 * @module routes/commission-config.routes
 * @author MLM Development Team
 */
import { Router, Router as ExpressRouter } from 'express';
import { body, param } from 'express-validator';
import {
  getAllConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig,
  getActiveRates,
} from '../controllers/CommissionConfigController';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /admin/commissions/config:
 *   get:
 *     summary: Get all commission configurations
 *     tags: [admin-commissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of commission configurations
 */
router.get('/', asyncHandler(getAllConfigs));

/**
 * @swagger
 * /admin/commissions/config/{id}:
 *   get:
 *     summary: Get commission config by ID
 *     tags: [admin-commissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Commission configuration
 */
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  asyncHandler(getConfigById)
);

/**
 * @swagger
 * /admin/commissions/config:
 *   post:
 *     summary: Create commission configuration
 *     tags: [admin-commissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessType
 *               - level
 *               - percentage
 *             properties:
 *               businessType:
 *                 type: string
 *                 enum: [suscripcion, producto, membresia, servicio, otro]
 *               customBusinessName:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [direct, level_1, level_2, level_3, level_4]
 *               percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *     responses:
 *       201:
 *         description: Created commission configuration
 */
router.post(
  '/',
  validate([
    body('businessType')
      .isIn(['suscripcion', 'producto', 'membresia', 'servicio', 'otro'])
      .withMessage('Invalid business type'),
    body('level')
      .isIn(['direct', 'level_1', 'level_2', 'level_3', 'level_4'])
      .withMessage('Invalid level'),
    body('percentage')
      .isFloat({ min: 0, max: 1 })
      .withMessage('Percentage must be between 0 and 1'),
  ]),
  asyncHandler(createConfig)
);

/**
 * @swagger
 * /admin/commissions/config/{id}:
 *   put:
 *     summary: Update commission configuration
 *     tags: [admin-commissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           properties:
 *             percentage:
 *               type: number
 *             isActive:
 *               type: boolean
 *     responses:
 *       200:
 *         description: Updated commission configuration
 */
router.put(
  '/:id',
  validate([
    param('id').isUUID().withMessage('Invalid ID'),
    body('percentage')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Percentage must be between 0 and 1'),
    body('isActive').optional().isBoolean(),
  ]),
  asyncHandler(updateConfig)
);

/**
 * @swagger
 * /admin/commissions/config/{id}:
 *   delete:
 *     summary: Delete commission configuration
 *     tags: [admin-commissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Configuration deleted
 */
router.delete(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  asyncHandler(deleteConfig)
);

/**
 * @swagger
 * /admin/commissions/rates/{businessType}:
 *   get:
 *     summary: Get active commission rates for a business type
 *     tags: [admin-commissions]
 *     parameters:
 *       - in: path
 *         name: businessType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active commission rates
 */
router.get(
  '/rates/:businessType',
  validate([
    param('businessType')
      .isIn(['suscripcion', 'producto', 'membresia', 'servicio', 'otro'])
      .withMessage('Invalid business type'),
  ]),
  asyncHandler(getActiveRates)
);

export default router;
