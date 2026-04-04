/**
 * @fileoverview Gift Card Routes - API endpoints for gift card operations
 * @description Endpoints for gift card creation, validation, redemption, listing, and details
 *              Rutas API para operaciones de gift cards: creación, validación, canje, listado y detalles
 * @module routes/gift-cards.routes
 * @author MLM Development Team
 */
import { Router, Router as ExpressRouter } from 'express';
import { body, param, query } from 'express-validator';
import {
  createGiftCard,
  validateGiftCard,
  redeemGiftCard,
  listGiftCards,
  getGiftCardDetails,
} from '../controllers/GiftCardController';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// All gift card routes require authentication
router.use(authenticateToken);

// ============================================
// Admin-only routes — Rutas solo admin
// ============================================

/**
 * @swagger
 * /gift-cards:
 *   post:
 *     summary: Create a new gift card (admin only) / Crear una nueva gift card (solo admin)
 *     description: Creates a new gift card with QR code. Requires admin role.
 *     tags: [gift-cards]
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
 *                 description: Gift card balance amount / Monto del balance de la gift card
 *               expiresInDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 default: 30
 *                 description: Days until expiration / Días hasta expiración
 *     responses:
 *       201:
 *         description: Gift card created successfully / Gift card creada exitosamente
 *       400:
 *         description: Invalid amount or parameters / Monto o parámetros inválidos
 *       401:
 *         description: Not authenticated / No autenticado
 *       403:
 *         description: Not authorized (admin only) / No autorizado (solo admin)
 */
router.post(
  '/',
  requireAdmin,
  validate([
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('expiresInDays')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Expiration must be between 1 and 365 days'),
  ]),
  asyncHandler(createGiftCard)
);

/**
 * @swagger
 * /gift-cards:
 *   get:
 *     summary: List all gift cards (admin only) / Listar todas las gift cards (solo admin)
 *     description: Returns paginated list of gift cards with optional status filter
 *     tags: [gift-cards]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, redeemed, expired, cancelled]
 *     responses:
 *       200:
 *         description: Gift cards retrieved successfully / Gift cards obtenidas exitosamente
 *       401:
 *         description: Not authenticated / No autenticado
 *       403:
 *         description: Not authorized (admin only) / No autorizado (solo admin)
 */
router.get(
  '/',
  requireAdmin,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['active', 'redeemed', 'expired', 'cancelled'])
      .withMessage('Invalid status filter'),
  ]),
  asyncHandler(listGiftCards)
);

// ============================================
// Authenticated user routes — Rutas de usuario autenticado
// ============================================

/**
 * @swagger
 * /gift-cards/{giftCardId}/validate:
 *   get:
 *     summary: Validate a gift card / Validar una gift card
 *     description: Checks if a gift card is valid, active, and not expired
 *     tags: [gift-cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: giftCardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Gift card UUID / UUID de la gift card
 *     responses:
 *       200:
 *         description: Validation result returned / Resultado de validación retornado
 *       401:
 *         description: Not authenticated / No autenticado
 */
router.get(
  '/:giftCardId/validate',
  validate([param('giftCardId').isUUID().withMessage('Invalid gift card ID')]),
  asyncHandler(validateGiftCard)
);

/**
 * @swagger
 * /gift-cards/{giftCardId}/redeem:
 *   post:
 *     summary: Redeem a gift card / Canjear una gift card
 *     description: Redeems the full balance of a gift card (all-or-nothing)
 *     tags: [gift-cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: giftCardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Gift card UUID / UUID de la gift card
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional order ID to associate / ID de orden opcional a asociar
 *     responses:
 *       200:
 *         description: Gift card redeemed successfully / Gift card canjeada exitosamente
 *       400:
 *         description: Gift card expired or inactive / Gift card expirada o inactiva
 *       404:
 *         description: Gift card not found / Gift card no encontrada
 *       409:
 *         description: Gift card already redeemed / Gift card ya canjeada
 */
router.post(
  '/:giftCardId/redeem',
  validate([
    param('giftCardId').isUUID().withMessage('Invalid gift card ID'),
    body('orderId').optional().isUUID().withMessage('Invalid order ID'),
  ]),
  asyncHandler(redeemGiftCard)
);

/**
 * @swagger
 * /gift-cards/{giftCardId}:
 *   get:
 *     summary: Get gift card details (admin only) / Obtener detalles de gift card (solo admin)
 *     description: Returns full gift card details including QR mapping and transaction history
 *     tags: [gift-cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: giftCardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Gift card UUID / UUID de la gift card
 *     responses:
 *       200:
 *         description: Gift card details retrieved / Detalles de gift card obtenidos
 *       404:
 *         description: Gift card not found / Gift card no encontrada
 *       401:
 *         description: Not authenticated / No autenticado
 *       403:
 *         description: Not authorized (admin only) / No autorizado (solo admin)
 */
router.get(
  '/:giftCardId',
  requireAdmin,
  validate([param('giftCardId').isUUID().withMessage('Invalid gift card ID')]),
  asyncHandler(getGiftCardDetails)
);

export default router;
