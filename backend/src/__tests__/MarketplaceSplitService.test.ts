/**
 * @fileoverview Unit tests for MarketplaceSplitService (B2 / D5 / D9 / SPLIT-1..8, RC-1..4)
 * @description resolveToken (null/flag OFF→platform; no account→CONNECT_MP_REQUIRED),
 *              createFeeBreakdown (SPLIT-4 math), refundProportional, handleApprovedReservation
 *              (paid + paymentId + VendorOrder + breakdown) and handleRefund
 *              (feeRefunded accumulated, full refund → cancelled/refunded).
 * @module __tests__/MarketplaceSplitService
 */

// ─── Env mock (mutable for flag-guard tests) ─────────────────────────────────
const mockEnv = {
  config: {
    marketplace: {
      enabled: true,
      country: 'CO',
      vatRates: { CO: 0.19 },
    },
    mercadopago: { accessToken: 'platform-token' },
  },
};

jest.mock('../config/env.js', () => mockEnv);

// ─── CommissionService mock (real math kept pure in A12 suite) ───────────────
const mockCalculateMarketplaceFee = jest.fn();

jest.mock('../services/CommissionService.js', () => ({
  CommissionService: { calculateMarketplaceFee: mockCalculateMarketplaceFee },
}));

// ─── OAuth service mock ──────────────────────────────────────────────────────
const mockEnsureValidToken = jest.fn();

jest.mock('../services/OAuthMercadoPagoService.js', () => ({
  oauthMercadoPagoService: { ensureValidToken: mockEnsureValidToken },
}));

// ─── TwoFactorService mock ───────────────────────────────────────────────────
const mockDecryptSecretFromStorage = jest.fn();

jest.mock('../services/TwoFactorService.js', () => ({
  TwoFactorService: { decryptSecretFromStorage: mockDecryptSecretFromStorage },
}));

// ─── MercadoPagoService mock (refund trigger — B5 / SPLIT-6) ────────────────
const mockGetPayment = jest.fn();
const mockRefundPayment = jest.fn();

jest.mock('../services/MercadoPagoService.js', () => ({
  mercadoPagoService: { getPayment: mockGetPayment, refundPayment: mockRefundPayment },
}));

// ─── Model mocks ─────────────────────────────────────────────────────────────
const mockVendorFindByPk = jest.fn();
const mockAccountFindOne = jest.fn();
const mockReservationFindByPk = jest.fn();
const mockOrderCreate = jest.fn();
const mockOrderFindOne = jest.fn();
const mockVendorOrderCreate = jest.fn();
const mockVendorOrderUpdate = jest.fn();

jest.mock('../models/index.js', () => ({
  Vendor: { findByPk: mockVendorFindByPk },
  VendorMercadoPagoAccount: { findOne: mockAccountFindOne },
  Reservation: { findByPk: mockReservationFindByPk },
  Order: { create: mockOrderCreate, findOne: mockOrderFindOne },
  VendorOrder: { create: mockVendorOrderCreate, update: mockVendorOrderUpdate },
}));

import { MarketplaceSplitService } from '../services/MarketplaceSplitService.js';
import type { PaymentResult } from '../services/MercadoPagoService.js';

const service = new MarketplaceSplitService();

// Default SPLIT-4 implementation for the mocked CommissionService
function stubFeeMath(): void {
  mockCalculateMarketplaceFee.mockImplementation(
    ({
      base,
      commissionRate,
      country,
    }: {
      base: number;
      commissionRate: number;
      country: string;
    }) => {
      const pctPlataforma = 1 - commissionRate;
      const commission = Math.round(base * pctPlataforma);
      const taxRate = country === 'CO' ? 0.19 : 0;
      const tax = Math.round(commission * taxRate);
      const fee = commission + tax;
      return { commissionRate, pctPlataforma, commission, taxRate, tax, fee };
    }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEnv.config.marketplace.enabled = true;
  mockDecryptSecretFromStorage.mockReturnValue('vendor-access-token');
  mockEnsureValidToken.mockImplementation(async (account: unknown) => account);
  stubFeeMath();
});

