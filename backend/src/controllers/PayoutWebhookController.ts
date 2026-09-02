/**
 * @fileoverview PayoutWebhookController — Handle payout webhook events
 * @description Processes PayPal PAYOUTS.* webhook events with signature verification
 *   and idempotency via WebhookEvent table
 *
 * @module controllers/PayoutWebhookController
 */

import { Request, Response } from 'express';
import { walletService } from '../services/WalletService.js';
import { paypalService } from '../services/PayPalService.js';
import { WebhookEvent } from '../models/index.js';
import { parsePayPalPayoutWebhookEvent } from '../services/payouts/PayPalPayoutsGateway.js';
import { logger } from '../utils/logger.js';
import type { PayoutStatus } from '../services/payouts/PayoutGateway.js';

/** Map PayPal batch status to our payout domain status */
function mapPayPalPayoutStatus(batchStatus: string): PayoutStatus {
  const map: Record<string, PayoutStatus> = {
    SUCCESS: 'paid',
    PENDING: 'pending',
    PROCESSING: 'pending',
    FAILED: 'failed',
    CANCELLED: 'failed',
    BLOCKED: 'failed',
    HELD: 'pending',
  };
  return map[batchStatus] || 'unknown';
}

/**
 * Handle PayPal payout webhook
 */
export async function paypalPayoutWebhook(req: Request, res: Response): Promise<void> {
  try {
    // 1. Verify webhook signature
    const isValid = await paypalService.verifyWebhookSignature(
      req.headers as Record<string, string>,
      req.body ? JSON.stringify(req.body) : ''
    );

    if (!isValid) {
      logger.warn({ service: 'PayoutWebhookController' }, 'Invalid PayPal webhook signature');
      res.status(403).json({ error: 'INVALID_SIGNATURE' });
      return;
    }

    // 2. Check idempotency
    const eventId = req.headers['paypal-transmission-id'] as string;
    if (eventId) {
      const existing = await WebhookEvent.findOne({
        where: { eventId, provider: 'paypal' },
      });
      if (existing) {
        res.json({ received: true, duplicate: true });
        return;
      }
    }

    // 3. Parse event
    const event = parsePayPalPayoutWebhookEvent(JSON.stringify(req.body));

    // 4. Process PAYOUTS.* events
    if (event.event_type?.startsWith('PAYMENT.PAYOUTS.')) {
      const payoutId = event.resource?.payout_batch_id || event.resource?.payout_item_id;
      const status = mapPayPalPayoutStatus(
        event.resource?.batch_status || event.resource?.status || 'UNKNOWN'
      );

      if (payoutId && status !== 'unknown') {
        await walletService.syncFromGateway(payoutId, status);
      }
    }

    // 5. Mark event as processed (idempotency)
    if (eventId) {
      await WebhookEvent.create({
        eventId,
        provider: 'paypal',
        eventType: event.event_type || null,
      });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error(
      { service: 'PayoutWebhookController', err: error },
      'Error processing PayPal payout webhook'
    );
    res.status(500).json({ error: 'WEBHOOK_ERROR' });
  }
}

/**
 * Handle MercadoPago payout webhook (placeholder — NotImplementedError)
 */
export async function mercadopagoPayoutWebhook(req: Request, res: Response): Promise<void> {
  res.status(501).json({
    error: 'NOT_IMPLEMENTED',
    message: 'MercadoPago money-out is not implemented — PayPal Payouts only',
  });
}
