/**
 * @fileoverview OrderController Unit Tests (OrderWriteController + OrderReadController)
 * @description Tests for order creation and retrieval handlers
 * @module __tests__/unit/OrderController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../services/OrderService', () => ({
  orderService: {
    createOrder: jest.fn(),
    getUserOrders: jest.fn(),
    findByIdForUser: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { createOrder } from '../../controllers/orders/OrderWriteController';
import { getOrders, getOrderById } from '../../controllers/orders/OrderReadController';
import { orderService } from '../../services/OrderService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const flushPromises = () => new Promise<void>((r) => setImmediate(r));
const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 'user-uuid', email: 'test@test.com', role: 'user', referralCode: 'REF-001' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

// ── createOrder Tests ─────────────────────────────────────────────────────────

describe('OrderWriteController - createOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createMockReq({ user: undefined });
    const res = createMockRes();
    const next = jest.fn();

    await createOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 when productId is missing from items', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();
    const next = jest.fn();

    await createOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });

  it('returns 400 when productId is not a valid UUID', async () => {
    const req = createMockReq({
      body: { items: [{ productId: 'not-a-uuid' }] },
    });
    const res = createMockRes();
    const next = jest.fn();

    await createOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates order and returns 201 on success', async () => {
    const mockOrder = {
      id: 'order-uuid',
      orderNumber: 'ORD-001',
      userId: 'user-uuid',
      productId: VALID_UUID,
      purchaseId: 'purchase-uuid',
      totalAmount: 100,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'simulated',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (orderService.createOrder as jest.Mock).mockResolvedValue(mockOrder);

    const req = createMockReq({
      body: { items: [{ productId: VALID_UUID }], paymentMethod: 'simulated' },
    });
    const res = createMockRes();
    const next = jest.fn();

    await createOrder(req, res, next);

    expect(orderService.createOrder).toHaveBeenCalledWith('user-uuid', {
      productId: VALID_UUID,
      paymentMethod: 'simulated',
      notes: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: 'order-uuid' }),
      })
    );
  });

  it('calls next with error when service throws', async () => {
    const error = new Error('DB error');
    (orderService.createOrder as jest.Mock).mockRejectedValue(error);

    const req = createMockReq({
      body: { items: [{ productId: VALID_UUID }], paymentMethod: 'simulated' },
    });
    const res = createMockRes();
    const next = jest.fn();

    await createOrder(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(error);
  });
});

// ── getOrders Tests ───────────────────────────────────────────────────────────

describe('OrderReadController - getOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createMockReq({ user: undefined });
    const res = createMockRes();
    const next = jest.fn();

    await getOrders(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns paginated order list on success', async () => {
    const mockOrders = {
      rows: [
        {
          id: 'o1',
          orderNumber: 'ORD-1',
          userId: 'user-uuid',
          productId: VALID_UUID,
          purchaseId: 'p1',
          totalAmount: 100,
          currency: 'USD',
          status: 'completed',
          paymentMethod: 'manual',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      count: 1,
    };
    (orderService.getUserOrders as jest.Mock).mockResolvedValue(mockOrders);

    const req = createMockReq({ query: { page: '1', limit: '10' } });
    const res = createMockRes();
    const next = jest.fn();

    await getOrders(req, res, next);

    expect(orderService.getUserOrders).toHaveBeenCalledWith('user-uuid', {
      page: 1,
      limit: 10,
      status: undefined,
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([expect.objectContaining({ id: 'o1' })]),
        pagination: expect.objectContaining({ total: 1 }),
      })
    );
  });

  it('caps limit at 100', async () => {
    (orderService.getUserOrders as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    const req = createMockReq({ query: { limit: '999' } });
    const res = createMockRes();
    const next = jest.fn();

    await getOrders(req, res, next);

    expect(orderService.getUserOrders).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ limit: 100 })
    );
  });
});

// ── getOrderById Tests ────────────────────────────────────────────────────────

describe('OrderReadController - getOrderById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createMockReq({ user: undefined, params: { id: VALID_UUID } });
    const res = createMockRes();
    const next = jest.fn();

    await getOrderById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 for invalid UUID format', async () => {
    const req = createMockReq({ params: { id: 'not-a-uuid' } });
    const res = createMockRes();
    const next = jest.fn();

    await getOrderById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns order details on success', async () => {
    const mockOrder = {
      id: VALID_UUID,
      orderNumber: 'ORD-99',
      userId: 'user-uuid',
      productId: VALID_UUID,
      purchaseId: 'p-99',
      totalAmount: 250,
      currency: 'COP',
      status: 'completed',
      paymentMethod: 'mercadopago',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: undefined,
    };
    (orderService.findByIdForUser as jest.Mock).mockResolvedValue(mockOrder);

    const req = createMockReq({ params: { id: VALID_UUID } });
    const res = createMockRes();
    const next = jest.fn();

    await getOrderById(req, res, next);

    expect(orderService.findByIdForUser).toHaveBeenCalledWith(VALID_UUID, 'user-uuid');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: VALID_UUID }),
      })
    );
  });

  it('calls next with error when service throws (e.g. not found)', async () => {
    const error = new Error('Order not found');
    (orderService.findByIdForUser as jest.Mock).mockRejectedValue(error);

    const req = createMockReq({ params: { id: VALID_UUID } });
    const res = createMockRes();
    const next = jest.fn();

    await getOrderById(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(error);
  });
});
