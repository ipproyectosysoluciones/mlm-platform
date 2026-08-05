/**
 * @fileoverview PayPal Payouts Gateway — REST /v1/payments/payouts
 * @description Adapter for the PayPal Payouts API. Reuses the OAuth token from
 *   PayPalService (no duplicated auth) and the PayPal Notifications API for
 *   webhook signature verification. Maps PayPal batch statuses into the
 *   wallet-domain PayoutStatus.
 *
 *   Adaptador de la API PayPal Payouts. Reutiliza el token OAuth de
 *   PayPalService y la API de Notificaciones para verificar firmas de webhook.
 * @module services/payouts/PayPalPayoutsGateway
 */

import axios from 'axios';
import { config } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { paypalService } from '../PayPalService.js';
import type { PayoutGatewayType } from '../../types/index.js';
import type { PayoutGateway, PayoutRequest, PayoutResult, PayoutStatus } from './PayoutGateway.js';

const PAYPAL_API_BASE =
  config.paypal.mode === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

/**
 * Validate a PayPal identifier (batch ids, etc.) to prevent SSRF.
 * Same allowlist as PayPalService: alphanumeric, hyphen, underscore.
 *
 * Valida formato de identificador PayPal para prevenir SSRF.
 * @throws {AppError} if the id contains invalid characters
 */
function validatePayPalId(id: string, label: string): void {
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new AppError(400, 'INVALID_PAYPAL_ID', `Invalid ${label}: got "${id}"`);
  }
}

/**
 * Map a PayPal Payouts batch status into the wallet-domain PayoutStatus.
 *
 * Mapea el estado de batch de PayPal Payouts al dominio wallet.
 * Pure function — no side effects, unit-tested directly.
 */
export function mapPayPalBatchStatus(batchStatus: string | undefined): PayoutStatus {
  switch (batchStatus) {
    case 'PENDING':
    case 'PROCESSING':
      return 'pending';
    case 'SUCCESS':
      return 'paid';
    case 'DENIED':
    case 'FAILED':
    case 'CANCELED':
      return 'failed';
    default:
      return 'unknown';
  }
}

/**
 * Typed PayPal Payouts webhook event (PAYMENT.PAYOUTS.*).
 * The event `id` is the persistent idempotency key (WebhookEvent table).
 */
export interface PayPalPayoutWebhookEvent {
  id: string;
  event_type: string;
  create_time?: string;
  resource?: {
    payout_batch_id?: string;
    sender_batch_id?: string;
    payout_item_id?: string;
    transaction_id?: string;
    payout_item?: {
      transaction_status?: string;
      amount?: { currency?: string; value?: string };
    };
  };
}

/**
 * Parse and validate a raw PayPal webhook payload into a typed event.
 * Pure function — throws AppError(400) when the payload is not a valid
 * payout webhook event.
 *
 * @throws {AppError} INVALID_WEBHOOK_PAYLOAD when the payload cannot be parsed
 */
export function parsePayPalPayoutWebhookEvent(rawBody: string): PayPalPayoutWebhookEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new AppError(400, 'INVALID_WEBHOOK_PAYLOAD', 'Webhook body is not valid JSON');
  }

  const event = parsed as Partial<PayPalPayoutWebhookEvent>;
  if (
    !event ||
    typeof event !== 'object' ||
    typeof event.id !== 'string' ||
    typeof event.event_type !== 'string'
  ) {
    throw new AppError(
      400,
      'INVALID_WEBHOOK_PAYLOAD',
      'Webhook payload is not a PayPal payout event'
    );
  }

  return event as PayPalPayoutWebhookEvent;
}

/**
 * PayPal Payouts gateway adapter — implements the PayoutGateway contract.
 * POST /v1/payments/payouts (create), GET /v1/payments/payouts/{batchId}
 * (status) and webhook signature verification via PayPalService.
 */
export class PayPalPayoutsGateway implements PayoutGateway {
  readonly type: PayoutGatewayType = 'paypal';

  async createPayout(req: PayoutRequest): Promise<PayoutResult> {
    const { destination } = req;
    if (destination.method !== 'paypal' || !destination.email) {
      throw new AppError(
        400,
        'INVALID_DESTINATION',
        'PayPal payouts require a valid email destination'
      );
    }

    const token = await paypalService.getAccessToken();
    // Fixed 2 decimals avoids float artifacts (0.1 + 0.2 → "0.30")
    const value = req.amount.toFixed(2);

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/payments/payouts`,
      {
        sender_batch_header: {
          sender_batch_id: req.withdrawalId,
          email_subject: 'Nexo Real payout',
          email_message: 'You have received a payout from Nexo Real.',
        },
        items: [
          {
            recipient_type: 'EMAIL',
            receiver: destination.email,
            amount: {
              value,
              currency: req.currency,
            },
            note: `Withdrawal ${req.withdrawalId}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const batchHeader = response.data?.batch_header as
      | { payout_batch_id?: string; batch_status?: string }
      | undefined;

    if (!batchHeader?.payout_batch_id) {
      throw new AppError(
        502,
        'GATEWAY_ERROR',
        'PayPal Payouts response did not include payout_batch_id'
      );
    }

    return {
      payoutId: batchHeader.payout_batch_id,
      status: mapPayPalBatchStatus(batchHeader.batch_status),
    };
  }

  async getStatus(payoutId: string): Promise<PayoutStatus> {
    validatePayPalId(payoutId, 'PayPal payout batch id');
    const token = await paypalService.getAccessToken();

    const response = await axios.get(`${PAYPAL_API_BASE}/v1/payments/payouts/${payoutId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const batchHeader = response.data?.batch_header as { batch_status?: string } | undefined;
    return mapPayPalBatchStatus(batchHeader?.batch_status);
  }

  async verifyWebhook(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    try {
      // Reject malformed payloads before touching signature verification
      parsePayPalPayoutWebhookEvent(rawBody);
    } catch {
      return false;
    }
    // Payout webhooks use their own webhook id (PAYPAL_PAYOUT_WEBHOOK_ID)
    return paypalService.verifyWebhookSignature(headers, rawBody, config.paypal.payoutWebhookId);
  }
}

/** Singleton instance for the payout gateway registry */
export const paypalPayoutsGateway = new PayPalPayoutsGateway();
