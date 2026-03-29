/**
 * @fileoverview OrderRoutes - Order route definitions and validation
 * @description Defines API routes for orders with authentication and validation.
 *             Define las rutas de API para pedidos con autenticación y validación.
 * @module routes/order.routes
 * @author MLM Development Team
 *
 * @example
 * // English: POST /api/orders - Create new order
 * router.post('/', authenticateToken, createOrder);
 *
 * // Español: POST /api/orders - Crear nuevo pedido
 * router.post('/', authenticateToken, createOrder);
 */
import { Router, Router as ExpressRouter } from 'express';
import { createOrder, getOrders, getOrderById } from '../controllers/OrderController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { body, param, query } from 'express-validator';

const router: ExpressRouter = Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear pedido / Create order
 *     description: Crea un nuevo pedido con los productos seleccionados. Requiere autenticación JWT.
 *     tags: [orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - paymentMethod
 *             properties:
 *               items:
 *                 type: array
 *                 minLength: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       description: ID del producto / Product ID
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       default: 1
 *                       description: Cantidad / Quantity
 *               paymentMethod:
 *                 type: string
 *                 description: Método de pago / Payment method
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente / Order created successfully
 *       400:
 *         description: Error de validación / Validation error
 *       401:
 *         description: No autenticado / Not authenticated
 *       404:
 *         description: Producto no encontrado / Product not found
 *       500:
 *         description: Error interno / Internal error
 */
router.post(
  '/',
  authenticateToken,
  validate([
    // Validate items array
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    // Validate each item in the array
    body('items.*.productId').isUUID('4').withMessage('Product ID must be a valid UUID'),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    // Validate payment method
    body('paymentMethod').isString().notEmpty().withMessage('Payment method is required'),
  ]),
  asyncHandler(createOrder)
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar pedidos del usuario / List user orders
 *     description: Obtiene lista de pedidos del usuario autenticado. Requiere autenticación JWT.
 *     tags: [orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página / Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Límite por página / Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled, refunded]
 *         description: Filtrar por estado / Filter by status
 *     responses:
 *       200:
 *         description: Lista de pedidos / Order list
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
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: No autenticado / Not authenticated
 *       500:
 *         description: Error interno / Internal error
 */
router.get(
  '/',
  authenticateToken,
  validate([
    // Validate page query parameter
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    // Validate limit query parameter
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    // Validate status query parameter
    query('status')
      .optional()
      .isIn(['pending', 'completed', 'cancelled', 'refunded'])
      .withMessage('Status must be one of: pending, completed, cancelled, refunded'),
  ]),
  asyncHandler(getOrders)
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener pedido por ID / Get order by ID
 *     description: Retorna los detalles de un pedido específico. Solo el propietario puede verlo.
 *     tags: [orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del pedido / Order ID
 *     responses:
 *       200:
 *         description: Detalles del pedido / Order details
 *       400:
 *         description: ID inválido / Invalid ID format
 *       401:
 *         description: No autenticado / Not authenticated
 *       403:
 *         description: Acceso denegado / Access denied
 *       404:
 *         description: Pedido no encontrado / Order not found
 */
router.get(
  '/:id',
  authenticateToken,
  validate([
    // Validate UUID format for order ID - accept any valid UUID including nil UUID
    param('id')
      .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      .withMessage('Order ID must be a valid UUID'),
  ]),
  asyncHandler(getOrderById)
);

export default router;
