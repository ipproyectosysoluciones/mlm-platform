/**
 * @fileoverview Unit tests for OrderService
 * @description Tests for OrderService including:
 *              - Order creation success, validation, product inactive
 *              - Transaction rollback on commission failure
 *              - Verification of Order, Purchase, and Commission records
 * @module __tests__/OrderService
 */

// Mock sequelize before importing models
// Create transaction mock that returns consistent object
const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockImplementation(() => Promise.resolve(mockTransaction)),
    query: jest.fn(),
    sync: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
  },
  resetSequelize: jest.fn(),
}));

// Make mockTransaction available globally for tests
const globalMockTransaction = mockTransaction;

// Mock all models
jest.mock('../models', () => ({
  Product: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  Order: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
    count: jest.fn(),
  },
  Purchase: {
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
    count: jest.fn(),
  },
  Commission: {
    findAndCountAll: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
    count: jest.fn(),
  },
}));

// Mock CommissionService - create a mock calculateCommissions function
const mockCalculateCommissions = jest.fn().mockResolvedValue([]);

jest.mock('../services/CommissionService', () => ({
  CommissionService: jest.fn().mockImplementation(() => ({
    calculateCommissions: mockCalculateCommissions,
  })),
}));

import { OrderService } from '../services/OrderService';
import { Order, Product, Purchase, User, Commission } from '../models';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CreateOrderData = any; // Use any to bypass TypeScript strict checks in tests

