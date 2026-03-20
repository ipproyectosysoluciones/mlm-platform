import { Router, Router as ExpressRouter } from 'express';
import { body } from 'express-validator';
import { getCommissions, getCommissionStats, createPurchase } from '../controllers/CommissionController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /commissions:
 *   get:
 *     summary: Obtener comisiones del usuario / Get user commissions
 *     description: Retorna lista de comisiones con paginación.
 *     tags: [commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de resultados / Results limit
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset de paginación / Pagination offset
 *     responses:
 *       200:
 *         description: Lista de comisiones / Commissions list
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [direct, level_1, level_2, level_3, level_4]
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, paid]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No autenticado / Not authenticated
 */
router.get('/', asyncHandler(getCommissions));

/**
 * @swagger
 * /commissions/stats:
 *   get:
 *     summary: Obtener estadísticas de comisiones / Get commission statistics
 *     tags: [commissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de comisiones / Commission statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPending:
 *                   type: number
 *                 totalApproved:
 *                   type: number
 *                 totalPaid:
 *                   type: number
 *                 totalEarned:
 *                   type: number
 *                 byType:
 *                   type: object
 *                   properties:
 *                     direct:
 *                       type: number
 *                     level_1:
 *                       type: number
 *                     level_2:
 *                       type: number
 */
router.get('/stats', asyncHandler(getCommissionStats));

/**
 * @swagger
 * /commissions:
 *   post:
 *     summary: Crear una compra (genera comisiones) / Create a purchase (generates commissions)
 *     description: Crea una nueva compra y distribuye comisiones a la red.
 *     tags: [commissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Monto de la compra / Purchase amount
 *               currency:
 *                 type: string
 *                 enum: [USD, COP, MXN]
 *                 default: USD
 *               description:
 *                 type: string
 *                 description: Descripción opcional / Optional description
 *     responses:
 *       201:
 *         description: Compra creada / Purchase created
 *       400:
 *         description: Datos inválidos / Invalid data
 */
router.post(
  '/',
  validate([
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('currency')
      .optional()
      .isIn(['USD', 'COP', 'MXN'])
      .withMessage('Currency must be USD, COP, or MXN'),
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string'),
  ]),
  asyncHandler(createPurchase)
);

export default router;
