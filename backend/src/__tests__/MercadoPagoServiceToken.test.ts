/**
 * @fileoverview Unit tests for MercadoPagoService token parametrization (BE-5)
 * @description Tests for client-per-access-token creation, marketplace_fee on
 *              createPreference, application_fee on processPayment, and partial
 *              refunds — while getPayment / platform default behavior stays intact.
 * @module __tests__/MercadoPagoServiceToken
 */

// ─── Mock SDK before importing the service ───────────────────────────────────
const mockConfigs: Array<{ accessToken: string }> = [];
const mockPreferences: any[] = [];
const mockPayments: any[] = [];
const mockRefunds: any[] = [];

jest.mock('mercadopago', () => {
  class MockMercadoPagoConfig {
    accessToken: string;
    constructor(opts: { accessToken: string }) {
      this.accessToken = opts.accessToken;
      mockConfigs.push(this);
    }
  }

  class MockPreference {
    config: { accessToken: string };
    create: jest.Mock;
    constructor(config: { accessToken: string }) {
      this.config = config;
      this.create = jest.fn().mockResolvedValue({
        id: 'pref-1',
        init_point: 'https://checkout.mercadopago.com.co/pay',
        sandbox_init_point: 'https://sandbox.mercadopago.com.co/pay',
      });
      mockPreferences.push(this);
    }
  }

  class MockPayment {
    config: { accessToken: string };
    create: jest.Mock;
    get: jest.Mock;
    constructor(config: { accessToken: string }) {
      this.config = config;
      this.create = jest.fn().mockResolvedValue({ id: 123, status: 'approved' });
      this.get = jest.fn().mockResolvedValue({ id: 999, status: 'approved' });
      mockPayments.push(this);
    }
  }

  class MockPaymentRefund {
    config: { accessToken: string };
    create: jest.Mock;
    constructor(config: { accessToken: string }) {
      this.config = config;
      this.create = jest.fn().mockResolvedValue({ status: 'approved' });
      mockRefunds.push(this);
    }
  }

  return {
    MercadoPagoConfig: MockMercadoPagoConfig,
    Preference: MockPreference,
    Payment: MockPayment,
    PaymentRefund: MockPaymentRefund,
  };
});

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
  },
}));

jest.mock('../config/env.js', () => ({
  config: {
    mercadopago: {
      accessToken: 'platform-token',
      webhookSecret: '',
    },
  },
}));

import { mercadoPagoService, type MercadoPagoPreference } from '../services/MercadoPagoService.js';

