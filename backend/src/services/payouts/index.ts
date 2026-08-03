/**
 * @fileoverview Payout gateway registry / factory
 * @description Derives the payout gateway adapter from the withdrawal
 *   destination: `email` → PayPal Payouts (the only supported money-out
 *   provider; MercadoPago has no payout API to third parties). Consumers
 *   (WalletService, webhook controller) must go through `getPayoutGateway`
 *   and never instantiate adapters directly.
 *
 *   Fábrica de pasarelas de payout: deriva el adaptador del destino del
 *   retiro (email → PayPal Payouts, única vía de money-out soportada).
 * @module services/payouts
 */

import { AppError } from '../../middleware/error.middleware.js';
import type { WithdrawalDestination } from '../../types/index.js';
import { paypalPayoutsGateway } from './PayPalPayoutsGateway.js';
import type { PayoutGateway } from './PayoutGateway.js';

export { PayPalPayoutsGateway, parsePayPalPayoutWebhookEvent } from './PayPalPayoutsGateway.js';
export type { PayPalPayoutWebhookEvent } from './PayPalPayoutsGateway.js';
export type { PayoutGateway, PayoutRequest, PayoutResult, PayoutStatus } from './PayoutGateway.js';

/**
 * Resolve the payout gateway for a withdrawal destination.
 * The provider is derived from the destination shape (ADR-3): email → paypal.
 *
 * Resuelve la pasarela de payout para un destino de retiro.
 * @throws {AppError} 400 INVALID_DESTINATION when the destination lacks a paypal email
 */
export function getPayoutGateway(destination: WithdrawalDestination): PayoutGateway {
  if (destination.email) {
    return paypalPayoutsGateway;
  }
  throw new AppError(400, 'INVALID_DESTINATION', 'Destination must provide a paypal email');
}
