/**
 * @fileoverview Payout gateway registry / factory
 * @description Derives the payout gateway adapter from the withdrawal
 *   destination shape: `email` → PayPal Payouts, `accountId` → MercadoPago
 *   money-out (reserved slot, implemented in PR 2b). Consumers (WalletService,
 *   webhook controller) must go through `getPayoutGateway` and never
 *   instantiate adapters directly.
 *
 *   Fábrica de pasarelas de payout: deriva el adaptador de la forma del
 *   destino del retiro (email → PayPal, accountId → MercadoPago).
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
 * The provider is derived from the destination shape (ADR-3): email → paypal,
 * accountId → mercadopago.
 *
 * Resuelve la pasarela de payout para un destino de retiro.
 * @throws {AppError} 501 GATEWAY_NOT_IMPLEMENTED for MercadoPago (PR 2b)
 * @throws {AppError} 400 INVALID_DESTINATION when no provider shape matches
 */
export function getPayoutGateway(destination: WithdrawalDestination): PayoutGateway {
  if (destination.email) {
    return paypalPayoutsGateway;
  }
  if (destination.accountId) {
    // TODO(wallet 2b): MercadoPagoMoneyOutGateway — SDK payment.get + REST disbursements
    throw new AppError(
      501,
      'GATEWAY_NOT_IMPLEMENTED',
      'MercadoPago payout gateway is not implemented yet'
    );
  }
  throw new AppError(
    400,
    'INVALID_DESTINATION',
    'Destination must provide a paypal email or a MercadoPago accountId'
  );
}
