/**
 * @fileoverview PaymentMercadoPagoController Unit Tests
 * @description Tests for MercadoPago payment controller handlers
 * @module __tests__/unit/PaymentMercadoPagoController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../services/MercadoPagoService', () => ({
  mercadoPagoService: {
    createPreference: jest.fn(),
    processPayment: jest.fn(),
    getPayment: jest.fn(),
    getPaymentMethods: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  },
}));

jest.mock('../../services/CommissionService', () => ({
  CommissionService: jest.fn().mockImplementation(() => ({
    calculateCommissions: jest.fn(),
  })),
}));

jest.mock('../../models/index', () => ({
  Purchase: { create: jest.fn() },
  Order: { create: jest.fn(), findOne: jest.fn() },
  Product: { findByPk: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../../models/WebhookEvent', () => ({
  WebhookEvent: { findOne: jest.fn(), create: jest.fn() },
}));

jest.mock('../../config/env', () => ({
  config: {
    app: { url: 'http://localhost:3000', frontendUrl: 'http://localhost:4200' },
    mercadopago: { webhookSecret: '' },
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { PaymentMercadoPagoController } from '../../controllers/PaymentMercadoPagoController';
import { mercadoPagoService } from '../../services/MercadoPagoService';

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

describe('PaymentMercadoPagoController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createPreference ──────────────────────────────────────────────────────

  describe('createPreference', () => {
    it('returns 400 when items is missing', async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentMercadoPagoController.createPreference(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('returns 400 when items is empty array', async () => {
      const req = createMockReq({ body: { items: [] } });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentMercadoPagoController.createPreference(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates preference and returns 201 on success', async () => {
      const mockPref = {
        id: 'pref-id-123',
        init_point: 'https://mp.com/checkout/init',
        sandbox_init_point: 'https://sandbox.mp.com/checkout/init',
      };
      (mercadoPagoService.createPreference as jest.Mock).mockResolvedValue(mockPref);

      const req = createMockReq({
        body: {
          items: [{ title: 'Product', unit_price: 100, quantity: 1 }],
          externalReference: 'ref-001',
        },
      });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentMercadoPagoController.createPreference(req, res, next);

      expect(mercadoPagoService.createPreference).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ preferenceId: 'pref-id-123' }),
        })
      );
    });

    it('calls next with error when service throws', async () => {
      const error = new Error('MP API error');
      (mercadoPagoService.createPreference as jest.Mock).mockRejectedValue(error);

      const req = createMockReq({
        body: { items: [{ title: 'P', unit_price: 10 }] },
      });
      const res = createMockRes();
      const next = jest.fn();

      PaymentMercadoPagoController.createPreference(req, res, next);
      // asyncHandler catches errors via .catch(next) — flush pending microtasks
      await new Promise((r) => setImmediate(r));

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── processPayment ────────────────────────────────────────────────────────

  describe('processPayment', () => {
    it('returns 400 when required fields are missing', async () => {
      const req = createMockReq({ body: { token: 'tok' } }); // missing paymentMethodId, etc.
      const res = createMockRes();
      const next = jest.fn();

      await PaymentMercadoPagoController.processPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('processes payment and returns 200 on success', async () => {
      const mockResult = {
        id: 'pay-123',
        status: 'approved',
        status_detail: 'accredited',
        payment_type_id: 'credit_card',
        transaction_amount: 500,
        currency_id: 'COP',
      };
      (mercadoPagoService.processPayment as jest.Mock).mockResolvedValue(mockResult);

      const req = createMockReq({
        body: {
          token: 'card-token',
          paymentMethodId: 'visa',
          transactionAmount: 500,
          payer: { email: 'buyer@test.com' },
        },
      });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentMercadoPagoController.processPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ paymentId: 'pay-123', status: 'approved' }),
        })
      );
    });
  });

  // ── getPayment ────────────────────────────────────────────────────────────

  describe('getPayment', () => {
    it('returns 400 when paymentId param is missing', async () => {
      const req = createMockReq({ params: {} });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentMercadoPagoController.getPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns payment data on success', async () => {
      const mockPayment = { id: 'pay-abc', status: 'approved' };
      (mercadoPagoService.getPayment as jest.Mock).mockResolvedValue(mockPayment);

      const req = createMockReq({ params: { paymentId: 'pay-abc' } });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentMercadoPagoController.getPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockPayment })
      );
    });
  });

  // ── getPaymentMethods ─────────────────────────────────────────────────────

  describe('getPaymentMethods', () => {
    it('returns payment methods list', async () => {
      const mockMethods = [{ id: 'visa', name: 'Visa' }];
      (mercadoPagoService.getPaymentMethods as jest.Mock).mockResolvedValue(mockMethods);

      const req = createMockReq({});
      const res = createMockRes();
      const next = jest.fn();

      await PaymentMercadoPagoController.getPaymentMethods(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockMethods })
      );
    });
  });

  // ── webhook ───────────────────────────────────────────────────────────────

  describe('webhook', () => {
    it('returns 200 for non-payment topic', async () => {
      const req = createMockReq({
        body: { topic: 'merchant_order', action: 'other' },
        query: {},
      });
      const res = createMockRes();
      const next = jest.fn();

      await PaymentMercadoPagoController.webhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('returns 401 when webhookSecret is set but signature is invalid', async () => {
      // Re-mock config with a secret set
      const { config } = await import('../../config/env');
      (config.mercadopago as any).webhookSecret = 'secret-key';

      const req = createMockReq({
        body: { topic: 'payment', id: 'pay-123' },
        query: {},
        headers: { 'x-signature': 'invalid' },
      });
      const res = createMockRes();
      const next = jest.fn();

      (mercadoPagoService.verifyWebhookSignature as jest.Mock).mockReturnValue(false);

      await PaymentMercadoPagoController.webhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      // Restore
      (config.mercadopago as any).webhookSecret = '';
    });
  });
});
