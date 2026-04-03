/**
 * @fileoverview MercadoPago Payment Service
 * @description Handles MercadoPago payment operations: create preference, process payment, refunds
 * @module services/MercadoPagoService
 */

import MercadoPago from 'mercadopago';
import { config } from '../config/env.js';

// Configure MercadoPago SDK
MercadoPago.configure({
  access_token: config.mercadopago.accessToken,
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
  /**
   * Create a payment preference
   * @see https://www.mercadopago.com/developers/en/docs/checkout-api/integration-configuration
   */
  async createPreference(preference: MercadoPagoPreference): Promise<CreatePreferenceResult> {
    const result = await MercadoPago.preferences.create(preference);

    return {
      id: result.body.id,
      init_point: result.body.init_point,
      sandbox_init_point: result.body.sandbox_init_point,
    };
  }

  /**
   * Get payment status by ID
   */
  async getPayment(paymentId: string): Promise<PaymentResult> {
    const result = await MercadoPago.payment.findById(paymentId);

    return {
      id: result.body.id.toString(),
      status: result.body.status as PaymentResult['status'],
      status_detail: result.body.status_detail,
      payment_type_id: result.body.payment_type_id,
      transaction_amount: result.body.transaction_amount,
      currency_id: result.body.currency_id,
      external_reference: result.body.external_reference,
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
    const result = await MercadoPago.payment.save({
      token: paymentData.token,
      issuer_id: paymentData.issuerId,
      payment_method_id: paymentData.paymentMethodId,
      transaction_amount: paymentData.transactionAmount,
      installments: paymentData.installments,
      description: paymentData.description,
      external_reference: paymentData.externalReference,
      payer: paymentData.payer,
    });

    return {
      id: result.body.id.toString(),
      status: result.body.status as PaymentResult['status'],
      status_detail: result.body.status_detail,
      payment_type_id: result.body.payment_type_id,
      transaction_amount: result.body.transaction_amount,
      currency_id: result.body.currency_id,
      external_reference: result.body.external_reference,
    };
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string): Promise<{ status: string }> {
    const result = await MercadoPago.refund.save({
      payment_id: paymentId,
    });

    return {
      status: result.body.status,
    };
  }

  /**
   * Get payment methods available
   */
  async getPaymentMethods(): Promise<Array<{ id: string; name: string; payment_type_id: string }>> {
    const result = await MercadoPago.paymentMethods.list();

    return result.body.map((method: { id: string; name: string; payment_type_id: string }) => ({
      id: method.id,
      name: method.name,
      payment_type_id: method.payment_type_id,
    }));
  }
}

export const mercadoPagoService = new MercadoPagoService();
