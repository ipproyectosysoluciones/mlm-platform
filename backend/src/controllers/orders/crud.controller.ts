/**
 * @fileoverview Order CRUD Controller - Order retrieval and management endpoints
 * @description Handles listing, retrieving, and canceling orders
 * @module controllers/orders/crud
 */
import { Response } from 'express';
import { orderService } from '../../services/OrderService';
import type { ApiResponse, OrderAttributes } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

/**
 * Get list of orders for current user
 */
export async function getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
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
 */
export async function getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const { id } = req.params;
    const userId = req.user.id;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

/**
 * Cancel a pending order
 */
export async function cancelOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const { id } = req.params;
    const userId = req.user.id;

    const order = await orderService.cancelOrder(id, userId);

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

    res.json(response);
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

    console.error('Error canceling order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to cancel order',
      },
    });
  }
}
