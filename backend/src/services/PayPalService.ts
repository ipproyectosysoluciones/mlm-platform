/**
 * @fileoverview PayPal Payment Service
 * @description Handles PayPal payment operations: create order, capture, refunds
 * @module services/PayPalService
 */

import axios from 'axios';
import { config } from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import type { WebhookProvider } from '../models/WebhookEvent.js';

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

class PayPalService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

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
   *
   * Obtiene detalles de una orden de PayPal.
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

  // ── Webhook signature verification ──────────────────────────────────────────

  /**
   * Verify PayPal webhook signature using the PayPal Notifications API.
   * In dev mode (no PAYPAL_WEBHOOK_ID configured) always returns true.
   *
   * Verifica la firma del webhook de PayPal usando la API de Notificaciones.
   * En modo dev (sin PAYPAL_WEBHOOK_ID configurado) retorna true directamente.
   *
   * @param headers - HTTP headers from the incoming webhook request
   * @param rawBody - Raw JSON string body of the webhook event
   * @returns true if signature is valid (or dev mode bypass), false otherwise
   */
  async verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    // Dev mode bypass: if no webhook ID is configured, skip verification
    if (!config.paypal.webhookId) {
      return true;
    }

    try {
      const token = await this.getAccessToken();
      const verifyUrl = `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`;

      const payload = {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: config.paypal.webhookId,
        webhook_event: JSON.parse(rawBody) as unknown,
      };

      const response = await axios.post<{ verification_status: string }>(verifyUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.verification_status === 'SUCCESS';
    } catch {
      return false;
    }
  }

  // ── Idempotency guard (persistent via WebhookEvent table) ─────────────────

  /**
   * Check whether a webhook event has already been processed.
   * Uses the WebhookEvent table for persistent, crash-safe idempotency
   * (replaces the previous in-memory Set).
   *
   * Verifica si un evento de webhook ya fue procesado.
   * Usa la tabla WebhookEvent para idempotencia persistente (reemplaza
   * el Set en memoria anterior).
   *
   * @param eventId  - Provider-assigned event ID (e.g. PayPal event.id)
   * @param provider - Payment provider name
   * @returns true if the event was already processed
   *
   * ES: Retorna true si el evento ya fue procesado anteriormente.
   * EN: Returns true if the event was already processed.
   */
  async isEventProcessed(eventId: string, provider: WebhookProvider): Promise<boolean> {
    const existing = await WebhookEvent.findOne({
      where: { eventId, provider },
    });
    return existing !== null;
  }

  /**
   * Mark a webhook event as processed by inserting it into the WebhookEvent table.
   * The composite unique index (event_id, provider) prevents double-inserts.
   *
   * Marca un evento de webhook como procesado insertándolo en la tabla WebhookEvent.
   * El índice único compuesto (event_id, provider) previene doble inserción.
   *
   * @param eventId   - Provider-assigned event ID
   * @param provider  - Payment provider name
   * @param eventType - Event type string (e.g. "PAYMENT.CAPTURE.COMPLETED")
   *
   * ES: Inserta el evento en la tabla de idempotencia.
   * EN: Inserts the event into the idempotency table.
   */
  async markEventProcessed(
    eventId: string,
    provider: WebhookProvider,
    eventType: string
  ): Promise<void> {
    await WebhookEvent.create({
      eventId,
      provider,
      eventType,
      processedAt: new Date(),
    });
  }
}

export const paypalService = new PayPalService();