describe('MarketplaceSplitService.resolveToken (SPLIT-1 / NFR-6 / B9)', () => {
  it('returns the platform token when vendorId is null', async () => {
    await expect(service.resolveToken(null)).resolves.toBe('platform-token');
    expect(mockAccountFindOne).not.toHaveBeenCalled();
  });

  it('returns the platform token when the marketplace flag is OFF (vendorId ignored)', async () => {
    mockEnv.config.marketplace.enabled = false;
    await expect(service.resolveToken('vendor-1')).resolves.toBe('platform-token');
    expect(mockAccountFindOne).not.toHaveBeenCalled();
  });

  it('throws CONNECT_MP_REQUIRED when the vendor has no MercadoPago account', async () => {
    mockAccountFindOne.mockResolvedValue(null);
    await expect(service.resolveToken('vendor-1')).rejects.toThrow(/CONNECT_MP_REQUIRED/);
    expect(mockAccountFindOne).toHaveBeenCalledWith({ where: { vendorId: 'vendor-1' } });
  });

  it('throws CONNECT_MP_REQUIRED when the account is not connected', async () => {
    mockAccountFindOne.mockResolvedValue({ status: 'disconnected' });
    await expect(service.resolveToken('vendor-1')).rejects.toThrow(/CONNECT_MP_REQUIRED/);
  });

  it('returns the decrypted vendor access token when the account is connected', async () => {
    const account = { status: 'connected', accessTokenEncrypted: 'enc:vendor-token' };
    mockAccountFindOne.mockResolvedValue(account);
    mockEnsureValidToken.mockResolvedValue(account);
    mockDecryptSecretFromStorage.mockReturnValue('vendor-access-token');

    await expect(service.resolveToken('vendor-1')).resolves.toBe('vendor-access-token');
    expect(mockEnsureValidToken).toHaveBeenCalledWith(account);
    expect(mockDecryptSecretFromStorage).toHaveBeenCalledWith('enc:vendor-token');
  });
});

describe('MarketplaceSplitService.createFeeBreakdown (SPLIT-4 / B9)', () => {
  it('calculates the CO breakdown: commission 300,000 / tax 57,000 / fee 357,000', () => {
    const breakdown = service.createFeeBreakdown(
      1000000,
      { commissionRate: 0.7 },
      'CO',
      'reservation:res-1'
    );

    expect(breakdown.base).toBe(1000000);
    expect(breakdown.commissionRate).toBe(0.7);
    expect(breakdown.pctPlataforma).toBeCloseTo(0.3, 10); // float: 1 - 0.7
    expect(breakdown.commission).toBe(300000);
    expect(breakdown.taxRate).toBe(0.19);
    expect(breakdown.tax).toBe(57000);
    expect(breakdown.fee).toBe(357000);
    expect(breakdown.externalReference).toBe('reservation:res-1');
    expect(breakdown.country).toBe('CO');
    expect(breakdown.feeRefunded).toBe(0);
    expect(breakdown.commission + breakdown.tax).toBe(breakdown.fee); // SPLIT-4 sum check
  });

  it('rounds HALF_UP to integer COP', () => {
    const breakdown = service.createFeeBreakdown(99999, { commissionRate: 0.7 }, 'CO', 'x');
    expect(Number.isInteger(breakdown.fee)).toBe(true);
    expect(breakdown.fee).toBe(35700);
  });
});

describe('MarketplaceSplitService.refundProportional (SPLIT-6 / D9)', () => {
  it('reverses proportionally: fee 357,000 × 400,000 / 1,000,000 = 142,800', () => {
    expect(service.refundProportional(357000, 400000, 1000000)).toBe(142800);
  });

  it('reverses the full fee on a total refund', () => {
    expect(service.refundProportional(357000, 1000000, 1000000)).toBe(357000);
  });
});

