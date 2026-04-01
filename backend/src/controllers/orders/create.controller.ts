/**
 * @fileoverview Order Create Controller - Order creation endpoints
 * @description Handles new order creation
 * @module controllers/orders/create
 */
import { Response } from 'express';
import { orderService } from '../../services/OrderService';
import type { ApiResponse, OrderAttributes } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

/**
 * Create a new order
 */
export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
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

    const productId = items?.[0]?.productId;

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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
