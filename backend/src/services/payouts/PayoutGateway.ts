/**
 * @fileoverview Payout Gateway contract — money-out abstraction
 * @description Common interface implemented by every payout provider adapter
 *   (PayPal Payouts REST, MercadoPago money-out). The wallet service talks to
 *   this interface, never to a concrete provider.
 *
 *   Contrato de pasarela de payout — abstracción de money-out implementada por
 *   cada adaptador de proveedor (PayPal Payouts REST, MercadoPago money-out).
 * @module services/payouts/PayoutGateway
 */

import type { PayoutGatewayType, WithdrawalDestination } from '../../types/index.js';

/**
 * Wallet-domain payout status — the neutral status the rest of the system
 * consumes, regardless of the provider's own vocabulary.
 *
 * Estado de payout en el dominio wallet — estado neutro que consume el resto
 * del sistema, independiente del vocabulario del proveedor.
 */
export type PayoutStatus = 'pending' | 'paid' | 'failed' | 'unknown';

/**
 * Request to create a real payout on the provider.
 *
 * `withdrawalId` doubles as the provider idempotency key (PayPal
 * `sender_batch_id` / MercadoPago `external_reference`): re-sending the same
 * id does not create a second payout.
 *
 * Solicitud para crear un payout real en el proveedor. `withdrawalId` actúa
 * como clave idempotente del proveedor.
 */
export interface PayoutRequest {
  /** Internal withdrawal id — idempotency key for the provider */
  withdrawalId: string;
  /** Net amount to pay out, in USD (2 decimals) */
  amount: number;
  /** ISO 4217 currency code (e.g. 'USD') */
  currency: string;
  /** Provider-specific payout destination */
  destination: WithdrawalDestination;
}

/** Result of creating a payout — provider payout id plus initial status */
export interface PayoutResult {
  /** Provider-assigned payout id (stored as gatewayPayoutId on the withdrawal) */
  payoutId: string;
  status: PayoutStatus;
}

/**
 * Payout gateway abstraction — one adapter per provider.
 *
 * Pasarela de payout — un adaptador por proveedor.
 */
export interface PayoutGateway {
  readonly type: PayoutGatewayType;
  createPayout(req: PayoutRequest): Promise<PayoutResult>;
  getStatus(payoutId: string): Promise<PayoutStatus>;
  verifyWebhook(headers: Record<string, string>, rawBody: string): Promise<boolean>;
}
