/**
 * @fileoverview OrderWriteController - Order creation and management
 * @description Controlador de escritura de pedidos
 *              Handles order creation operations
 * @module controllers/orders/OrderWriteController
 * @author MLM Development Team
 *
 * @example
 * // English: Import from sub-controller
 * import { createOrder } from '../controllers/orders';
 *
 * // Español: Importar desde sub-controlador
 * import { createOrder } from '../controllers/orders';
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
export const createOrder: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log('[DEBUG] createOrder called, req.user:', req.user?.id);

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
    const { items, paymentMethod, notes } = req.body;

    // Extract productId from items array (route validation ensures items is a non-empty array)
    const productId = items?.[0]?.productId;

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

    // Validate UUID format - accept any valid UUID including all-zeros
    if (!UUID_REGEX.test(productId)) {
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
  }
);
