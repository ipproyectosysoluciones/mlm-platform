/**
 * @fileoverview OrderController - Order API endpoints for streaming subscriptions
 * @description Handles order creation, listing, and retrieval with authentication.
 *             Gestión de endpoints de pedidos con autenticación.
 * @module controllers/OrderController
 * @author MLM Development Team
 *
 * @example
 * // English: POST /api/orders - Create new order
 * const response = await fetch('/api/orders', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({ items: [{ productId: 'uuid' }], paymentMethod: 'credit_card' })
 * });
 *
 * // Español: POST /api/orders - Crear nuevo pedido
 * const response = await fetch('/api/orders', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({ items: [{ productId: 'uuid' }], paymentMethod: 'tarjeta_credito' })
 * });
 */
import { Response } from 'express';
import { orderService } from '../services/OrderService';
import type { ApiResponse, OrderAttributes } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

/**
 * Create a new order
 * Crear un nuevo pedido
 *
 * @route POST /api/orders
 * @access Authenticated (JWT required)
 * @param {AuthenticatedRequest} req - Express request with order data
 * @param {Response} res - Express response
 * @returns {ApiResponse} Created order with product details
 *
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear pedido / Create order
 *     description: Crea un nuevo pedido con los productos seleccionados. Requiere autenticación.
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
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               paymentMethod:
 *                 type: string
 *                 enum: [manual, simulated]
 *                 default: simulated
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Pedido creado / Order created
 *       400:
 *         description: Error de validación / Validation error
 *       401:
 *         description: No autenticado / Not authenticated
 *       404:
 *         description: Producto no encontrado / Product not found
 */
export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  console.log('[DEBUG] createOrder called, req.user:', req.user?.id);
  try {
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
    const { productId, paymentMethod, notes } = req.body;

    // Validate request body
    if (!productId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
          details: {
            productId: ['Product ID is required'],
          },
        },
      });
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid product ID format',
          details: {
            productId: ['Product ID must be a valid UUID'],
          },
        },
      });
      return;
    }

    // Create the order
    const order = await orderService.createOrder(userId, {
      productId,
      paymentMethod,
      notes,
    });

    const response: ApiResponse<OrderAttributes> = {
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
      },
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create order',
      },
    });
  }
}

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
export async function getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch orders',
      },
    });
  }
}

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
export async function getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
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
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === 'ORDER_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found',
          },
        });
        return;
      }
      if (error.code === 'FORBIDDEN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this order',
          },
        });
        return;
      }
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch order',
      },
    });
  }
}
