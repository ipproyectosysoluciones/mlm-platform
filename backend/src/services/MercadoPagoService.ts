/**
 * @fileoverview MercadoPago Payment Service
 * @description Handles MercadoPago payment operations: create preference, process payment, refunds
 * @module services/MercadoPagoService
 */

import { createHmac } from 'crypto';
import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

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
  /** Fee charged by the platform in COP / Fee de la plataforma en COP */
  marketplace_fee?: number;
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
  /** Additional info from MercadoPago (items, payer, etc.) / Info adicional de MercadoPago */
  additional_info?: {
    items?: Array<{ id?: string; title?: string; quantity?: string; unit_price?: string }>;
    [key: string]: unknown;
  };
  /** Approval timestamp / Fecha de aprobación */
  date_approved?: string;
  /** Refunds applied to the payment / Reembolsos aplicados al pago */
  refunds?: Array<{
    id: number;
    amount?: number;
    status?: string;
    date_created?: string;
  }>;
}

export interface RefundOptions {
  /** Partial amount to refund (COP) / Monto parcial a reembolsar (COP) */
  amount?: number;
  /** Vendor access token / Access token del negocio */
  accessToken?: string;
}

class MercadoPagoService {
  private preference = new Preference(client);
  private payment = new Payment(client);
  private paymentRefund = new PaymentRefund(client);

  /**
   * Return a client configured with the given access token, or the platform
   * client when no token is provided.
   * Devolver un cliente con el access token dado, o el de la plataforma.
   */
  private getClient(accessToken?: string): MercadoPagoConfig {
    if (accessToken) {
      return new MercadoPagoConfig({ accessToken });
    }
    return client;
  }

  /**
   * Create a payment preference
   * @param preference - Preference payload (marketplace_fee for vendor charges)
   * @param accessToken - Vendor access token (omitted = platform account)
   * @see https://www.mercadopago.com/developers/en/docs/checkout-api/integration-configuration
   */
  async createPreference(
    preference: MercadoPagoPreference,
    accessToken?: string
  ): Promise<CreatePreferenceResult> {
    try {
      const pref = accessToken ? new Preference(this.getClient(accessToken)) : this.preference;
      const result = await pref.create({ body: preference });

      return {
        id: result.id!,
        init_point: result.init_point!,
        sandbox_init_point: result.sandbox_init_point!,
      };
    } catch (error) {
      logger.error(
        { service: 'MercadoPagoService', method: 'createPreference', error },
        'Operation failed'
      );
      throw error;
    }
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
   * Expose the MercadoPago access token for the payout gateway (money-out REST calls).
   * Exponer el access token para la pasarela de payout (money-out).
   */
  getAccessToken(): string {
    return config.mercadopago.accessToken;
  }

  /**
   * Get payment status by ID
   */
  async getPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const result = await this.payment.get({ id: paymentId });

      return {
        id: result.id!.toString(),
        status: result.status as PaymentResult['status'],
        status_detail: result.status_detail ?? undefined,
        payment_type_id: result.payment_type_id ?? undefined,
        transaction_amount: result.transaction_amount ?? undefined,
        currency_id: result.currency_id ?? undefined,
        external_reference: result.external_reference ?? undefined,
        additional_info: result.additional_info as PaymentResult['additional_info'],
        date_approved: result.date_approved ?? undefined,
        refunds: result.refunds as PaymentResult['refunds'],
      };
    } catch (error) {
      logger.error(
        { service: 'MercadoPagoService', method: 'getPayment', error },
        'Operation failed'
      );
      throw error;
    }
  }

  /**
   * Process a payment (for direct checkout)
   * @param paymentData - Payment payload (applicationFee for vendor charges)
   * @param accessToken - Vendor access token (omitted = platform account)
   */
  async processPayment(
    paymentData: {
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
      /** Fee charged by the platform in COP / Fee de la plataforma en COP */
      applicationFee?: number;
    },
    accessToken?: string
  ): Promise<PaymentResult> {
    try {
      const payment = accessToken ? new Payment(this.getClient(accessToken)) : this.payment;
      const result = await payment.create({
        body: {
          token: paymentData.token,
          issuer_id: paymentData.issuerId ? parseInt(paymentData.issuerId) : undefined,
          payment_method_id: paymentData.paymentMethodId,
          transaction_amount: paymentData.transactionAmount,
          installments: paymentData.installments,
          description: paymentData.description,
          external_reference: paymentData.externalReference,
          payer: paymentData.payer,
          ...(paymentData.applicationFee !== undefined
            ? { application_fee: paymentData.applicationFee }
            : {}),
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
        date_approved: result.date_approved ?? undefined,
        refunds: result.refunds as PaymentResult['refunds'],
      };
    } catch (error) {
      logger.error(
        { service: 'MercadoPagoService', method: 'processPayment', error },
        'Operation failed'
      );
      throw error;
    }
  }

  /**
   * Refund a payment (full or partial)
   * @param paymentId - MercadoPago payment id
   * @param options - { amount, accessToken } for partial/vendor refunds
   */
  async refundPayment(paymentId: string, options?: RefundOptions): Promise<{ status: string }> {
    try {
      const refund = options?.accessToken
        ? new PaymentRefund(this.getClient(options.accessToken))
        : this.paymentRefund;
      const result = await refund.create({
        payment_id: parseInt(paymentId),
        ...(options?.amount !== undefined ? { body: { amount: options.amount } } : {}),
      });

      return {
        status: result.status ?? 'approved',
      };
    } catch (error) {
      logger.error(
        { service: 'MercadoPagoService', method: 'refundPayment', error },
        'Operation failed'
      );
      throw error;
    }
  }

  /**
   * Get payment methods available
   * Note: MercadoPago SDK v2 does not expose a list() method on PaymentMethod.
   * Use the REST API directly or return a static list of common methods.
   */
  async getPaymentMethods(): Promise<Array<{ id: string; name: string; payment_type_id: string }>> {
    try {
      // SDK v2 PaymentMethod only supports get(id), not list().
      // Return common payment methods — extend as needed.
      return [
        { id: 'visa', name: 'Visa', payment_type_id: 'credit_card' },
        { id: 'master', name: 'Mastercard', payment_type_id: 'credit_card' },
        { id: 'amex', name: 'American Express', payment_type_id: 'credit_card' },
        { id: 'pse', name: 'PSE', payment_type_id: 'bank_transfer' },
        { id: 'efecty', name: 'Efecty', payment_type_id: 'ticket' },
      ];
    } catch (error) {
      logger.error(
        { service: 'MercadoPagoService', method: 'getPaymentMethods', error },
        'Operation failed'
      );
      throw error;
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();
