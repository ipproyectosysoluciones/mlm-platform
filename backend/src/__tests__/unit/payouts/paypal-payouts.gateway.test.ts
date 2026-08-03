/**
 * @fileoverview PayPalPayoutsGateway Unit Tests — PayoutGateway contract (PR 2a)
 * @description Tests for the PayPal Payouts gateway adapter: createPayout payload
 *   construction (sender_batch_id = withdrawalId, email recipient, 2-decimal amount),
 *   getStatus batch lookup + status mapping to the wallet domain, verifyWebhook
 *   signature rejection/acceptance, the typed payout webhook event parser, and the
 *   gateway factory that derives the adapter from the destination shape.
 *
 *   Pruebas del adaptador de payout PayPal: construcción del payload de createPayout,
 *   mapeo de estados de getStatus al dominio wallet, verificación de firma de
 *   webhook, parser tipado del evento de payout y la factory de gateways.
 *
 * @module __tests__/unit/payouts/paypal-payouts.gateway
 */

// ============================================
// MOCKS — Must go BEFORE imports / Deben ir ANTES de los imports
// ============================================

jest.mock('../../../config/env', () => ({
  config: {
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

jest.mock('../../../services/PayPalService', () => ({
  paypalService: {
    getAccessToken: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  },
}));

// Breaks the MercadoPagoService → MercadoPagoConfig chain pulled in by the payout
// factory import (MercadoPagoMoneyOutGateway), same pattern as the MP gateway test.
jest.mock('../../../services/MercadoPagoService', () => ({
  mercadoPagoService: {
    getAccessToken: jest.fn(),
    getPayment: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  },
}));

import axios from 'axios';
import { AppError } from '../../../middleware/error.middleware';
import { paypalService } from '../../../services/PayPalService';
import {
  PayPalPayoutsGateway,
  mapPayPalBatchStatus,
  parsePayPalPayoutWebhookEvent,
} from '../../../services/payouts/PayPalPayoutsGateway';
import type { PayoutRequest } from '../../../services/payouts/PayoutGateway';
import { getPayoutGateway } from '../../../services/payouts';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedPayPalService = paypalService as jest.Mocked<typeof paypalService>;

const gateway = new PayPalPayoutsGateway();

const basePayoutRequest: PayoutRequest = {
  withdrawalId: 'withdrawal-uuid-1',
  amount: 95.5,
  currency: 'USD',
  destination: { method: 'paypal', email: 'user@example.com' },
};

const validWebhookBody = JSON.stringify({
  id: 'WH-20260801-001',
  event_type: 'PAYMENT.PAYOUTS.ITEM.SUCCEEDED',
  create_time: '2026-08-01T12:00:00Z',
  resource: {
    payout_batch_id: 'PTB123',
    sender_batch_id: 'withdrawal-uuid-1',
    payout_item_id: 'ITEM-1',
    transaction_id: 'TRX-1',
    payout_item: {
      transaction_status: 'SUCCESS',
      amount: { currency: 'USD', value: '95.50' },
    },
  },
});

const paypalHeaders = {
  'paypal-auth-algo': 'SHA256withRSA',
  'paypal-cert-url': 'https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-1',
  'paypal-transmission-id': 'TXN-1',
  'paypal-transmission-sig': 'sig',
  'paypal-transmission-time': '2026-08-01T12:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PayPalPayoutsGateway.createPayout', () => {
  it('builds the Payouts payload with sender_batch_id = withdrawalId, email, currency and 2-decimal amount', async () => {
    mockedPayPalService.getAccessToken.mockResolvedValue('token-1');
    mockedAxios.post.mockResolvedValueOnce({
      data: { batch_header: { payout_batch_id: 'PTB123', batch_status: 'PENDING' } },
    });

    const result = await gateway.createPayout(basePayoutRequest);

    expect(result).toEqual({ payoutId: 'PTB123', status: 'pending' });

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    const [url, body, opts] = mockedAxios.post.mock.calls[0] as [
      string,
      Record<string, unknown>,
      { headers: Record<string, string> },
    ];
    expect(url).toBe('https://api-m.sandbox.paypal.com/v1/payments/payouts');
    expect(opts.headers.Authorization).toBe('Bearer token-1');
    expect(opts.headers['Content-Type']).toBe('application/json');

    const senderBatchHeader = (body as { sender_batch_header: Record<string, string> })
      .sender_batch_header;
    expect(senderBatchHeader.sender_batch_id).toBe('withdrawal-uuid-1');

    const items = (body as { items: Array<Record<string, unknown>> }).items;
    expect(items).toHaveLength(1);
    expect(items[0].recipient_type).toBe('EMAIL');
    expect(items[0].receiver).toBe('user@example.com');
    const amount = items[0].amount as { value: string; currency: string };
    expect(amount.value).toBe('95.50');
    expect(amount.currency).toBe('USD');
  });

  it('formats the amount with fixed 2 decimals without float errors', async () => {
    mockedPayPalService.getAccessToken.mockResolvedValue('token-1');
    mockedAxios.post.mockResolvedValueOnce({
      data: { batch_header: { payout_batch_id: 'PTB2', batch_status: 'PENDING' } },
    });

    await gateway.createPayout({ ...basePayoutRequest, amount: 0.1 + 0.2 });

    const [, body] = mockedAxios.post.mock.calls[0] as [string, Record<string, unknown>];
    const items = (body as { items: Array<{ amount: { value: string } }> }).items;
    expect(items[0].amount.value).toBe('0.30');
  });

  it('rejects a destination without a PayPal email (INVALID_DESTINATION) before any API call', async () => {
    await expect(
      gateway.createPayout({
        ...basePayoutRequest,
        destination: { method: 'paypal', accountId: 'MP_123' },
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_DESTINATION' });

    expect(mockedPayPalService.getAccessToken).not.toHaveBeenCalled();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});

describe('mapPayPalBatchStatus (pure status mapping)', () => {
  it('maps PENDING and PROCESSING to the wallet domain status "pending"', () => {
    expect(mapPayPalBatchStatus('PENDING')).toBe('pending');
    expect(mapPayPalBatchStatus('PROCESSING')).toBe('pending');
  });

  it('maps SUCCESS to "paid"', () => {
    expect(mapPayPalBatchStatus('SUCCESS')).toBe('paid');
  });

  it('maps DENIED, FAILED and CANCELED to "failed"', () => {
    expect(mapPayPalBatchStatus('DENIED')).toBe('failed');
    expect(mapPayPalBatchStatus('FAILED')).toBe('failed');
    expect(mapPayPalBatchStatus('CANCELED')).toBe('failed');
  });

  it('maps any other batch status to "unknown"', () => {
    expect(mapPayPalBatchStatus('')).toBe('unknown');
    expect(mapPayPalBatchStatus('BOGUS')).toBe('unknown');
  });
});

describe('PayPalPayoutsGateway.getStatus', () => {
  it('queries the payout batch and returns the mapped wallet status', async () => {
    mockedPayPalService.getAccessToken.mockResolvedValue('token-1');
    mockedAxios.get.mockResolvedValueOnce({
      data: { batch_header: { payout_batch_id: 'PTB123', batch_status: 'SUCCESS' } },
    });

    const status = await gateway.getStatus('PTB123');

    expect(status).toBe('paid');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api-m.sandbox.paypal.com/v1/payments/payouts/PTB123',
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } })
    );
  });

  it('rejects invalid payout ids (SSRF prevention) without any HTTP call', async () => {
    await expect(gateway.getStatus('../../../etc/passwd')).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_PAYPAL_ID',
    });

    expect(mockedPayPalService.getAccessToken).not.toHaveBeenCalled();
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });
});

describe('PayPalPayoutsGateway.verifyWebhook', () => {
  it('rejects an event with an invalid signature', async () => {
    mockedPayPalService.verifyWebhookSignature.mockResolvedValue(false);

    await expect(gateway.verifyWebhook(paypalHeaders, validWebhookBody)).resolves.toBe(false);
    expect(mockedPayPalService.verifyWebhookSignature).toHaveBeenCalledWith(
      paypalHeaders,
      validWebhookBody,
      'payout-webhook-123'
    );
  });

  it('accepts a valid signed event and exposes its event id as the idempotency key', async () => {
    mockedPayPalService.verifyWebhookSignature.mockResolvedValue(true);

    await expect(gateway.verifyWebhook(paypalHeaders, validWebhookBody)).resolves.toBe(true);

    const event = parsePayPalPayoutWebhookEvent(validWebhookBody);
    expect(event.id).toBe('WH-20260801-001');
    expect(event.event_type).toBe('PAYMENT.PAYOUTS.ITEM.SUCCEEDED');
    // The event id is the persistent idempotency key used by WebhookEvent (isEventProcessed)
    expect(event.id).toMatch(/^WH-/);
  });

  it('rejects a malformed payload without verifying the signature', async () => {
    await expect(gateway.verifyWebhook(paypalHeaders, 'not-json{')).resolves.toBe(false);
    expect(mockedPayPalService.verifyWebhookSignature).not.toHaveBeenCalled();
  });
});

describe('parsePayPalPayoutWebhookEvent (typed event parser)', () => {
  it('parses a valid payout webhook event into a typed object', () => {
    const event = parsePayPalPayoutWebhookEvent(validWebhookBody);

    expect(event.id).toBe('WH-20260801-001');
    expect(event.event_type).toBe('PAYMENT.PAYOUTS.ITEM.SUCCEEDED');
    expect(event.resource?.payout_batch_id).toBe('PTB123');
    expect(event.resource?.sender_batch_id).toBe('withdrawal-uuid-1');
    expect(event.resource?.payout_item?.transaction_status).toBe('SUCCESS');
    expect(event.resource?.payout_item?.amount?.value).toBe('95.50');
  });

  it('throws on malformed JSON payloads', () => {
    expect(() => parsePayPalPayoutWebhookEvent('not-json{')).toThrow();
    expect(() => parsePayPalPayoutWebhookEvent('')).toThrow();
  });

  it('throws when the payload is not a webhook event object', () => {
    expect(() => parsePayPalPayoutWebhookEvent(JSON.stringify({ foo: 'bar' }))).toThrow();
  });
});

describe('getPayoutGateway factory', () => {
  it('returns the PayPal gateway for email destinations', () => {
    const gatewayForEmail = getPayoutGateway({ method: 'paypal', email: 'user@example.com' });

    expect(gatewayForEmail.type).toBe('paypal');
    expect(typeof gatewayForEmail.createPayout).toBe('function');
    expect(typeof gatewayForEmail.getStatus).toBe('function');
    expect(typeof gatewayForEmail.verifyWebhook).toBe('function');
  });

  it('returns the MercadoPago gateway for accountId destinations (implemented in PR 2b)', () => {
    const gatewayForAccount = getPayoutGateway({ method: 'mercadopago', accountId: 'MP_123' });

    expect(gatewayForAccount.type).toBe('mercadopago');
    expect(typeof gatewayForAccount.createPayout).toBe('function');
    expect(typeof gatewayForAccount.getStatus).toBe('function');
    expect(typeof gatewayForAccount.verifyWebhook).toBe('function');
  });

  it('rejects destinations with neither an email nor an accountId', () => {
    expect(() => getPayoutGateway({ method: 'paypal' })).toThrowError(AppError);
    expect(() => getPayoutGateway({ method: 'paypal' })).toThrowError(
      expect.objectContaining({ statusCode: 400, code: 'INVALID_DESTINATION' })
    );
  });
});