describe('MarketplaceSplitService.handleApprovedReservation (RC-2 / B4 core)', () => {
  const payment: PaymentResult = {
    id: 'pay-1',
    status: 'approved',
    transaction_amount: 1000000,
    currency_id: 'COP',
    external_reference: 'reservation:res-1',
  };

  it('marks the reservation paid, stores paymentId, creates Order + VendorOrder with breakdown', async () => {
    const reservation = {
      id: 'res-1',
      userId: 'user-1',
      vendorId: 'vendor-1',
      totalPrice: 1000000,
      currency: 'COP',
      paymentStatus: 'pending',
      paymentId: null,
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockReservationFindByPk.mockResolvedValue(reservation);
    mockVendorFindByPk.mockResolvedValue({ commissionRate: 0.7 });
    mockOrderCreate.mockResolvedValue({ id: 'order-1' });

    await service.handleApprovedReservation(payment);

    expect(mockReservationFindByPk).toHaveBeenCalledWith('res-1');
    expect(reservation.update).toHaveBeenCalledWith({ paymentStatus: 'paid', paymentId: 'pay-1' });

    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        productId: null,
        vendorId: 'vendor-1',
        country: 'CO',
        totalAmount: 1000000,
        currency: 'COP',
        status: 'completed',
        paymentMethod: 'mercadopago',
        notes: 'mercadopago:pay-1',
        marketplaceFee: 357000,
        feeBreakdown: expect.objectContaining({ fee: 357000, feeRefunded: 0 }),
      })
    );

    expect(mockVendorOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        vendorId: 'vendor-1',
        subtotal: 1000000,
        vendorAmount: 700000,
        commissionAmount: 0,
        platformAmount: 357000,
        status: 'completed',
        taxRate: 0.19,
        taxAmount: 57000,
        country: 'CO',
      })
    );
  });

  it('skips when the reservation was already paid with the same paymentId (idempotency)', async () => {
    const reservation = {
      id: 'res-1',
      userId: 'user-1',
      vendorId: 'vendor-1',
      paymentStatus: 'paid',
      paymentId: 'pay-1',
      update: jest.fn(),
    };
    mockReservationFindByPk.mockResolvedValue(reservation);

    await service.handleApprovedReservation(payment);

    expect(mockOrderCreate).not.toHaveBeenCalled();
    expect(mockVendorOrderCreate).not.toHaveBeenCalled();
  });

  it('rejects a payment whose external_reference is not a reservation', async () => {
    await expect(
      service.handleApprovedReservation({ ...payment, external_reference: 'user-1' })
    ).rejects.toThrow(/not a reservation/i);
  });
});

