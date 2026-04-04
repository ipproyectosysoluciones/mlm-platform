/**
 * @fileoverview Cart Routes - API endpoints for cart management and abandoned cart recovery
 * @description Endpoints for cart CRUD, recovery token operations, and admin abandoned cart stats.
 *              Rutas API para CRUD de carrito, operaciones de token de recuperación, y stats admin.
 * @module routes/carts.routes
 * @author MLM Development Team
 */
import { Router, Router as ExpressRouter } from 'express';
import { body, param, query } from 'express-validator';
import {
  getMyCart,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  getCartByRecoveryToken,
  recoverCartByToken,
  listAbandonedCarts,
} from '../controllers/CartController';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// ============================================
// Public routes — Recovery (no auth required, token-based security)
// Rutas públicas — Recuperación (sin auth, seguridad basada en token)
// ============================================

/**
 * @swagger
 * /carts/recover/{token}:
 *   get:
 *     summary: Preview cart by recovery token / Vista previa del carrito por token de recuperación
 *     description: Returns cart data for recovery preview. Token is a UUID sent via email.
 *     tags: [carts]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recovery token UUID / UUID del token de recuperación
 *     responses:
 *       200:
 *         description: Cart data returned / Datos del carrito retornados
 *       400:
 *         description: Invalid or expired token / Token inválido o expirado
 *       404:
 *         description: Cart not found / Carrito no encontrado
 */
router.get(
  '/recover/:token',
  validate([param('token').isUUID().withMessage('Invalid recovery token format')]),
  asyncHandler(getCartByRecoveryToken)
);

/**
 * @swagger
 * /carts/recover/{token}:
 *   post:
 *     summary: Complete cart recovery / Completar recuperación del carrito
 *     description: Marks recovery token as used and restores the cart. One-time use only.
 *     tags: [carts]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recovery token UUID / UUID del token de recuperación
 *     responses:
 *       200:
 *         description: Cart recovered successfully / Carrito recuperado exitosamente
 *       400:
 *         description: Invalid or expired token / Token inválido o expirado
 *       410:
 *         description: Token already used / Token ya utilizado
 */
router.post(
  '/recover/:token',
  validate([param('token').isUUID().withMessage('Invalid recovery token format')]),
  asyncHandler(recoverCartByToken)
);

// ============================================
// Authenticated user routes — Cart CRUD
// Rutas de usuario autenticado — CRUD del carrito
// ============================================

// All routes below require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /carts/abandoned:
 *   get:
 *     summary: List abandoned carts (admin only) / Listar carritos abandonados (solo admin)
 *     description: Returns paginated list of abandoned carts with recovery stats.
 *     tags: [carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 365
 *     responses:
 *       200:
 *         description: Abandoned carts with stats / Carritos abandonados con estadísticas
 *       401:
 *         description: Not authenticated / No autenticado
 *       403:
 *         description: Not authorized (admin only) / No autorizado (solo admin)
 */
router.get(
  '/abandoned',
  requireAdmin,
  validate([
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365'),
  ]),
  asyncHandler(listAbandonedCarts)
);

/**
 * @swagger
 * /carts/me:
 *   get:
 *     summary: Get current user's cart / Obtener carrito del usuario actual
 *     description: Returns the active cart for the authenticated user. Creates one if none exists.
 *     tags: [carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully / Carrito obtenido exitosamente
 *       401:
 *         description: Not authenticated / No autenticado
 */
router.get('/me', asyncHandler(getMyCart));

/**
 * @swagger
 * /carts/me/items:
 *   post:
 *     summary: Add item to cart / Agregar item al carrito
 *     description: Adds a product to the user's cart. Creates cart if needed. Updates quantity if product already in cart.
 *     tags: [carts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: Product UUID / UUID del producto
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to add / Cantidad a agregar
 *     responses:
 *       201:
 *         description: Item added successfully / Item agregado exitosamente
 *       400:
 *         description: Invalid product or quantity / Producto o cantidad inválida
 *       404:
 *         description: Product not found / Producto no encontrado
 */
router.post(
  '/me/items',
  validate([
    body('productId').isUUID().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ]),
  asyncHandler(addItemToCart)
);

/**
 * @swagger
 * /carts/me/items/{cartItemId}:
 *   delete:
 *     summary: Remove item from cart / Eliminar item del carrito
 *     description: Removes a specific item from the user's active cart.
 *     tags: [carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item UUID / UUID del item del carrito
 *     responses:
 *       200:
 *         description: Item removed successfully / Item eliminado exitosamente
 *       404:
 *         description: Cart or item not found / Carrito o item no encontrado
 */
router.delete(
  '/me/items/:cartItemId',
  validate([param('cartItemId').isUUID().withMessage('Invalid cart item ID')]),
  asyncHandler(removeItemFromCart)
);

/**
 * @swagger
 * /carts/me/items/{cartItemId}:
 *   patch:
 *     summary: Update item quantity / Actualizar cantidad del item
 *     description: Updates the quantity of an item in the user's active cart.
 *     tags: [carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item UUID / UUID del item del carrito
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
 *                 minimum: 1
 *                 description: New quantity / Nueva cantidad
 *     responses:
 *       200:
 *         description: Quantity updated successfully / Cantidad actualizada exitosamente
 *       400:
 *         description: Invalid quantity / Cantidad inválida
 *       404:
 *         description: Cart or item not found / Carrito o item no encontrado
 */
router.patch(
  '/me/items/:cartItemId',
  validate([
    param('cartItemId').isUUID().withMessage('Invalid cart item ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ]),
  asyncHandler(updateCartItemQuantity)
);

export default router;