describe('MercadoPagoService token parametrization (BE-5)', () => {
  beforeEach(() => {
    // NOTE: tracking arrays are cumulative — platform instances are created once
    // at module import (index 0) and must never be wiped from the array.
    jest.clearAllMocks();
  });

  const basePreference: MercadoPagoPreference = {
    items: [
      {
        id: 'prod-1',
        title: 'Producto',
        quantity: 1,
        currency_id: 'COP',
        unit_price: 1000000,
      },
    ],
    external_reference: 'user-1',
  };

  describe('createPreference', () => {
    it('uses the platform client by default (no accessToken)', async () => {
      await mercadoPagoService.createPreference(basePreference);

      // mockPreferences[0] is the module-level platform instance (created at import)
      expect(mockPreferences[0].config.accessToken).toBe('platform-token');
      expect(mockPreferences[0].create).toHaveBeenCalledWith({ body: basePreference });
    });

    it('creates a client per token when accessToken is provided', async () => {
      const before = mockPreferences.length;
      await mercadoPagoService.createPreference(basePreference, 'vendor-token');

      const created = mockPreferences.slice(before);
      expect(created).toHaveLength(1);
      expect(created[0].config.accessToken).toBe('vendor-token');
      expect(mockPreferences[0].config.accessToken).toBe('platform-token');
    });

    it('forwards marketplace_fee to the preference body', async () => {
      const prefWithFee: MercadoPagoPreference = {
        ...basePreference,
        marketplace_fee: 357000,
      };

      const before = mockPreferences.length;
      await mercadoPagoService.createPreference(prefWithFee, 'vendor-token');

      const created = mockPreferences.slice(before);
      expect(created[0].create).toHaveBeenCalledWith({
        body: expect.objectContaining({ marketplace_fee: 357000 }),
      });
    });

    it('returns the checkout URLs', async () => {
      const result = await mercadoPagoService.createPreference(basePreference);
      expect(result).toEqual({
        id: 'pref-1',
        init_point: 'https://checkout.mercadopago.com.co/pay',
        sandbox_init_point: 'https://sandbox.mercadopago.com.co/pay',
      });
    });
  });

  describe('processPayment', () => {
    const paymentData = {
      token: 'card-token',
      paymentMethodId: 'visa',
      transactionAmount: 1000000,
      installments: 1,
      description: 'Compra',
      externalReference: 'user-1',
      payer: { email: 'buyer@test.com' },
    };

    it('uses the platform client by default', async () => {
      await mercadoPagoService.processPayment(paymentData);
      expect(mockPayments[0].config.accessToken).toBe('platform-token');
    });

    it('uses a per-token client when accessToken is provided', async () => {
      const before = mockPayments.length;
      await mercadoPagoService.processPayment(paymentData, 'vendor-token');

      const created = mockPayments.slice(before);
      expect(created).toHaveLength(1);
      expect(created[0].config.accessToken).toBe('vendor-token');
    });

    it('forwards application_fee when provided', async () => {
      const before = mockPayments.length;
      await mercadoPagoService.processPayment(
        { ...paymentData, applicationFee: 357000 },
        'vendor-token'
      );

      const created = mockPayments.slice(before);
      expect(created[0].create).toHaveBeenCalledWith({
        body: expect.objectContaining({ application_fee: 357000 }),
      });
    });

    it('does not send application_fee when absent', async () => {
      await mercadoPagoService.processPayment(paymentData);
      const calledBody = mockPayments[0].create.mock.calls[0][0].body;
      expect(calledBody).not.toHaveProperty('application_fee');
    });
  });

  describe('refundPayment', () => {
    it('refunds the full payment with the platform client by default', async () => {
      await mercadoPagoService.refundPayment('789');
      expect(mockRefunds[0].config.accessToken).toBe('platform-token');
      expect(mockRefunds[0].create).toHaveBeenCalledWith({ payment_id: 789 });
    });

    it('refunds a partial amount with a per-token client', async () => {
      const before = mockRefunds.length;
      await mercadoPagoService.refundPayment('456', {
        amount: 50000,
        accessToken: 'vendor-token',
      });

      const created = mockRefunds.slice(before);
      expect(created).toHaveLength(1);
      expect(created[0].config.accessToken).toBe('vendor-token');
      expect(created[0].create).toHaveBeenCalledWith({
        payment_id: 456,
        body: { amount: 50000 },
      });
    });

    it('returns the refund status', async () => {
      const result = await mercadoPagoService.refundPayment('456', { amount: 1 });
      expect(result).toEqual({ status: 'approved' });
    });
  });

  describe('getPayment (wallet integration — intact)', () => {
    it('keeps using the module-level payment instance', async () => {
      mockPayments[0].get.mockResolvedValueOnce({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 1000000,
        currency_id: 'COP',
        external_reference: 'ref-1',
        date_approved: '2026-08-02T12:00:00.000-05:00',
      });

      const result = await mercadoPagoService.getPayment('12345');

      expect(mockPayments[0].get).toHaveBeenCalledWith({ id: '12345' });
      expect(result).toEqual(
        expect.objectContaining({
          id: '12345',
          status: 'approved',
          date_approved: '2026-08-02T12:00:00.000-05:00',
        })
      );
    });
  });
});
