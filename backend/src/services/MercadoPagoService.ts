/**
 * @fileoverview MercadoPago Payment Service
 * @description Handles MercadoPago payment operations: create preference, process payment, refunds
 * @module services/MercadoPagoService
 */

import { createHmac } from 'crypto';
import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';
import { config } from '../config/env.js';

// Configure MercadoPago SDK v2
const client = new MercadoPagoConfig({
  accessToken: config.mercadopago.accessToken,
});

export interface MercadoPagoPreference {
  items: Array<{
    id: string;
    title: string;
    description?: string;
    quantity: number;
    currency_id: string;
    unit_price: number;
  }>;
  payer?: {
    name?: string;
    email?: string;
  };
  external_reference?: string;
  notification_url?: string;
  back_urls?: {
    success?: string;
    pending?: string;
    failure?: string;
  };
}

export interface CreatePreferenceResult {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface PaymentResult {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  status_detail?: string;
  payment_type_id?: string;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string;
}

class MercadoPagoService {
  private preference = new Preference(client);
  private payment = new Payment(client);
  private paymentRefund = new PaymentRefund(client);

  /**
   * Create a payment preference
   * @see https://www.mercadopago.com/developers/en/docs/checkout-api/integration-configuration
   */
  async createPreference(preference: MercadoPagoPreference): Promise<CreatePreferenceResult> {
    const result = await this.preference.create({ body: preference });

    return {
      id: result.id!,
      init_point: result.init_point!,
      sandbox_init_point: result.sandbox_init_point!,
    };
  }

  /**
   * Verify MercadoPago webhook signature
   * @param ts - Timestamp from `x-signature` header (ts=<value>)
   * @param rawBody - Raw request body as string
   * @param signature - Full `x-signature` header value (ts=<ts>,v1=<hmac>)
   * @returns true if signature is valid, false otherwise
   */
  verifyWebhookSignature(ts: string, rawBody: string, signature: string): boolean {
    const secret = config.mercadopago.webhookSecret;
    if (!secret) return false;

    // Parse v1=<hmac> from the x-signature header
    const v1Match = signature.match(/v1=([a-f0-9]+)/);
    if (!v1Match) return false;
    const expectedHmac = v1Match[1];

    // HMAC-SHA256 of "ts.rawBody"
    const manifest = `${ts}.${rawBody}`;
    const computed = createHmac('sha256', secret).update(manifest).digest('hex');

    return computed === expectedHmac;
  }

  /**
   * Get payment status by ID
   */
  async getPayment(paymentId: string): Promise<PaymentResult> {
    const result = await this.payment.get({ id: paymentId });

    return {
      id: result.id!.toString(),
      status: result.status as PaymentResult['status'],
      status_detail: result.status_detail ?? undefined,
      payment_type_id: result.payment_type_id ?? undefined,
      transaction_amount: result.transaction_amount ?? undefined,
      currency_id: result.currency_id ?? undefined,
      external_reference: result.external_reference ?? undefined,
    };
  }

  /**
   * Process a payment (for direct checkout)
   */
  async processPayment(paymentData: {
    token: string;
    issuerId?: string;
    paymentMethodId: string;
    transactionAmount: number;
    installments: number;
    description: string;
    externalReference: string;
    payer: {
      email: string;
      identification?: {
        type: string;
        number: string;
      };
    };
  }): Promise<PaymentResult> {
    const result = await this.payment.create({
      body: {
        token: paymentData.token,
        issuer_id: paymentData.issuerId ? parseInt(paymentData.issuerId) : undefined,
        payment_method_id: paymentData.paymentMethodId,
        transaction_amount: paymentData.transactionAmount,
        installments: paymentData.installments,
        description: paymentData.description,
        external_reference: paymentData.externalReference,
        payer: paymentData.payer,
      },
    });

    return {
      id: result.id!.toString(),
      status: result.status as PaymentResult['status'],
      status_detail: result.status_detail ?? undefined,
      payment_type_id: result.payment_type_id ?? undefined,
      transaction_amount: result.transaction_amount ?? undefined,
      currency_id: result.currency_id ?? undefined,
      external_reference: result.external_reference ?? undefined,
    };
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string): Promise<{ status: string }> {
    const result = await this.paymentRefund.create({ payment_id: parseInt(paymentId) });

    return {
      status: result.status ?? 'approved',
    };
  }

  /**
   * Get payment methods available
   * Note: MercadoPago SDK v2 does not expose a list() method on PaymentMethod.
   * Use the REST API directly or return a static list of common methods.
   */
  async getPaymentMethods(): Promise<Array<{ id: string; name: string; payment_type_id: string }>> {
    // SDK v2 PaymentMethod only supports get(id), not list().
    // Return common payment methods — extend as needed.
    return [
      { id: 'visa', name: 'Visa', payment_type_id: 'credit_card' },
      { id: 'master', name: 'Mastercard', payment_type_id: 'credit_card' },
      { id: 'amex', name: 'American Express', payment_type_id: 'credit_card' },
      { id: 'pse', name: 'PSE', payment_type_id: 'bank_transfer' },
      { id: 'efecty', name: 'Efecty', payment_type_id: 'ticket' },
    ];
  }
}

export const mercadoPagoService = new MercadoPagoService();
