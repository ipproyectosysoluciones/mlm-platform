/**
 * @fileoverview PaymentMercadoPagoController Unit Tests
 * @description Tests for MercadoPago payment controller handlers
 * @module __tests__/unit/PaymentMercadoPagoController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

const mockResolveToken = jest.fn();
const mockCreateFeeBreakdown = jest.fn();
const mockReservationFindByPk = jest.fn();
const mockVendorFindByPk = jest.fn();

jest.mock('../../services/MercadoPagoService', () => ({
  mercadoPagoService: {
    createPreference: jest.fn(),
    processPayment: jest.fn(),
    getPayment: jest.fn(),
    getPaymentMethods: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  },
}));

jest.mock('../../services/MarketplaceSplitService', () => ({
  marketplaceSplitService: {
    resolveToken: mockResolveToken,
    createFeeBreakdown: mockCreateFeeBreakdown,
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
  Reservation: { findByPk: mockReservationFindByPk },
  Vendor: { findByPk: mockVendorFindByPk },
}));

jest.mock('../../models/WebhookEvent', () => ({
  WebhookEvent: { findOne: jest.fn(), create: jest.fn() },
}));

const mockEnv = {
  config: {
    app: { url: 'http://localhost:3000', frontendUrl: 'http://localhost:4200' },
    mercadopago: { webhookSecret: '' },
    marketplace: { enabled: true, country: 'CO' },
  },
};

jest.mock('../../config/env', () => mockEnv);

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
    // Guard against flag leaks between tests (e.g. the "flag is OFF" test)
    mockEnv.config.marketplace.enabled = true;
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

    // ── B3 / SPLIT-1..2 / RC-1: vendorId & reservationId support ───────────

    it('without vendor uses the platform client and no marketplace_fee (previous behavior)', async () => {
      (mercadoPagoService.createPreference as jest.Mock).mockResolvedValue({
        id: 'pref-1',
        init_point: 'https://mp.com/i',
        sandbox_init_point: 'https://sandbox.mp.com/i',
      });

      const req = createMockReq({
        body: {
          items: [{ title: 'P', unit_price: 100, quantity: 1 }],
          externalReference: 'ref-001',
        },
      });
      const res = createMockRes();

      await PaymentMercadoPagoController.createPreference(req, res);

      expect(mockResolveToken).not.toHaveBeenCalled();
      const [payload, accessToken] = (mercadoPagoService.createPreference as jest.Mock).mock
        .calls[0] as [Record<string, unknown>, string | undefined];
      expect(payload.marketplace_fee).toBeUndefined();
      expect(payload.metadata).toBeUndefined();
      expect(payload.external_reference).toBe('ref-001');
      expect(accessToken).toBeUndefined();
    });

    it('with vendorId resolves business token and adds marketplace_fee + metadata', async () => {
      (mercadoPagoService.createPreference as jest.Mock).mockResolvedValue({
        id: 'pref-1',
        init_point: 'https://mp.com/i',
        sandbox_init_point: 'https://sandbox.mp.com/i',
      });
      mockResolveToken.mockResolvedValue('vendor-access-token');
      mockVendorFindByPk.mockResolvedValue({ commissionRate: 0.7 });
      mockCreateFeeBreakdown.mockReturnValue({
        base: 1000000,
        commissionRate: 0.7,
        pctPlataforma: 0.3,
        commission: 300000,
        taxRate: 0.19,
        tax: 57000,
        fee: 357000,
        externalReference: 'ref-001',
        country: 'CO',
        feeRefunded: 0,
      });

      const req = createMockReq({
        body: {
          items: [{ title: 'Hostal', unit_price: 1000000, quantity: 1 }],
          externalReference: 'ref-001',
          vendorId: 'vendor-1',
        },
      });
      const res = createMockRes();

      await PaymentMercadoPagoController.createPreference(req, res);

      // asyncHandler is fire-and-forget — flush microtasks so the split chain settles
      await new Promise((r) => setImmediate(r));

      expect(mockResolveToken).toHaveBeenCalledWith('vendor-1');
      expect(mockCreateFeeBreakdown).toHaveBeenCalledWith(
        1000000,
        expect.objectContaining({ commissionRate: 0.7 }),
        'CO',
        'ref-001'
      );
      const [payload, accessToken] = (mercadoPagoService.createPreference as jest.Mock).mock
        .calls[0] as [Record<string, unknown>, string | undefined];
      expect(payload.marketplace_fee).toBe(357000);
      expect(payload.metadata).toEqual({ vendorId: 'vendor-1', country: 'CO' });
      expect(accessToken).toBe('vendor-access-token');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 400 CONNECT_MP_REQUIRED when the vendor has no connected account (NFR-6)', async () => {
      mockResolveToken.mockRejectedValue(new Error('CONNECT_MP_REQUIRED: vendor must connect'));

      const req = createMockReq({
        body: {
          items: [{ title: 'P', unit_price: 100 }],
          vendorId: 'vendor-1',
        },
      });
      const res = createMockRes();

      await PaymentMercadoPagoController.createPreference(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'CONNECT_MP_REQUIRED' }),
        })
      );
      expect(mercadoPagoService.createPreference).not.toHaveBeenCalled();
    });

    it('keeps previous behavior when the marketplace flag is OFF', async () => {
      (mercadoPagoService.createPreference as jest.Mock).mockResolvedValue({
        id: 'pref-1',
        init_point: 'https://mp.com/i',
        sandbox_init_point: 'https://sandbox.mp.com/i',
      });
      mockEnv.config.marketplace.enabled = false;

      const req = createMockReq({
        body: {
          items: [{ title: 'P', unit_price: 100 }],
          vendorId: 'vendor-1',
        },
      });
      const res = createMockRes();

      await PaymentMercadoPagoController.createPreference(req, res);

      expect(mockResolveToken).not.toHaveBeenCalled();
      const [payload, accessToken] = (mercadoPagoService.createPreference as jest.Mock).mock
        .calls[0] as [Record<string, unknown>, string | undefined];
      expect(payload.marketplace_fee).toBeUndefined();
      expect(accessToken).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('with reservationId uses reservation: external reference and the reservation vendor', async () => {
      (mercadoPagoService.createPreference as jest.Mock).mockResolvedValue({
        id: 'pref-1',
        init_point: 'https://mp.com/i',
        sandbox_init_point: 'https://sandbox.mp.com/i',
      });
      mockReservationFindByPk.mockResolvedValue({
        id: 'res-1',
        userId: 'user-uuid',
        vendorId: 'vendor-1',
        totalPrice: 1000000,
      });
      mockResolveToken.mockResolvedValue('vendor-access-token');
      mockVendorFindByPk.mockResolvedValue({ commissionRate: 0.7 });
      mockCreateFeeBreakdown.mockReturnValue({
        base: 1000000,
        fee: 357000,
        country: 'CO',
      } as never);

      const req = createMockReq({
        body: {
          items: [{ title: 'Hostal', unit_price: 1000000, quantity: 1 }],
          reservationId: 'res-1',
        },
      });
      const res = createMockRes();

      await PaymentMercadoPagoController.createPreference(req, res);

      // asyncHandler is fire-and-forget — flush microtasks so the split chain settles
      await new Promise((r) => setImmediate(r));

      expect(mockReservationFindByPk).toHaveBeenCalledWith('res-1');
      expect(mockResolveToken).toHaveBeenCalledWith('vendor-1');
      const [payload, accessToken] = (mercadoPagoService.createPreference as jest.Mock).mock
        .calls[0] as [Record<string, unknown>, string | undefined];
      expect(payload.external_reference).toBe('reservation:res-1');
      expect(payload.marketplace_fee).toBe(357000);
      expect(accessToken).toBe('vendor-access-token');
    });

    it('returns 404 when the reservation does not exist', async () => {
      mockReservationFindByPk.mockResolvedValue(null);
      const req = createMockReq({
        body: { items: [{ title: 'P', unit_price: 100 }], reservationId: 'missing' },
      });
      const res = createMockRes();

      await PaymentMercadoPagoController.createPreference(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(mercadoPagoService.createPreference).not.toHaveBeenCalled();
    });

    it('returns 403 when the reservation belongs to another user', async () => {
      mockReservationFindByPk.mockResolvedValue({
        id: 'res-1',
        userId: 'other-user',
        vendorId: 'vendor-1',
      });
      const req = createMockReq({
        body: { items: [{ title: 'P', unit_price: 100 }], reservationId: 'res-1' },
      });
      const res = createMockRes();

      await PaymentMercadoPagoController.createPreference(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mercadoPagoService.createPreference).not.toHaveBeenCalled();
    });

    it('uses platform token (no fee) for reservations without a vendor', async () => {
      (mercadoPagoService.createPreference as jest.Mock).mockResolvedValue({
        id: 'pref-1',
        init_point: 'https://mp.com/i',
        sandbox_init_point: 'https://sandbox.mp.com/i',
      });
      mockReservationFindByPk.mockResolvedValue({
        id: 'res-1',
        userId: 'user-uuid',
        vendorId: null,
        totalPrice: 1000000,
      });

      const req = createMockReq({
        body: { items: [{ title: 'P', unit_price: 100 }], reservationId: 'res-1' },
      });
      const res = createMockRes();

      await PaymentMercadoPagoController.createPreference(req, res);

      expect(mockResolveToken).not.toHaveBeenCalled();
      const [payload, accessToken] = (mercadoPagoService.createPreference as jest.Mock).mock
        .calls[0] as [Record<string, unknown>, string | undefined];
      expect(payload.marketplace_fee).toBeUndefined();
      expect(payload.external_reference).toBe('reservation:res-1');
      expect(accessToken).toBeUndefined();
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
