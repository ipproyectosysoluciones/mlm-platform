/**
 * @fileoverview Payment Service - API client for payment operations
 * @description Service for handling PayPal, MercadoPago, and other payment methods
 * @module services/paymentService
 */

import api from './api';

export interface CreatePayPalOrderRequest {
  amount: number;
  currency?: string;
  description?: string;
  orderId?: string;
}

export interface CompletePayPalRequest {
  orderId: string;
  details?: unknown;
}

export interface PayPalOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    status: string;
    approvalUrl?: string;
  };
}

export interface CaptureOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    status: string;
    captureId?: string;
    amount?: string;
    currency?: string;
    internalOrderId?: string;
  };
}

// ──────────────────────────────────────────────
// MercadoPago Types
// ──────────────────────────────────────────────

/**
 * A single item in a MercadoPago preference
 */
export interface MPItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

/**
 * Payer data for MercadoPago preference creation
 */
export interface MPPayer {
  email?: string;
  name?: string;
}

/**
 * Response from POST /api/payment/mercadopago/create-preference
 */
export interface MPPreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

// ──────────────────────────────────────────────
// PayPal Types
// ──────────────────────────────────────────────

export const paymentService = {
  /**
   * Create PayPal order
   * POST /api/payment/paypal/create
   */
  createPayPalOrder: async (data: CreatePayPalOrderRequest): Promise<PayPalOrderResponse> => {
    const response = await api.post('/payment/paypal/create', data);
    return response.data;
  },

  /**
   * Complete order with PayPal capture
   * POST /api/payment/paypal/capture
   */
  completeWithPayPal: async (data: CompletePayPalRequest): Promise<CaptureOrderResponse> => {
    const response = await api.post('/payment/paypal/capture', data);
    return response.data;
  },

  /**
   * Get PayPal order status
   * GET /api/payment/paypal/:orderId
   */
  getPayPalOrder: async (orderId: string) => {
    const response = await api.get(`/payment/paypal/${orderId}`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // MercadoPago Methods
  // ──────────────────────────────────────────────

  /**
   * Create a MercadoPago Checkout Pro preference
   * POST /api/payment/mercadopago/create-preference
   * Returns init_point URL to redirect the user to MP's hosted checkout
   */
  createMercadoPagoPreference: async (
    items: MPItem[],
    payer?: MPPayer,
    externalReference?: string
  ): Promise<MPPreferenceResponse> => {
    const response = await api.post('/payment/mercadopago/create-preference', {
      items,
      payer,
      externalReference,
    });
    return response.data;
  },

  /**
   * Redirect the browser to MercadoPago Checkout Pro
   * Uses sandbox URL in development / VITE_MP_SANDBOX=true, prod URL otherwise
   */
  redirectToMercadoPago: (initPoint: string): void => {
    window.location.href = initPoint;
  },
};
