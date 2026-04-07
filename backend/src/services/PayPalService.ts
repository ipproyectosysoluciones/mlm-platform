/**
 * @fileoverview PayPal Payment Service
 * @description Handles PayPal payment operations: create order, capture, refunds
 * @module services/PayPalService
 */

import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * CRC32 implementation required by PayPal webhook signature spec.
 * PayPal uses CRC32 of the raw body, not SHA256.
 */
function crc32(data: string): number {
  let crc = 0xffffffff;
  const buf = Buffer.from(data, 'utf8');
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

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
 * @throws {AppError} if the ID contains invalid characters
 */
function validatePayPalId(id: string, label: string): void {
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new AppError(
      400,
      'INVALID_PAYPAL_ID',
      `Invalid ${label}: must be alphanumeric (got "${id}")`
    );
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

/** Headers sent by PayPal on every webhook call */
interface PayPalWebhookHeaders {
  'paypal-transmission-id': string;
  'paypal-transmission-time': string;
  'paypal-transmission-sig': string;
  'paypal-cert-url': string;
  'paypal-auth-algo': string;
}

class PayPalService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /** In-memory idempotency set — prevents double-processing the same event */
  private processedEvents = new Set<string>();

  /**
   * Verify PayPal webhook signature using PayPal's verify API.
   * Verifica la firma del webhook de PayPal usando la API de verificación de PayPal.
   *
   * @see https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
   * @param headers - PayPal webhook headers
   * @param rawBody - Raw request body string
   * @returns true if signature is valid
   */
  async verifyWebhookSignature(headers: PayPalWebhookHeaders, rawBody: string): Promise<boolean> {
    const webhookId = config.paypal.webhookId;
    if (!webhookId) {
      console.warn('[PayPal] PAYPAL_WEBHOOK_ID not configured — skipping signature verification');
      return true; // dev mode
    }

    try {
      const token = await this.getAccessToken();
      const verifyUrl = new URL('/v1/notifications/verify-webhook-signature', PAYPAL_API_BASE);

      const response = await axios.post(
        verifyUrl.toString(),
        {
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: JSON.parse(rawBody),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data?.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('[PayPal] Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Check if an event has already been processed (idempotency).
   * Verifica si un evento ya fue procesado (idempotencia).
   *
   * @param eventId - PayPal resource ID or event ID
   * @returns true if already processed (duplicate)
   */
  isIdempotent(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Mark an event as processed to prevent duplicate handling.
   * Marca un evento como procesado para evitar procesamiento duplicado.
   *
   * @param eventId - PayPal resource ID or event ID
   */
  markAsProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
    // Keep set bounded — remove oldest entries if it grows too large
    if (this.processedEvents.size > 10_000) {
      const first = this.processedEvents.values().next().value;
      if (first) this.processedEvents.delete(first);
    }
  }

  /**
   * Build a safe PayPal API URL using the URL constructor.
   * Each path segment is validated individually (alphanumeric + hyphen + underscore only)
   * to prevent SSRF via path traversal or injection.
   *
   * Construye una URL segura de la API de PayPal usando el constructor URL.
   * @throws {AppError} if any segment contains invalid characters
   */
  private buildPayPalUrl(...segments: string[]): string {
    const base = new URL(PAYPAL_API_BASE);
    for (const segment of segments) {
      if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
        throw new AppError(400, 'INVALID_PAYPAL_ID', `Invalid PayPal identifier: ${segment}`);
      }
    }
    base.pathname = ['', ...base.pathname.split('/').filter(Boolean), ...segments].join('/');
    return base.toString();
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

    const tokenUrl = new URL('/v1/oauth2/token', PAYPAL_API_BASE);
    const response = await axios.post(tokenUrl.toString(), 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

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

    const createOrderUrl = new URL('/v2/checkout/orders', PAYPAL_API_BASE);
    const response = await axios.post(
      createOrderUrl.toString(),
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
              brand_name: 'Nexo Real',
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

    const captureUrl = this.buildPayPalUrl('v2', 'checkout', 'orders', request.orderId, 'capture');
    const response = await axios.post(
      captureUrl,
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

    const refundUrl = this.buildPayPalUrl('v2', 'payments', 'captures', captureId, 'refund');
    await axios.post(refundUrl, refundData, {
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

    const orderUrl = this.buildPayPalUrl('v2', 'checkout', 'orders', orderId);
    const response = await axios.get(orderUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }
}

export const paypalService = new PayPalService();
