/**
 * @fileoverview MercadoPagoMoneyOutGateway Unit Tests — PayoutGateway contract (PR 2b)
 * @description Tests for the MercadoPago money-out gateway adapter: createPayout payload
 *   construction (external_reference = withdrawalId, account_id recipient, 2-decimal amount
 *   and currency), getStatus via the SDK Payment.get with status mapping to the wallet
 *   domain, verifyWebhook HMAC signature rejection/acceptance, the typed payout webhook
 *   event parser, and the gateway factory that derives the adapter from the destination
 *   shape (accountId → mercadopago).
 *
 *   Pruebas del adaptador de money-out de MercadoPago: construcción del payload de
 *   createPayout (external_reference = withdrawalId, account_id, monto a 2 decimales),
 *   mapeo de estados de getStatus al dominio wallet, verificación HMAC de firma de
 *   webhook, parser tipado del evento de payout y la factory de gateways.
 *
 * @module __tests__/unit/payouts/mercadopago-moneyout.gateway
 */

// ============================================
// MOCKS — Must go BEFORE imports / Deben ir ANTES de los imports
// ============================================

jest.mock('../../../config/env', () => ({
  config: {
    mercadopago: {
      accessToken: 'TEST-123',
      webhookSecret: 'wh-secret',
      payoutWebhookId: 'payout-webhook-123',
    },
    // Required at module load by PayPalPayoutsGateway (pulled in via the factory import)
    paypal: {
      mode: 'sandbox',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      webhookId: '',
      payoutWebhookId: 'payout-webhook-123',
    },
    app: {
      frontendUrl: 'http://localhost:3000',
    },
  },
}));

jest.mock('axios');

// Breaks the PayPalService → WebhookEvent → Sequelize chain pulled in by the
// payout factory import (same pattern as the PayPal gateway test).
jest.mock('../../../services/PayPalService', () => ({
  paypalService: {
    getAccessToken: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  },
}));

jest.mock('../../../services/MercadoPagoService', () => ({
  mercadoPagoService: {
    getAccessToken: jest.fn(),
    getPayment: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  },
}));

import axios from 'axios';
import { mercadoPagoService } from '../../../services/MercadoPagoService';
import {
  MercadoPagoMoneyOutGateway,
  mapMercadoPagoStatus,
  parseMercadoPagoPayoutWebhookEvent,
} from '../../../services/payouts/MercadoPagoMoneyOutGateway';
import type { PayoutRequest } from '../../../services/payouts/PayoutGateway';
import { getPayoutGateway } from '../../../services/payouts';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedMercadoPagoService = mercadoPagoService as jest.Mocked<typeof mercadoPagoService>;

const gateway = new MercadoPagoMoneyOutGateway();

const basePayoutRequest: PayoutRequest = {
  withdrawalId: 'withdrawal-uuid-1',
  amount: 95.5,
  currency: 'USD',
  destination: { method: 'mercadopago', accountId: 'MP_123' },
};

const validWebhookBody = JSON.stringify({
  id: 'WH-MP-20260801-001',
  action: 'advanced_payment.approved',
  type: 'advanced_payment',
  date_created: '2026-08-01T12:00:00Z',
  data: { id: '987654321' },
});

