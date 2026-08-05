/**
 * @fileoverview MercadoPago Money-Out Gateway — REST advanced_payments + SDK Payment.get
 * @description Adapter for MercadoPago money-out. The SDK v2.12.0 does not wrap the
 *   disbursements / money-out endpoints, so payout creation goes through a direct REST
 *   call to POST /v1/advanced_payments (disbursements model, the mechanism to move funds
 *   between MercadoPago accounts). The access token is reused from MercadoPagoService
 *   (getAccessToken), status checks reuse the SDK Payment.get via
 *   MercadoPagoService.getPayment, and webhook signature verification reuses the
 *   HMAC-SHA256 verification from MercadoPagoService (x-signature header).
 *
 *   Adaptador de money-out de MercadoPago. El SDK 2.12.0 no envuelve los endpoints de
 *   disbursements/money-out, por lo que la creación se hace por REST a
 *   POST /v1/advanced_payments; el estado se consulta con Payment.get del SDK y la
 *   firma de webhook se verifica por HMAC-SHA256 (MercadoPagoService).
 * @module services/payouts/MercadoPagoMoneyOutGateway
 */

import axios from 'axios';
import { AppError } from '../../middleware/error.middleware.js';
import { mercadoPagoService } from '../MercadoPagoService.js';
import type { PayoutGatewayType } from '../../types/index.js';
import type { PayoutGateway, PayoutRequest, PayoutResult, PayoutStatus } from './PayoutGateway.js';

const MERCADOPAGO_API_BASE = 'https://api.mercadopago.com';

/**
 * Validate a MercadoPago identifier (advanced payment / payment ids) to prevent SSRF.
 * MP ids are numeric.
 *
 * Valida formato de identificador MercadoPago para prevenir SSRF (los ids son numéricos).
 * @throws {AppError} if the id is not numeric
 */
function validateMercadoPagoId(id: string, label: string): void {
  if (!id || !/^\d+$/.test(id)) {
    throw new AppError(400, 'INVALID_MERCADOPAGO_ID', `Invalid ${label}: got "${id}"`);
  }
}

/**
 * Map a MercadoPago status (advanced payment / SDK payment status) into the
 * wallet-domain PayoutStatus.
 *
 * Mapea el estado de MercadoPago (advanced payment / payment) al dominio wallet.
 * Pure function — no side effects, unit-tested directly.
 */
export function mapMercadoPagoStatus(status: string | undefined): PayoutStatus {
  switch (status) {
    case 'pending':
    case 'in_process':
      return 'pending';
    case 'approved':
      return 'paid';
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'failed';
    default:
      return 'unknown';
  }
}

/**
 * Typed MercadoPago webhook notification (payments / advanced payments).
 * The notification `id` is the persistent idempotency key (WebhookEvent table);
 * `data.id` is the payout/payment id to reconcile. MercadoPago sends both ids as
 * numbers or strings — the parser normalizes them to strings.
 */
export interface MercadoPagoPayoutWebhookEvent {
  /** Notification id — idempotency key (may be numeric in the raw payload) */
  id: string;
  /** Notification action, e.g. 'payment.approved', 'advanced_payment.rejected' */
  action: string;
  type?: string;
  date_created?: string;
  /** Payout/payment id to reconcile against the withdrawal */
  data: { id: string };
}

/**
 * Parse and validate a raw MercadoPago webhook payload into a typed event.
 * Pure function — throws AppError(400) when the payload is not a valid payout
 * webhook notification.
 *
 * @throws {AppError} INVALID_WEBHOOK_PAYLOAD when the payload cannot be parsed
 */
