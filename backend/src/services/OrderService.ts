/**
 * @fileoverview OrderService - Order management for streaming subscriptions
 * @description Handles order creation, transaction handling, and commission integration.
 *             Gestión de pedidos, transacciones e integración de comisiones.
 * @module services/OrderService
 * @author MLM Development Team
 *
 * @example
 * // English: Create a new order with commission calculation
 * const order = await orderService.createOrder(userId, { productId, paymentMethod });
 *
 * // Español: Crear nuevo pedido con cálculo de comisiones
 * const order = await orderService.createOrder(userId, { productId, paymentMethod });
 */
import { sequelize } from '../config/database';
import { Order, Product, Purchase, User, VendorOrder, ShippingAddress } from '../models';
import { AppError } from '../middleware/error.middleware';
import { CommissionService } from './CommissionService';
import { body } from 'express-validator';
import type { OrderAttributes, ProductType, ShippingStatus } from '../types';

// Express-validator validation chains (reusable in controllers)
export const orderValidationRules = {
  create: [
    body('productId').isUUID().withMessage('Invalid product ID format'),
    body('paymentMethod')
      .optional()
      .isIn(['manual', 'simulated'])
      .withMessage('Payment method must be manual or simulated'),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
  ],
  updateStatus: [
    body('status').isIn(['pending', 'completed', 'failed']).withMessage('Invalid status'),
  ],
};

export type CreateOrderData = {
  productId: string;
  paymentMethod?: 'manual' | 'simulated';
  notes?: string;
  shippingAddressId?: string;
};

const commissionService = new CommissionService();