describe('OrderService', () => {
  let orderService: OrderService;

  // Mock data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    referralCode: 'TEST-ABC1',
    sponsorId: 'sponsor-456',
    level: 1,
    status: 'active' as const,
  };

  const mockActiveProduct = {
    id: 'product-1',
    name: 'Netflix Premium',
    platform: 'netflix',
    price: 15.99,
    isActive: true,
    description: '4 screens, Ultra HD',
    currency: 'USD',
    durationDays: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInactiveProduct = {
    id: 'product-2',
    name: 'Old Product',
    platform: 'other',
    price: 5.99,
    isActive: false,
    description: 'Legacy product',
    currency: 'USD',
    durationDays: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPurchase = {
    id: 'purchase-1',
    userId: 'user-123',
    productId: 'product-1',
    businessType: 'producto',
    amount: 15.99,
    currency: 'USD',
    description: 'Netflix Premium',
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 'order-1',
    userId: 'user-123',
    productId: 'product-1',
    purchaseId: 'purchase-1',
    totalAmount: 15.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'simulated',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCommission = {
    id: 'commission-1',
    userId: 'sponsor-456',
    fromUserId: 'user-123',
    purchaseId: 'purchase-1',
    type: 'direct',
    amount: 1.6,
    currency: 'USD',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset transaction mock
    mockTransaction.commit.mockResolvedValue(undefined);
    mockTransaction.rollback.mockResolvedValue(undefined);
    // Reset commission mock
    mockCalculateCommissions.mockResolvedValue([]);
    orderService = new OrderService();
  });

  describe('createOrder', () => {
    /**
     * Test: 9.3 - OrderService.createOrder() validation
     * Verifies input validation
     */
    it('should throw error when productId is missing', async () => {
      const data = {
        paymentMethod: 'simulated',
      } as unknown as CreateOrderData;

      await expect(orderService.createOrder('user-123', data)).rejects.toThrow(
        'Product ID is required'
      );
    });

    it('should throw error when productId is empty string', async () => {
      const data = {
        productId: '',
        paymentMethod: 'simulated',
      } as unknown as CreateOrderData;

      await expect(orderService.createOrder('user-123', data)).rejects.toThrow(
        'Product ID is required'
      );
    });

    it('should throw error when payment method is missing', async () => {
      const data: CreateOrderData = {
        productId: 'product-1',
      };

      await expect(orderService.createOrder('user-123', data)).rejects.toThrow(
        'Payment method is required'
      );
    });

    it('should throw error when user is not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const data: CreateOrderData = {
        productId: 'product-1',
        paymentMethod: 'simulated',
      };

      await expect(orderService.createOrder('nonexistent-user', data)).rejects.toThrow(
        'User not found'
      );
    });

    /**
     * Test: 9.3 - OrderService.createOrder() validation
     * Verifies product ID must be provided
     */
    it('should throw error when productId is missing', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const data = {
        paymentMethod: 'simulated',
      } as unknown as CreateOrderData;

      await expect(orderService.createOrder('user-123', data)).rejects.toThrow(
        'Product ID is required'
      );
    });

    /**
     * Test: 9.3 - OrderService.createOrder() product not found
     * Verifies error when product doesn't exist
     */
    it('should throw error when product not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Product.findByPk as jest.Mock).mockResolvedValue(null);

      const data: CreateOrderData = {
        productId: 'product-1',
        paymentMethod: 'simulated',
      };

      await expect(orderService.createOrder('user-123', data)).rejects.toThrow('Product not found');
    });

    /**
     * Test: 9.3 - OrderService.createOrder() product inactive
     * Verifies error when trying to purchase inactive product
     */
    it('should throw error when product is inactive', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Product.findByPk as jest.Mock).mockResolvedValue(mockInactiveProduct);

      const data: CreateOrderData = {
        productId: 'product-2',
        paymentMethod: 'simulated',
      };

      await expect(orderService.createOrder('user-123', data)).rejects.toThrow(
        'Product is not available for purchase'
      );
    });

    it('should throw error with PRODUCT_INACTIVE code for inactive products', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Product.findByPk as jest.Mock).mockResolvedValue(mockInactiveProduct);

      const data: CreateOrderData = {
        productId: 'product-2',
        paymentMethod: 'simulated',
      };

      try {
        await orderService.createOrder('user-123', data);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.code).toBe('PRODUCT_INACTIVE');
      }
    });

    /**
     * Test: 9.5 - OrderService.createOrder() success
     * Verifies successful order creation with Order, Purchase, and Commission
     */
    it('should create order, purchase, and trigger commission calculation on success', async () => {
      // Setup mocks
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Product.findByPk as jest.Mock).mockResolvedValue(mockActiveProduct);

      // Mock Purchase.create to return a purchase with id
      const mockPurchaseInstance = {
        ...mockPurchase,
        save: jest.fn().mockResolvedValue(mockPurchase),
        update: jest.fn().mockResolvedValue(mockPurchase),
      };
      (Purchase.create as jest.Mock).mockResolvedValue(mockPurchaseInstance);

      // Mock Order.create
      const mockOrderInstance = {
        ...mockOrder,
        save: jest.fn().mockResolvedValue(mockOrder),
      };
      (Order.create as jest.Mock).mockResolvedValue(mockOrderInstance);

      // Mock Order.findByPk to return order with associations
      (Order.findByPk as jest.Mock).mockResolvedValue({
        ...mockOrder,
        product: mockActiveProduct,
        purchase: mockPurchase,
      });

      const data: CreateOrderData = {
        productId: 'product-1',
        paymentMethod: 'simulated',
      };

      const result = await orderService.createOrder('user-123', data);

      // Verify Purchase was created
      expect(Purchase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          productId: 'product-1',
          amount: 15.99,
          currency: 'USD',
          description: 'Netflix Premium',
          status: 'completed',
        }),
        expect.any(Object)
      );

      // Verify Order was created
      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          productId: 'product-1',
          totalAmount: 15.99,
          currency: 'USD',
          status: 'completed',
          paymentMethod: 'simulated',
        }),
        expect.any(Object)
      );

      // Verify commission service was called
      expect(mockCalculateCommissions).toHaveBeenCalled();

      // Verify transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalled();

      // Verify result
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });

    /**
     * Test: 9.3 - OrderService.createOrder() total amount calculation
     * Verifies total amount matches product price (one-click purchase, no quantity)
     * Note: Quantity is not supported in one-click purchase design
     */
    it('should calculate correct total amount from product price', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Product.findByPk as jest.Mock).mockResolvedValue(mockActiveProduct);

      const mockPurchaseInstance = {
        ...mockPurchase,
        save: jest.fn().mockResolvedValue(mockPurchase),
        update: jest.fn().mockResolvedValue(mockPurchase),
      };
      (Purchase.create as jest.Mock).mockResolvedValue(mockPurchaseInstance);

      const mockOrderInstance = {
        ...mockOrder,
        save: jest.fn().mockResolvedValue(mockOrder),
      };
      (Order.create as jest.Mock).mockResolvedValue(mockOrderInstance);

      (Order.findByPk as jest.Mock).mockResolvedValue({
        ...mockOrder,
        product: mockActiveProduct,
        purchase: mockPurchase,
      });

      const data: CreateOrderData = {
        productId: 'product-1',
        paymentMethod: 'simulated',
      };

      await orderService.createOrder('user-123', data);

      // Verify total amount = product price (15.99) - one-click, no quantity
      expect(Purchase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 15.99,
        }),
        expect.any(Object)
      );
    });

    /**
     * Test: 9.4 - OrderService.createOrder() transaction rollback
     * Verifies rollback when commission calculation fails
     *
     * Note: This test verifies the transaction behavior by mocking commission service
     * to fail. The actual implementation catches commission errors and rolls back.
     */
    it('should rollback transaction when commission calculation fails', async () => {
      // Setup mocks
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Product.findByPk as jest.Mock).mockResolvedValue(mockActiveProduct);

      // Mock Purchase.create
      const mockPurchaseInstance = {
        ...mockPurchase,
        save: jest.fn().mockResolvedValue(mockPurchase),
        update: jest.fn().mockResolvedValue(mockPurchase),
      };
      (Purchase.create as jest.Mock).mockResolvedValue(mockPurchaseInstance);

      // Mock Order.create
      const mockOrderInstance = {
        ...mockOrder,
        save: jest.fn().mockResolvedValue(mockOrder),
      };
      (Order.create as jest.Mock).mockResolvedValue(mockOrderInstance);

      // Make commission calculation fail
      mockCalculateCommissions.mockRejectedValue(new Error('Commission calculation failed'));

      const data: CreateOrderData = {
        productId: 'product-1',
        paymentMethod: 'simulated',
      };

      await expect(orderService.createOrder('user-123', data)).rejects.toThrow(
        'Failed to calculate commissions. Order has been cancelled.'
      );

      // Verify transaction was rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();

      // Verify transaction was NOT committed
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should throw error with COMMISSION_ERROR code on commission failure', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Product.findByPk as jest.Mock).mockResolvedValue(mockActiveProduct);

      const mockPurchaseInstance = {
        ...mockPurchase,
        save: jest.fn().mockResolvedValue(mockPurchase),
        update: jest.fn().mockResolvedValue(mockPurchase),
      };
      (Purchase.create as jest.Mock).mockResolvedValue(mockPurchaseInstance);

      const mockOrderInstance = {
        ...mockOrder,
        save: jest.fn().mockResolvedValue(mockOrder),
      };
      (Order.create as jest.Mock).mockResolvedValue(mockOrderInstance);

      // Make commission calculation fail
      mockCalculateCommissions.mockRejectedValue(new Error('Database error'));

      // Mock product lookup (already done before)
      (Product.findByPk as jest.Mock).mockResolvedValue(mockActiveProduct);

      const data: CreateOrderData = {
        productId: 'product-1',
        paymentMethod: 'simulated',
      };

      try {
        await orderService.createOrder('user-123', data);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.code).toBe('COMMISSION_ERROR');
        expect(error.statusCode).toBe(500);
      }
    });

    /**
     * Test: 9.5 - Verify Order, Purchase, and Commission records
     * This test verifies the integration of all three records
     */
    it('should create order with linked purchase and product', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Product.findByPk as jest.Mock).mockResolvedValue(mockActiveProduct);

      const mockPurchaseInstance = {
        ...mockPurchase,
        id: 'purchase-new-1',
        save: jest.fn().mockResolvedValue(mockPurchase),
        update: jest.fn().mockResolvedValue({ ...mockPurchase, productId: 'product-1' }),
      };
      (Purchase.create as jest.Mock).mockResolvedValue(mockPurchaseInstance);

      const mockOrderInstance = {
        ...mockOrder,
        id: 'order-new-1',
        save: jest.fn().mockResolvedValue(mockOrder),
      };
      (Order.create as jest.Mock).mockResolvedValue(mockOrderInstance);

      // Mock commission service return
      const mockCommissions = [
        { ...mockCommission, id: 'commission-1' },
        { ...mockCommission, id: 'commission-2', type: 'level_1', amount: 0.8 },
      ];
      mockCalculateCommissions.mockResolvedValue(mockCommissions);

      (Order.findByPk as jest.Mock).mockResolvedValue({
        ...mockOrder,
        id: 'order-new-1',
        product: mockActiveProduct,
        purchase: { ...mockPurchase, id: 'purchase-new-1', productId: 'product-1' },
      });

      const data: CreateOrderData = {
        productId: 'product-1',
        paymentMethod: 'simulated',
      };

      const result = await orderService.createOrder('user-123', data);

      // Note: The actual implementation creates Purchase with productId directly,
      // so update is not called. Verify the create call includes productId.
      expect(Purchase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product-1',
        }),
        expect.any(Object)
      );

      // Verify order links to purchase
      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseId: 'purchase-new-1',
          productId: 'product-1',
        }),
        expect.any(Object)
      );

      // Verify commission service was called with purchase ID
      expect(mockCalculateCommissions).toHaveBeenCalledWith('purchase-new-1');
    });
  });

  describe('getUserOrders', () => {
    it('should return paginated user orders', async () => {
      const mockResult = { rows: [mockOrder], count: 1 };
      (Order.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await orderService.getUserOrders('user-123', { page: 1, limit: 20 });

      expect(result.rows).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          limit: 20,
          offset: 0,
        })
      );
    });

    it('should filter orders by status', async () => {
      const mockResult = { rows: [], count: 0 };
      (Order.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await orderService.getUserOrders('user-123', { status: 'completed' });

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'completed',
          }),
        })
      );
    });
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderService.findById('order-1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw error when order not found', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(orderService.findById('nonexistent')).rejects.toThrow('Order not found');
    });

    it('should throw error with ORDER_NOT_FOUND code', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      try {
        await orderService.findById('nonexistent');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('ORDER_NOT_FOUND');
      }
    });
  });

  describe('findByIdForUser', () => {
    it('should return order when user owns it', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderService.findByIdForUser('order-1', 'user-123');

      expect(result).toEqual(mockOrder);
    });

    it('should throw 403 when user does not own order', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(orderService.findByIdForUser('order-1', 'different-user')).rejects.toThrow(
        'You do not have permission to view this order'
      );
    });

    it('should throw error with FORBIDDEN code', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      try {
        await orderService.findByIdForUser('order-1', 'different-user');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue({
        ...mockOrder,
        save: jest.fn().mockResolvedValue({ ...mockOrder, status: 'completed' }),
      });

      const result = await orderService.updateStatus('order-1', 'completed');

      expect(result.status).toBe('completed');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel pending order (change status to failed)', async () => {
      const pendingOrder = { ...mockOrder, status: 'pending' };
      (Order.findByPk as jest.Mock).mockResolvedValue({
        ...pendingOrder,
        save: jest.fn().mockResolvedValue({ ...pendingOrder, status: 'failed' }),
      });

      const result = await orderService.cancelOrder('order-1');

      expect(result.status).toBe('failed');
    });

    it('should throw error when trying to cancel completed order', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'completed',
      });

      await expect(orderService.cancelOrder('order-1')).rejects.toThrow(
        'Cannot cancel a completed order'
      );
    });
  });
});