export function parseMercadoPagoPayoutWebhookEvent(rawBody: string): MercadoPagoPayoutWebhookEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new AppError(400, 'INVALID_WEBHOOK_PAYLOAD', 'Webhook body is not valid JSON');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new AppError(
      400,
      'INVALID_WEBHOOK_PAYLOAD',
      'Webhook payload is not a MercadoPago payout event'
    );
  }

  const raw = parsed as {
    id?: unknown;
    action?: unknown;
    type?: unknown;
    date_created?: unknown;
    data?: { id?: unknown };
  };

  const id = typeof raw.id === 'number' || typeof raw.id === 'string' ? String(raw.id) : '';
  const action = typeof raw.action === 'string' ? raw.action : '';
  const dataId =
    typeof raw.data?.id === 'number' || typeof raw.data?.id === 'string' ? String(raw.data.id) : '';

  if (!id || !action || !dataId) {
    throw new AppError(
      400,
      'INVALID_WEBHOOK_PAYLOAD',
      'Webhook payload is not a MercadoPago payout event'
    );
  }

  return {
    id,
    action,
    type: typeof raw.type === 'string' ? raw.type : undefined,
    date_created: typeof raw.date_created === 'string' ? raw.date_created : undefined,
    data: { id: dataId },
  };
}

/**
 * MercadoPago money-out gateway adapter — implements the PayoutGateway contract.
 * REST POST /v1/advanced_payments (create, disbursements model), SDK Payment.get
 * (status) and webhook signature verification via MercadoPagoService.
 */
export class MercadoPagoMoneyOutGateway implements PayoutGateway {
  readonly type: PayoutGatewayType = 'mercadopago';

  async createPayout(req: PayoutRequest): Promise<PayoutResult> {
    const { destination } = req;
    if (destination.method !== 'mercadopago' || !destination.accountId) {
      throw new AppError(
        400,
        'INVALID_DESTINATION',
        'MercadoPago payouts require a valid accountId destination'
      );
    }

    const token = mercadoPagoService.getAccessToken();
    // Fixed 2 decimals avoids float artifacts (0.1 + 0.2 → 0.30)
    const amount = Number(req.amount.toFixed(2));

    // TODO(wallet 2b): confirm the exact money-out endpoint and disbursement body with
    // MercadoPago before production enablement (design open question). The PayoutGateway
    // abstraction isolates this change — only this method needs updating.
    const response = await axios.post(
      `${MERCADOPAGO_API_BASE}/v1/advanced_payments`,
      {
        // Withdrawal id doubles as the MP idempotency key (external_reference): a
        // re-send does not create a second payout.
        external_reference: req.withdrawalId,
        disbursements: [
          {
            amount,
            currency_id: req.currency,
            external_reference: req.withdrawalId,
            account_id: destination.accountId,
            description: `Withdrawal ${req.withdrawalId}`,
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

    const advancedPayment = response.data as { id?: string; status?: string } | undefined;

    if (!advancedPayment?.id) {
      throw new AppError(
        502,
        'GATEWAY_ERROR',
        'MercadoPago response did not include an advanced payment id'
      );
    }

    return {
      payoutId: advancedPayment.id,
      status: mapMercadoPagoStatus(advancedPayment.status),
    };
  }

  async getStatus(payoutId: string): Promise<PayoutStatus> {
    validateMercadoPagoId(payoutId, 'MercadoPago payout id');
    const payment = await mercadoPagoService.getPayment(payoutId);
    return mapMercadoPagoStatus(payment.status);
  }

  async verifyWebhook(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    try {
      // Reject malformed payloads before touching signature verification
      parseMercadoPagoPayoutWebhookEvent(rawBody);
    } catch {
      return false;
    }
    // MercadoPago signs webhooks with HMAC-SHA256 over "ts.rawBody" using the webhook
    // secret, carried in the x-signature header (ts=<ts>,v1=<hmac>). Verified through
    // MercadoPagoService (same pattern as the checkout webhooks).
    const xSignature = headers['x-signature'];
    if (!xSignature) return false;
    const tsMatch = xSignature.match(/ts=(\d+)/);
    if (!tsMatch) return false;
    return mercadoPagoService.verifyWebhookSignature(tsMatch[1], rawBody, xSignature);
  }
}

/** Singleton instance for the payout gateway registry */
export const mercadoPagoMoneyOutGateway = new MercadoPagoMoneyOutGateway();