const mercadopagoHeaders = {
  'x-signature': 'ts=1722513600,v1=abcdef0123456789',
  'x-request-id': 'REQ-1',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MercadoPagoMoneyOutGateway.createPayout', () => {
  it('builds the advanced-payments payload with external_reference = withdrawalId, account_id, currency and 2-decimal amount', async () => {
    mockedMercadoPagoService.getAccessToken.mockReturnValue('TEST-123');
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: '987654321', status: 'pending' },
    });

    const result = await gateway.createPayout(basePayoutRequest);

    expect(result).toEqual({ payoutId: '987654321', status: 'pending' });

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    const [url, body, opts] = mockedAxios.post.mock.calls[0] as [
      string,
      Record<string, unknown>,
      { headers: Record<string, string> },
    ];
    expect(url).toBe('https://api.mercadopago.com/v1/advanced_payments');
    expect(opts.headers.Authorization).toBe('Bearer TEST-123');
    expect(opts.headers['Content-Type']).toBe('application/json');

    const advancedPayment = body as {
      external_reference: string;
      disbursements: Array<Record<string, unknown>>;
    };
    // The withdrawal id doubles as the MP idempotency key (external_reference)
    expect(advancedPayment.external_reference).toBe('withdrawal-uuid-1');

    const disbursement = advancedPayment.disbursements[0];
    expect(advancedPayment.disbursements).toHaveLength(1);
    expect(disbursement.account_id).toBe('MP_123');
    expect(disbursement.external_reference).toBe('withdrawal-uuid-1');
    expect(disbursement.amount).toBe(95.5);
    expect(disbursement.currency_id).toBe('USD');
  });

  it('formats the amount with fixed 2 decimals without float errors', async () => {
    mockedMercadoPagoService.getAccessToken.mockReturnValue('TEST-123');
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: '987654322', status: 'pending' },
    });

    await gateway.createPayout({ ...basePayoutRequest, amount: 0.1 + 0.2 });

    const [, body] = mockedAxios.post.mock.calls[0] as [string, Record<string, unknown>];
    const disbursements = (body as { disbursements: Array<{ amount: number }> }).disbursements;
    expect(disbursements[0].amount).toBe(0.3);
  });

  it('rejects a destination without a MercadoPago accountId (INVALID_DESTINATION) before any API call', async () => {
    await expect(
      gateway.createPayout({
        ...basePayoutRequest,
        destination: { method: 'mercadopago', email: 'user@example.com' },
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_DESTINATION' });

    expect(mockedMercadoPagoService.getAccessToken).not.toHaveBeenCalled();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});

describe('mapMercadoPagoStatus (pure status mapping)', () => {
  it('maps pending and in_process to the wallet domain status "pending"', () => {
    expect(mapMercadoPagoStatus('pending')).toBe('pending');
    expect(mapMercadoPagoStatus('in_process')).toBe('pending');
  });

  it('maps approved to "paid"', () => {
    expect(mapMercadoPagoStatus('approved')).toBe('paid');
  });

  it('maps rejected, cancelled, refunded and charged_back to "failed"', () => {
    expect(mapMercadoPagoStatus('rejected')).toBe('failed');
    expect(mapMercadoPagoStatus('cancelled')).toBe('failed');
    expect(mapMercadoPagoStatus('refunded')).toBe('failed');
    expect(mapMercadoPagoStatus('charged_back')).toBe('failed');
  });

  it('maps any other status to "unknown"', () => {
    expect(mapMercadoPagoStatus('')).toBe('unknown');
    expect(mapMercadoPagoStatus('BOGUS')).toBe('unknown');
  });
});

describe('MercadoPagoMoneyOutGateway.getStatus', () => {
  it('queries the payment via the SDK and returns the mapped wallet status', async () => {
    mockedMercadoPagoService.getPayment.mockResolvedValue({ id: '987654321', status: 'approved' });

    const status = await gateway.getStatus('987654321');

    expect(status).toBe('paid');
    expect(mockedMercadoPagoService.getPayment).toHaveBeenCalledWith('987654321');
  });

  it('maps SDK payment statuses across the domain (rejected → failed)', async () => {
    mockedMercadoPagoService.getPayment.mockResolvedValue({ id: '987654321', status: 'rejected' });

    await expect(gateway.getStatus('987654321')).resolves.toBe('failed');
  });

  it('rejects invalid payout ids (SSRF prevention) without any SDK call', async () => {
    await expect(gateway.getStatus('../../../etc/passwd')).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_MERCADOPAGO_ID',
    });

    expect(mockedMercadoPagoService.getPayment).not.toHaveBeenCalled();
  });
});

describe('MercadoPagoMoneyOutGateway.verifyWebhook', () => {
  it('rejects an event with an invalid HMAC signature', async () => {
    mockedMercadoPagoService.verifyWebhookSignature.mockReturnValue(false);

    await expect(gateway.verifyWebhook(mercadopagoHeaders, validWebhookBody)).resolves.toBe(false);
    expect(mockedMercadoPagoService.verifyWebhookSignature).toHaveBeenCalledWith(
      '1722513600',
      validWebhookBody,
      'ts=1722513600,v1=abcdef0123456789'
    );
  });

  it('accepts a valid signed event and exposes its event id as the idempotency key', async () => {
    mockedMercadoPagoService.verifyWebhookSignature.mockReturnValue(true);

    await expect(gateway.verifyWebhook(mercadopagoHeaders, validWebhookBody)).resolves.toBe(true);

    const event = parseMercadoPagoPayoutWebhookEvent(validWebhookBody);
    expect(event.id).toBe('WH-MP-20260801-001');
    expect(event.action).toBe('advanced_payment.approved');
    expect(event.data.id).toBe('987654321');
    // The event id is the persistent idempotency key used by WebhookEvent (isEventProcessed)
    expect(event.id).toMatch(/^WH-/);
  });

  it('rejects a malformed payload without verifying the signature', async () => {
    await expect(gateway.verifyWebhook(mercadopagoHeaders, 'not-json{')).resolves.toBe(false);
    expect(mockedMercadoPagoService.verifyWebhookSignature).not.toHaveBeenCalled();
  });

  it('rejects a request without the x-signature header', async () => {
    await expect(gateway.verifyWebhook({}, validWebhookBody)).resolves.toBe(false);
    expect(mockedMercadoPagoService.verifyWebhookSignature).not.toHaveBeenCalled();
  });
});

describe('parseMercadoPagoPayoutWebhookEvent (typed event parser)', () => {
  it('parses a valid payout webhook event into a typed object', () => {
    const event = parseMercadoPagoPayoutWebhookEvent(validWebhookBody);

    expect(event.id).toBe('WH-MP-20260801-001');
    expect(event.action).toBe('advanced_payment.approved');
    expect(event.type).toBe('advanced_payment');
    expect(event.data.id).toBe('987654321');
  });

  it('normalizes numeric notification and payment ids to strings', () => {
    const event = parseMercadoPagoPayoutWebhookEvent(
      JSON.stringify({
        id: 987654321,
        action: 'payment.rejected',
        type: 'payment',
        data: { id: 55667788 },
      })
    );

    expect(event.id).toBe('987654321');
    expect(event.action).toBe('payment.rejected');
    expect(event.data.id).toBe('55667788');
  });

  it('throws on malformed JSON payloads', () => {
    expect(() => parseMercadoPagoPayoutWebhookEvent('not-json{')).toThrow();
    expect(() => parseMercadoPagoPayoutWebhookEvent('')).toThrow();
  });

  it('throws when the payload is not a webhook event object', () => {
    expect(() => parseMercadoPagoPayoutWebhookEvent(JSON.stringify({ foo: 'bar' }))).toThrow();
    expect(() =>
      parseMercadoPagoPayoutWebhookEvent(JSON.stringify({ id: 'WH-1', action: 'payment.approved' }))
    ).toThrow();
    expect(() =>
      parseMercadoPagoPayoutWebhookEvent(JSON.stringify({ id: 'WH-1', data: { id: '123' } }))
    ).toThrow();
  });
});

describe('getPayoutGateway factory', () => {
  it('returns the MercadoPago gateway for accountId destinations', () => {
    const gatewayForAccount = getPayoutGateway({ method: 'mercadopago', accountId: 'MP_123' });

    expect(gatewayForAccount.type).toBe('mercadopago');
    expect(typeof gatewayForAccount.createPayout).toBe('function');
    expect(typeof gatewayForAccount.getStatus).toBe('function');
    expect(typeof gatewayForAccount.verifyWebhook).toBe('function');
  });
});
