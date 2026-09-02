/**
 * @fileoverview ShipmentTrackingController Unit Tests
 * @description Tests for shipment tracking controller handlers — authorization and happy paths
 * @module __tests__/unit/ShipmentTrackingController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../models/index', () => ({
  Order: { findByPk: jest.fn() },
  Product: { findByPk: jest.fn() },
}));

jest.mock('../../services/ShipmentTrackingService', () => {
  const mockAddTracking = jest.fn();
  const mockGetByOrder = jest.fn();
  return {
    ShipmentTrackingService: jest.fn().mockImplementation(() => ({
      addTracking: mockAddTracking,
      getByOrder: mockGetByOrder,
    })),
    __mockAddTracking: mockAddTracking,
    __mockGetByOrder: mockGetByOrder,
  };
});

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { addTracking, getTracking } from '../../controllers/ShipmentTrackingController';
import { Order } from '../../models/index';
import { __mockAddTracking, __mockGetByOrder } from '../../services/ShipmentTrackingService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const flushPromises = () => new Promise<void>((r) => setImmediate(r));

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 'user-uuid', email: 'test@test.com', role: 'user', referralCode: 'REF-001' },
    body: {},
    params: {},
    query: {},
    headers: {},
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ShipmentTrackingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── addTracking ────────────────────────────────────────────────────────────

  describe('addTracking', () => {
    it('returns 403 FORBIDDEN when non-owner non-admin attempts to add tracking', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue({
        id: 'order-1',
        userId: 'owner-uuid',
      });

      const req = createMockReq({
        user: { id: 'other-user', email: 'other@test.com', role: 'user', referralCode: 'REF-002' },
        params: { id: 'order-1' },
        body: { trackingNumber: 'TN123', providerId: 'provider-1' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await addTracking(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          code: 'FORBIDDEN',
        })
      );
      expect(__mockAddTracking).not.toHaveBeenCalled();
    });

    it('returns 201 when order owner adds tracking', async () => {
      const mockTracking = { id: 'tracking-1', trackingNumber: 'TN123', orderId: 'order-1' };
      (Order.findByPk as jest.Mock).mockResolvedValue({ id: 'order-1', userId: 'user-uuid' });
      __mockAddTracking.mockResolvedValue(mockTracking);

      const req = createMockReq({
        params: { id: 'order-1' },
        body: { trackingNumber: 'TN123', providerId: 'provider-1' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await addTracking(req, res, next);
      await flushPromises();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockTracking })
      );
    });

    it('returns 201 when admin adds tracking to any order', async () => {
      const mockTracking = { id: 'tracking-1', trackingNumber: 'TN123', orderId: 'order-1' };
      (Order.findByPk as jest.Mock).mockResolvedValue({ id: 'order-1', userId: 'owner-uuid' });
      __mockAddTracking.mockResolvedValue(mockTracking);

      const req = createMockReq({
        user: { id: 'admin-uuid', email: 'admin@test.com', role: 'admin', referralCode: 'ADM' },
        params: { id: 'order-1' },
        body: { trackingNumber: 'TN123', providerId: 'provider-1' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await addTracking(req, res, next);
      await flushPromises();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(__mockAddTracking).toHaveBeenCalledWith('order-1', {
        trackingNumber: 'TN123',
        providerId: 'provider-1',
        estimatedDelivery: undefined,
      });
    });
  });

  // ── getTracking ─────────────────────────────────────────────────────────────

  describe('getTracking', () => {
    it('returns 403 FORBIDDEN when non-owner non-admin attempts to view tracking', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue({
        id: 'order-1',
        userId: 'owner-uuid',
      });

      const req = createMockReq({
        user: { id: 'other-user', email: 'other@test.com', role: 'user', referralCode: 'REF-002' },
        params: { id: 'order-1' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await getTracking(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          code: 'FORBIDDEN',
        })
      );
      expect(__mockGetByOrder).not.toHaveBeenCalled();
    });

    it('returns tracking data when order owner views tracking', async () => {
      const mockTracking = { id: 'tracking-1', orderId: 'order-1', trackingNumber: 'TN123' };
      (Order.findByPk as jest.Mock).mockResolvedValue({ id: 'order-1', userId: 'user-uuid' });
      __mockGetByOrder.mockResolvedValue(mockTracking);

      const req = createMockReq({ params: { id: 'order-1' } });
      const res = createMockRes();
      const next = jest.fn();

      await getTracking(req, res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockTracking })
      );
    });

    it('returns tracking data when admin views tracking for any order', async () => {
      const mockTracking = { id: 'tracking-1', orderId: 'order-1', trackingNumber: 'TN123' };
      (Order.findByPk as jest.Mock).mockResolvedValue({ id: 'order-1', userId: 'owner-uuid' });
      __mockGetByOrder.mockResolvedValue(mockTracking);

      const req = createMockReq({
        user: { id: 'admin-uuid', email: 'admin@test.com', role: 'admin', referralCode: 'ADM' },
        params: { id: 'order-1' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await getTracking(req, res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockTracking })
      );
    });
  });
});
