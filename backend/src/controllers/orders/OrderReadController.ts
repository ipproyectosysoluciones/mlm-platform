/**
 * @fileoverview OrderReadController - Order retrieval operations
 * @description Controlador de lectura de pedidos
 *              Handles order listing and retrieval
 * @module controllers/orders/OrderReadController
 * @author MLM Development Team
 *
 * @example
 * // English: Import from sub-controller
 * import { getOrders, getOrderById } from '../controllers/orders';
 *
 * // Español: Importar desde sub-controlador
 * import { getOrders, getOrderById } from '../controllers/orders';
 */
import { Response, RequestHandler } from 'express';
import { orderService } from '../../services/OrderService';
import type { ApiResponse, OrderAttributes } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * UUID validation regex
 * Expresión regular para validación de UUID
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get list of orders for current user
 * Obtener lista de pedidos del usuario actual
 *
 * @route GET /api/orders
 * @access Authenticated (JWT required)
 * @param {AuthenticatedRequest} req - Express request with query params
 * @param {Response} res - Express response
 * @returns {ApiResponse} Paginated order list
 *
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar pedidos del usuario / List user orders
 *     description: Obtiene lista de pedidos del usuario autenticado. Requiere autenticación.
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
 *           enum: [pending, completed, failed]
 *         description: Filtrar por estado / Filter by status
 *     responses:
 *       200:
 *         description: Lista de pedidos / Order list
 *       401:
 *         description: No autenticado / Not authenticated
 */
export const getOrders: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;

    const result = await orderService.getUserOrders(userId, {
      page,
      limit,
      status,
    });

    const response: ApiResponse<OrderAttributes[]> = {
      success: true,
      data: result.rows.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        productId: order.productId,
        purchaseId: order.purchaseId,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        status: order.status,
        paymentMethod: order.paymentMethod,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      pagination: {
        total: result.count,
        page,
        limit,
        totalPages: Math.ceil(result.count / limit),
      },
    };

    res.json(response);
  }
);

/**
 * Get single order by ID
 * Obtener pedido individual por ID
 *
 * @route GET /api/orders/:id
 * @access Authenticated (JWT required, user must own the order)
 * @param {AuthenticatedRequest} req - Express request with order ID param
 * @param {Response} res - Express response
 * @returns {ApiResponse} Order details
 *
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
 *       401:
 *         description: No autenticado / Not authenticated
 *       403:
 *         description: Acceso denegado / Access denied
 *       404:
 *         description: Pedido no encontrado / Order not found
 */
export const getOrderById: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Validate UUID format - accept any valid UUID including all-zeros
    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid order ID format',
          details: {
            id: ['Order ID must be a valid UUID'],
          },
        },
      });
      return;
    }

    // Get order (authorization check is inside the service)
    const order = await orderService.findByIdForUser(id, userId);

    const response: ApiResponse<OrderAttributes & { product?: Record<string, unknown> }> = {
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        productId: order.productId,
        purchaseId: order.purchaseId,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        status: order.status,
        paymentMethod: order.paymentMethod,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        // Include product details if available
        ...(order.product && {
          product: {
            id: order.product.id,
            name: order.product.name,
            platform: order.product.platform,
            price: Number(order.product.price),
            durationDays: order.product.durationDays,
            description: order.product.description,
          },
        }),
      },
    };

    res.json(response);
  }
);
