/**
 * @fileoverview PaymentPayPalController Unit Tests
 * @description Tests for PayPal payment controller handlers
 * @module __tests__/unit/PaymentPayPalController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../services/PayPalService', () => ({
  paypalService: {
    createOrder: jest.fn(),
    captureOrder: jest.fn(),
    getOrder: jest.fn(),
    verifyWebhookSignature: jest.fn(),
    isIdempotent: jest.fn(),
    markAsProcessed: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { PaymentPayPalController } from '../../controllers/PaymentPayPalController';
import { paypalService } from '../../services/PayPalService';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

describe('PaymentPayPalController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createOrder ───────────────────────────────────────────────────────────

  describe('createOrder', () => {
    it('returns 400 when amount is missing', async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.createOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('returns 400 when amount is 0', async () => {
      const req = createMockReq({ body: { amount: 0 } });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.createOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates PayPal order and returns 201 on success', async () => {
      const mockOrder = {
        id: 'PAYPAL-ORDER-001',
        status: 'CREATED',
        links: [{ rel: 'approve', href: 'https://paypal.com/approve?token=abc' }],
      };
      (paypalService.createOrder as jest.Mock).mockResolvedValue(mockOrder);

      const req = createMockReq({
        body: { amount: 100, currency: 'USD', description: 'Test purchase' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.createOrder(req, res, next);

      expect(paypalService.createOrder).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orderId: 'PAYPAL-ORDER-001',
            status: 'CREATED',
            approvalUrl: 'https://paypal.com/approve?token=abc',
          }),
        })
      );
    });

    it('calls next with error when service throws', async () => {
      const error = new Error('PayPal API error');
      (paypalService.createOrder as jest.Mock).mockRejectedValue(error);

      const req = createMockReq({ body: { amount: 50 } });
      const res = createMockRes();
      const next = jest.fn();

      PaymentPayPalController.createOrder(req, res, next);
      // asyncHandler catches errors via .catch(next) — flush pending microtasks
      await new Promise((r) => setImmediate(r));

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── captureOrder ──────────────────────────────────────────────────────────

  describe('captureOrder', () => {
    it('returns 400 when orderId is missing', async () => {
      const req = createMockReq({ body: { internalOrderId: 'int-001' } });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.captureOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when orderId has invalid format', async () => {
      const req = createMockReq({
        body: { orderId: 'invalid-format', internalOrderId: 'int-001' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.captureOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('returns 400 when internalOrderId is missing', async () => {
      // Valid PayPal order ID: 17 uppercase alphanumeric chars
      const req = createMockReq({ body: { orderId: 'ABCDEFGHIJ1234567' } });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.captureOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('captures order and returns 200 on success', async () => {
      const mockCaptured = {
        id: 'ABCDEFGHIJ1234567',
        status: 'COMPLETED',
        purchase_units: [
          {
            payments: {
              captures: [{ id: 'cap-001', amount: { value: '100.00', currency_code: 'USD' } }],
            },
          },
        ],
      };
      (paypalService.captureOrder as jest.Mock).mockResolvedValue(mockCaptured);

      const req = createMockReq({
        body: { orderId: 'ABCDEFGHIJ1234567', internalOrderId: 'int-001' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.captureOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orderId: 'ABCDEFGHIJ1234567',
            status: 'COMPLETED',
            captureId: 'cap-001',
          }),
        })
      );
    });
  });

  // ── getOrder ──────────────────────────────────────────────────────────────

  describe('getOrder', () => {
    it('returns 400 when orderId param is missing', async () => {
      const req = createMockReq({ params: {} });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.getOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when orderId format is invalid', async () => {
      const req = createMockReq({ params: { orderId: 'not-valid' } });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.getOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns order data on success', async () => {
      const mockOrder = { id: 'ABCDEFGHIJ1234567', status: 'APPROVED' };
      (paypalService.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const req = createMockReq({ params: { orderId: 'ABCDEFGHIJ1234567' } });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.getOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockOrder })
      );
    });
  });

  // ── webhook ───────────────────────────────────────────────────────────────

  describe('webhook', () => {
    it('returns 403 when signature verification fails', async () => {
      (paypalService.verifyWebhookSignature as jest.Mock).mockResolvedValue(false);

      const req = createMockReq({
        body: { event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'res-001' } },
        headers: {
          'paypal-transmission-id': 'tx-id',
          'paypal-transmission-time': '2026-01-01T00:00:00Z',
          'paypal-transmission-sig': 'bad-sig',
          'paypal-cert-url': 'https://paypal.com/cert',
          'paypal-auth-algo': 'SHA256withRSA',
        },
      });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.webhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 200 and marks processed on valid signature', async () => {
      (paypalService.verifyWebhookSignature as jest.Mock).mockResolvedValue(true);
      (paypalService.isIdempotent as jest.Mock).mockReturnValue(false);

      const req = createMockReq({
        body: { event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'res-002' } },
        headers: {},
      });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.webhook(req, res, next);

      expect(paypalService.markAsProcessed).toHaveBeenCalledWith('res-002');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('returns 200 with duplicate flag on idempotent event', async () => {
      (paypalService.verifyWebhookSignature as jest.Mock).mockResolvedValue(true);
      (paypalService.isIdempotent as jest.Mock).mockReturnValue(true);

      const req = createMockReq({
        body: { event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'res-dup' } },
        headers: {},
      });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentPayPalController.webhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true, duplicate: true });
    });
  });
});