describe('MarketplaceSplitService.handleRefund (SPLIT-6 / D9 / RC-4)', () => {
  const baseBreakdown = {
    base: 1000000,
    commissionRate: 0.7,
    pctPlataforma: 0.3,
    commission: 300000,
    taxRate: 0.19,
    tax: 57000,
    fee: 357000,
    externalReference: 'reservation:res-1',
    country: 'CO',
    feeRefunded: 0,
  };

  it('accumulates feeRefunded proportionally on a partial refund', async () => {
    const payment: PaymentResult = {
      id: 'pay-1',
      status: 'approved',
      transaction_amount: 1000000,
      external_reference: 'reservation:res-1',
      refunds: [{ id: 99, amount: 400000 }],
    };
    const order = {
      id: 'order-1',
      feeBreakdown: { ...baseBreakdown },
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockOrderFindOne.mockResolvedValue(order);

    await service.handleRefund(payment, 99);

    expect(mockOrderFindOne).toHaveBeenCalledWith({ where: { notes: 'mercadopago:pay-1' } });
    expect(order.update).toHaveBeenCalledWith({
      feeBreakdown: expect.objectContaining({ feeRefunded: 142800 }),
    });
    // Partial refund → reservation stays paid, vendor order not cancelled
    expect(mockReservationFindByPk).not.toHaveBeenCalled();
    expect(mockVendorOrderUpdate).not.toHaveBeenCalled();
  });

  it('full refund: feeRefunded = fee, VendorOrder cancelled, reservation refunded', async () => {
    const payment: PaymentResult = {
      id: 'pay-1',
      status: 'approved',
      transaction_amount: 1000000,
      external_reference: 'reservation:res-1',
      refunds: [{ id: 99, amount: 1000000 }],
    };
    const order = {
      id: 'order-1',
      feeBreakdown: { ...baseBreakdown },
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockOrderFindOne.mockResolvedValue(order);
    const reservation = { update: jest.fn().mockResolvedValue(undefined) };
    mockReservationFindByPk.mockResolvedValue(reservation);

    await service.handleRefund(payment, 99);

    expect(order.update).toHaveBeenCalledWith({
      feeBreakdown: expect.objectContaining({ feeRefunded: 357000 }),
    });
    expect(mockVendorOrderUpdate).toHaveBeenCalledWith(
      { status: 'cancelled' },
      { where: { orderId: 'order-1' } }
    );
    expect(mockReservationFindByPk).toHaveBeenCalledWith('res-1');
    expect(reservation.update).toHaveBeenCalledWith({ paymentStatus: 'refunded' });
  });

  it('throws when the refund record is not present in the payment', async () => {
    const payment: PaymentResult = {
      id: 'pay-1',
      status: 'approved',
      transaction_amount: 1000000,
      external_reference: 'reservation:res-1',
      refunds: [{ id: 1, amount: 50000 }],
    };
    await expect(service.handleRefund(payment, 999)).rejects.toThrow(/refund not found/i);
  });
});

describe('MarketplaceSplitService.refundPayment (SPLIT-6 / B5)', () => {
  const PAYMENT_ID = '888777666';
  const mockApprovedPayment: PaymentResult = {
    id: PAYMENT_ID,
    status: 'approved',
    external_reference: 'reservation:res-1',
    transaction_amount: 1000000,
    currency_id: 'COP',
    date_approved: new Date().toISOString(), // now → inside the 180-day window
  };

  const mockConnectedAccount = { status: 'connected', accessTokenEncrypted: 'enc:x' };

  it('refunds the full payment with the vendor token (no amount → full)', async () => {
    mockGetPayment.mockResolvedValue(mockApprovedPayment);
    mockOrderFindOne.mockResolvedValue({ id: 'order-1', vendorId: 'vendor-1' });
    mockAccountFindOne.mockResolvedValue(mockConnectedAccount);
    mockRefundPayment.mockResolvedValue({ status: 'approved' });

    const result = await service.refundPayment(PAYMENT_ID);

    expect(mockGetPayment).toHaveBeenCalledWith(PAYMENT_ID);
    expect(mockOrderFindOne).toHaveBeenCalledWith({
      where: { notes: `mercadopago:${PAYMENT_ID}` },
    });
    expect(mockRefundPayment).toHaveBeenCalledWith(PAYMENT_ID, {
      accessToken: 'vendor-access-token',
    });
    expect(result.status).toBe('approved');
  });

  it('refunds a partial amount, passing it through to the SDK', async () => {
    mockGetPayment.mockResolvedValue(mockApprovedPayment);
    mockOrderFindOne.mockResolvedValue({ id: 'order-1', vendorId: 'vendor-1' });
    mockAccountFindOne.mockResolvedValue(mockConnectedAccount);
    mockRefundPayment.mockResolvedValue({ status: 'approved' });

    await service.refundPayment(PAYMENT_ID, { amount: 400000 });

    expect(mockRefundPayment).toHaveBeenCalledWith(PAYMENT_ID, {
      amount: 400000,
      accessToken: 'vendor-access-token',
    });
  });

  it('throws REFUND_PERIOD_EXPIRED when the payment is older than 180 days', async () => {
    const olderThanWindow = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
    mockGetPayment.mockResolvedValue({ ...mockApprovedPayment, date_approved: olderThanWindow });
    mockOrderFindOne.mockResolvedValue({ id: 'order-1', vendorId: 'vendor-1' });

    await expect(service.refundPayment(PAYMENT_ID)).rejects.toThrow(/REFUND_PERIOD_EXPIRED/);
    expect(mockRefundPayment).not.toHaveBeenCalled();
  });

  it('throws REFUND_PERIOD_EXPIRED when the payment has no date_approved', async () => {
    mockGetPayment.mockResolvedValue({ ...mockApprovedPayment, date_approved: undefined });
    mockOrderFindOne.mockResolvedValue({ id: 'order-1', vendorId: 'vendor-1' });

    await expect(service.refundPayment(PAYMENT_ID)).rejects.toThrow(/REFUND_PERIOD_EXPIRED/);
    expect(mockRefundPayment).not.toHaveBeenCalled();
  });

  it('throws ORDER_NOT_FOUND when there is no marketplace order for the payment', async () => {
    mockGetPayment.mockResolvedValue(mockApprovedPayment);
    mockOrderFindOne.mockResolvedValue(null);

    await expect(service.refundPayment(PAYMENT_ID)).rejects.toThrow(/ORDER_NOT_FOUND/);
    expect(mockRefundPayment).not.toHaveBeenCalled();
  });

  it('throws ORDER_NOT_FOUND when the order has no vendorId (platform payment)', async () => {
    mockGetPayment.mockResolvedValue(mockApprovedPayment);
    mockOrderFindOne.mockResolvedValue({ id: 'order-1', vendorId: null });

    await expect(service.refundPayment(PAYMENT_ID)).rejects.toThrow(/ORDER_NOT_FOUND/);
    expect(mockRefundPayment).not.toHaveBeenCalled();
  });

  it('propagates CONNECT_MP_REQUIRED when the vendor has no connected account', async () => {
    mockGetPayment.mockResolvedValue(mockApprovedPayment);
    mockOrderFindOne.mockResolvedValue({ id: 'order-1', vendorId: 'vendor-1' });
    mockAccountFindOne.mockResolvedValue(null);

    await expect(service.refundPayment(PAYMENT_ID)).rejects.toThrow(/CONNECT_MP_REQUIRED/);
    expect(mockRefundPayment).not.toHaveBeenCalled();
  });
});
