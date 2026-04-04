/**
 * @fileoverview PayPal Payment Service
 * @description Handles PayPal payment operations: create order, capture, refunds
 * @module services/PayPalService
 */

import axios from 'axios';
import { config } from '../config/env.js';

const PAYPAL_API_BASE =
  config.paypal.mode === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

/**
 * Validate PayPal identifier format to prevent SSRF
 * PayPal IDs are alphanumeric (letters, digits, hyphens, underscores)
 * Validates: PayPal order IDs, capture IDs, etc.
 *
 * Valida formato de identificador PayPal para prevenir SSRF
 * @throws {Error} if the ID contains invalid characters
 */
function validatePayPalId(id: string, label: string): void {
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid ${label}: must be alphanumeric (got "${id}")`);
  }
}

interface PayPalOrder {
  id: string;
  status: 'CREATED' | 'APPROVED' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED';
  links: Array<{ href: string; rel: string }>;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        amount: {
          value: string;
          currency_code: string;
        };
      }>;
    };
  }>;
}

interface CreateOrderRequest {
  amount: number;
  currency: string;
  description: string;
  orderId?: string; // Internal order ID
  userId: string;
}

interface CaptureOrderRequest {
  orderId: string; // PayPal order ID
  internalOrderId: string; // Our internal order ID
}

class PayPalService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get OAuth token from PayPal
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const { clientId, clientSecret } = config.paypal;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    this.accessToken = response.data.access_token;
    // Expire token 5 minutes before actual expiry
    this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    return this.accessToken!;
  }

  /**
   * Create a PayPal order
   * POST /v2/checkout/orders
   */
  async createOrder(request: CreateOrderRequest): Promise<PayPalOrder> {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: request.orderId || `order_${Date.now()}`,
            description: request.description,
            amount: {
              currency_code: request.currency,
              value: request.amount.toFixed(2),
            },
            custom_id: JSON.stringify({
              userId: request.userId,
              internalOrderId: request.orderId,
            }),
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name: 'MLM Platform',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: `${config.app.frontendUrl}/checkout/success`,
              cancel_url: `${config.app.frontendUrl}/checkout/cancel`,
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Capture a PayPal order (after user approval)
   * POST /v2/checkout/orders/{orderId}/capture
   */
  async captureOrder(request: CaptureOrderRequest): Promise<PayPalOrder> {
    validatePayPalId(request.orderId, 'PayPal order ID');
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${request.orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Refund a captured payment
   * POST /v2/payments/captures/{captureId}/refund
   */
  async refundPayment(captureId: string, amount?: number, currency: string = 'USD'): Promise<void> {
    validatePayPalId(captureId, 'PayPal capture ID');
    const token = await this.getAccessToken();

    const refundData: Record<string, unknown> = {};

    if (amount) {
      refundData.amount = {
        value: amount.toFixed(2),
        currency_code: currency,
      };
    }

    await axios.post(`${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`, refundData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get order details
   * GET /v2/checkout/orders/{orderId}
   */
  async getOrder(orderId: string): Promise<PayPalOrder> {
    validatePayPalId(orderId, 'PayPal order ID');
    const token = await this.getAccessToken();

    const response = await axios.get(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }
}

export const paypalService = new PayPalService();
