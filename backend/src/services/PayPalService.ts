/**
 * @fileoverview PayPal Payment Service
 * @description Handles PayPal payment operations: create order, capture, refunds
 * @module services/PayPalService
 */

import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env.js';

const PAYPAL_API_BASE =
  config.paypal.mode === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

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
   * Validate a PayPal identifier used in URL path segments.
   * This restricts the characters and length to prevent malformed paths.
   */
  private validatePayPalId(id: string): void {
    // Allow URL-safe alpha-numeric IDs with optional dashes, up to 64 chars.
    const PAYPAL_ID_REGEX = /^[A-Za-z0-9-]{1,64}$/;
    if (!PAYPAL_ID_REGEX.test(id)) {
      throw new Error('Invalid PayPal identifier format');
    }
  }

  /**
   * In-memory idempotency cache (for production, use Redis)
   * Key: PayPal order ID, Value: timestamp
   */
  private idempotencyCache = new Map<string, number>();
  private readonly IDEMPOTENCY_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Verify PayPal webhook signature
   * @see https://developer.paypal.com/docs/api-basics/notifications/webhooks/verify-signatures/
   */
  async verifyWebhookSignature(
    headers: Record<string, string | undefined>,
    body: string
  ): Promise<boolean> {
    const { clientId } = config.paypal;
    const webhookId = config.paypal.webhookId;

    if (!webhookId) {
      console.warn('[PayPal] Webhook ID not configured, skipping verification');
      return true; // Skip verification if not configured
    }

    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const certUrl = headers['paypal-cert-url'];
    const authAlgo = headers['paypal-auth-algo'];

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      console.error('[PayPal] Missing webhook headers');
      return false;
    }

    // Validate certificate URL to prevent SSRF
    let parsedCertUrl: URL;
    try {
      parsedCertUrl = new URL(certUrl);
    } catch (err) {
      console.error('[PayPal] Invalid certificate URL format:', certUrl);
      return false;
    }

    // Only allow HTTPS URLs to PayPal domains
    const allowedHostSuffix = '.paypal.com';
    const hostname = parsedCertUrl.hostname.toLowerCase();
    if (
      parsedCertUrl.protocol !== 'https:' ||
      (!hostname.endsWith(allowedHostSuffix) && hostname !== 'paypal.com')
    ) {
      console.error('[PayPal] Certificate URL not allowed:', certUrl);
      return false;
    }

    // Download the certificate
    const certResponse = await axios.get(parsedCertUrl.toString(), { responseType: 'text' });
    const cert = certResponse.data;

    // Construct the expected signature
    const expectedSignature = Buffer.from(transmissionSig, 'base64');

    // Build the message to verify
    const message = `${transmissionId}|${transmissionTime}|${webhookId}|${crypto.createHash('sha256').update(body).digest('hex')}`;

    // Verify the signature using the certificate
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    const isValid = verify.verify(cert, expectedSignature);

    return isValid;
  }

  /**
   * Check idempotency for a PayPal order
   * Returns true if the order was already processed recently
   */
  isIdempotent(paypalOrderId: string): boolean {
    const timestamp = this.idempotencyCache.get(paypalOrderId);
    if (timestamp && Date.now() - timestamp < this.IDEMPOTENCY_TTL) {
      return true;
    }
    // Clean up old entries
    if (timestamp) {
      this.idempotencyCache.delete(paypalOrderId);
    }
    return false;
  }

  /**
   * Mark an order as processed for idempotency
   */
  markAsProcessed(paypalOrderId: string): void {
    this.idempotencyCache.set(paypalOrderId, Date.now());
  }

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
    this.validatePayPalId(request.orderId);
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
    this.validatePayPalId(captureId);
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
    this.validatePayPalId(orderId);
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