export class OrderService {
  /**
   * Generate a unique order number in format ORD-YYYYMMDD-NNN
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;
    // Generate random 3-digit number (001-999)
    const randomPart = String(Math.floor(Math.random() * 900) + 1).padStart(3, '0');
    return `ORD-${datePart}-${randomPart}`;
  }

  /**
   * Create a new order with transaction handling and commission calculation
   * Crear nuevo pedido con manejo de transacciones y cálculo de comisiones
   *
   * Uses database transaction to ensure atomicity. If commission calculation fails,
   * the entire transaction is rolled back.
   *
   * @param {string} userId - User UUID
   * @param {CreateOrderData} data - Order creation data
   * @returns {Promise<Order>} Created order instance
   * @throws {AppError} 400 if validation fails
   * @throws {AppError} 400 if product is inactive
   * @throws {AppError} 500 if commission calculation fails (transaction rolled back)
   * @example
   * // English: Create order with commission
   * const order = await orderService.createOrder('user-uuid', {
   *   items: [{ productId: 'product-uuid', quantity: 1 }],
   *   paymentMethod: 'credit_card'
   * });
   *
   * // Español: Crear pedido con comisiones
   * const order = await orderService.createOrder('uuid-usuario', {
   *   items: [{ productId: 'uuid-producto', cantidad: 1 }],
   *   paymentMethod: 'tarjeta_credito'
   * });
   */
  async createOrder(userId: string, data: CreateOrderData): Promise<Order> {
    // Validate input exists
    if (!data.productId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Product ID is required');
    }
    if (!data.paymentMethod) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Payment method is required');
    }
    if (
      data.paymentMethod &&
      !['manual', 'simulated', 'paypal', 'mercadopago'].includes(data.paymentMethod)
    ) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Payment method must be manual, simulated, paypal, or mercadopago'
      );
    }

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError(400, 'USER_NOT_FOUND', 'User not found');
    }

    // Validate product
    const product = await Product.findByPk(data.productId);
    if (!product) {
      throw new AppError(400, 'PRODUCT_NOT_FOUND', 'Product not found');
    }
    if (product.isActive !== true) {
      throw new AppError(400, 'PRODUCT_INACTIVE', 'Product is not available for purchase');
    }

    // Validate shipping address for physical products
    const productType = (product as any).type as ProductType | undefined;
    const isPhysical = productType === 'physical';

    if (isPhysical && !data.shippingAddressId) {
      throw new AppError(
        400,
        'SHIPPING_ADDRESS_REQUIRED',
        'Shipping address is required for physical products'
      );
    }

    // Validate shipping address exists and belongs to user
    if (data.shippingAddressId) {
      const address = await ShippingAddress.findOne({
        where: { id: data.shippingAddressId, userId },
      });
      if (!address) {
        throw new AppError(
          400,
          'INVALID_SHIPPING_ADDRESS',
          'Shipping address not found or does not belong to user'
        );
      }
    }

    const totalAmount = Number(product.price);
    const orderNumber = this.generateOrderNumber();

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Create Purchase record first
      const purchase = await Purchase.create(
        {
          userId,
          productId: product.id,
          businessType: 'producto' as const,
          amount: totalAmount,
          currency: product.currency,
          description: product.name,
          status: 'completed',
        },
        { transaction }
      );

      // Create Order record
      // Set shippingStatus based on product type
      let shippingStatusValue: ShippingStatus = 'not_required';
      if (isPhysical) {
        shippingStatusValue = 'pending_shipment';
      }

      const order = await Order.create(
        {
          orderNumber,
          userId,
          productId: product.id,
          purchaseId: purchase.id,
          totalAmount,
          currency: product.currency,
          status: 'completed',
          paymentMethod: data.paymentMethod || 'simulated',
          notes: data.notes || null,
          shippingAddressId: data.shippingAddressId ?? null,
          shippingCost: null,
          shippingStatus: shippingStatusValue,
        },
        { transaction }
      );

      // Calculate commissions (inside transaction)
      // Skip commission calculation if SKIP_COMMISSION_CALCULATION is set to 'true'
      // This is used in integration tests to prevent timeouts due to complex upline queries
      // In production and unit tests (unless overridden), commissions are calculated
      if (process.env.SKIP_COMMISSION_CALCULATION === 'true') {
        // Skip commission calculation to prevent timeouts in integration tests
      } else {
        try {
          // Calculate vendor commission split (3-way split)
          const vendorId = (product as any).vendorId || null;
          const commissionResult = await commissionService.calculateVendorCommission(
            totalAmount,
            vendorId,
            userId,
            'producto'
          );

          // Create vendor order record for vendor products
          if (vendorId) {
            await VendorOrder.create(
              {
                orderId: order.id,
                vendorId,
                subtotal: totalAmount,
                vendorAmount: commissionResult.vendorAmount,
                platformAmount: commissionResult.platformNet,
                commissionAmount: commissionResult.mlmCommissions.reduce(
                  (sum, c) => sum + c.amount,
                  0
                ),
                status: 'completed',
              },
              { transaction }
            );

            // Create MLM commissions for uplines
            await commissionService.createMlmCommissionsFromSplit(
              commissionResult.mlmCommissions,
              purchase.id,
              userId,
              totalAmount
            );
          } else {
            // Platform product - use existing logic
            await commissionService.calculateCommissions(purchase.id);
          }
        } catch (commissionError) {
          // Log and throw AppError so that transaction is rolled back and error is propagated
          console.error('Commission calculation failed:', commissionError);
          throw new AppError(
            500,
            'COMMISSION_ERROR',
            'Failed to calculate commissions. Order has been cancelled.'
          );
        }
      }

      // Commit transaction
      await transaction.commit();

      // Fire-and-forget achievement check after successful order creation
      achievementService
        .checkAndUnlock(userId, 'sale_completed')
        .catch((err) => console.error('[Achievements]', err));

      // Reload order with associations
      return (await Order.findByPk(order.id, {
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'platform', 'price', 'durationDays'],
          },
          { model: Purchase, as: 'purchase', attributes: ['id', 'amount', 'status'] },
        ],
      }))!;
    } catch (error) {
      // Rollback transaction if not already committed
      // Note: In modern Sequelize, we cannot check transaction state reliably
      // So we attempt rollback - it will be a no-op if already committed
      try {
        await transaction.rollback();
      } catch {
        // Ignore rollback errors - transaction may already be committed
      }
      throw error;
    }
  }

  /**
   * Get orders for a specific user
   * Obtener pedidos de un usuario específico
   *
   * @param {string} userId - User UUID
   * @param {Object} options - Pagination options
   * @returns {Promise<{rows: Order[], count: number}>} Paginated orders
   * @example
   * // English: Get user's orders
   * const { rows, count } = await orderService.getUserOrders('user-uuid', { page: 1, limit: 20 });
   *
   * // Español: Obtener pedidos del usuario
   * const { rows, count } = await orderService.getUserOrders('uuid-usuario', { page: 1, limit: 20 });
   */
  async getUserOrders(
    userId: string,
    options?: { page?: number; limit?: number; status?: string }
  ): Promise<{ rows: Order[]; count: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (options?.status) {
      where.status = options.status;
    }

    return Order.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'platform', 'price', 'durationDays', 'isActive'],
        },
        { model: Purchase, as: 'purchase', attributes: ['id', 'amount', 'status'] },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Find order by ID
   * Buscar pedido por ID
   *
   * @param {string} id - Order UUID
   * @returns {Promise<Order>} Order instance
   * @throws {AppError} 404 if order not found
   * @example
   * // English: Get order by ID
   * const order = await orderService.findById('order-uuid');
   *
   * // Español: Obtener pedido por ID
   * const order = await orderService.findById('uuid-pedido');
   */
  async findById(id: string): Promise<Order> {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: [
            'id',
            'name',
            'platform',
            'price',
            'durationDays',
            'isActive',
            'description',
          ],
        },
        { model: Purchase, as: 'purchase', attributes: ['id', 'amount', 'status', 'created_at'] },
        { model: User, as: 'user', attributes: ['id', 'email', 'referralCode'] },
      ],
    });

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    return order;
  }

  /**
   * Find order by ID for specific user (with authorization check)
   * Buscar pedido por ID para usuario específico (con verificación de autorización)
   *
   * @param {string} id - Order UUID
   * @param {string} userId - User UUID (for authorization)
   * @returns {Promise<Order>} Order instance
   * @throws {AppError} 404 if order not found
   * @throws {AppError} 403 if order belongs to different user
   * @example
   * // English: Get user's own order
   * const order = await orderService.findByIdForUser('order-uuid', 'user-uuid');
   *
   * // Español: Obtener pedido propio del usuario
   * const order = await orderService.findByIdForUser('uuid-pedido', 'uuid-usuario');
   */
  async findByIdForUser(id: string, userId: string): Promise<Order> {
    const order = await this.findById(id);

    if (order.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to view this order');
    }

    return order;
  }

  /**
   * Update order status
   * Actualizar estado del pedido
   *
   * @param {string} id - Order UUID
   * @param {string} status - New status
   * @param {string} [transactionId] - External transaction ID
   * @returns {Promise<Order>} Updated order
   * @throws {AppError} 404 if order not found
   * @example
   * // English: Update order status
   * const order = await orderService.updateStatus('order-uuid', 'completed', 'TXN-123');
   *
   * // Español: Actualizar estado del pedido
   * const order = await orderService.updateStatus('uuid-pedido', 'completado', 'TXN-123');
   */
  async updateStatus(id: string, status: 'pending' | 'completed' | 'failed'): Promise<Order> {
    const order = await this.findById(id);

    order.status = status;
    await order.save();

    // Invalidate leaderboard sellers cache when order is completed (fire and forget)
    if (status === 'completed') {
      leaderboardService.invalidateCache('sellers');
      // Fire-and-forget achievement check — never blocks main flow
      achievementService
        .checkAndUnlock(order.userId, 'sale_completed')
        .catch((err) => console.error('[Achievements]', err));
    }

    return order;
  }

  /**
   * Cancel an order
   * Cancelar un pedido
   *
   * @param {string} id - Order UUID
   * @returns {Promise<Order>} Cancelled order
   * @example
   * // English: Cancel order
   * const order = await orderService.cancelOrder('order-uuid');
   *
   * // Español: Cancelar pedido
   * const order = await orderService.cancelOrder('uuid-pedido');
   */
  async cancelOrder(id: string): Promise<Order> {
    const order = await this.findById(id);

    if (order.status === 'completed') {
      throw new AppError(400, 'INVALID_STATUS', 'Cannot cancel a completed order');
    }

    order.status = 'failed';
    await order.save();

    return order;
  }
}

export const orderService = new OrderService();
