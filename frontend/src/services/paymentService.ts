/**
 * @fileoverview Payment Service - API client for payment operations
 * @description Service for handling PayPal and other payment methods
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
};
