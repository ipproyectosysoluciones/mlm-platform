/**
 * @fileoverview MercadoPago Payment Controller
 * @description Endpoints for MercadoPago payment operations
 * @module controllers/PaymentMercadoPagoController
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { mercadoPagoService } from '../services/MercadoPagoService.js';
import { ResponseUtil } from '../utils/response.util.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger';
import { Purchase, Order, Product } from '../models/index.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { CommissionService } from '../services/CommissionService.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * Request with raw body for webhook signature verification.
 * Request con body crudo para verificación de firma de webhook.
 */
interface RequestWithRawBody extends Request {
  rawBody?: Buffer | string;
}

/**
 * Shape of an item received from the frontend in the create-preference payload.
 * Forma de un item recibido del frontend en el payload de create-preference.
 */
interface PreferenceItemInput {
  id?: string;
  productId?: string;
  title?: string;
  name?: string;
  description?: string;
  quantity?: number;
  currency_id?: string;
  unit_price?: string | number;
  price?: string | number;
}

export class PaymentMercadoPagoController {
  /**
   * POST /api/payment/mercadopago/create-preference
   * Create a MercadoPago payment preference
   */
  static createPreference = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { items, externalReference, description } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(ResponseUtil.error('INVALID_ITEMS', 'Items are required', 400));
    }

    const preference = await mercadoPagoService.createPreference({
      items: items.map((item: PreferenceItemInput) => ({
        id: item.id || item.productId,
        title: item.title || item.name,
        description: item.description || description || 'Nexo Real - Compra',
        quantity: item.quantity || 1,
        currency_id: item.currency_id || 'COP',
        unit_price: parseFloat(item.unit_price || item.price),
      })),
      payer: {
        email: userEmail,
      },
      external_reference: externalReference || userId,
      notification_url: `${config.app.url}/api/payment/mercadopago/webhook`,
      back_urls: {
        success: `${config.app.frontendUrl}/orders/success`,
        pending: `${config.app.frontendUrl}/orders/pending`,
        failure: `${config.app.frontendUrl}/checkout`,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      },
    });
  });

  /**
   * POST /api/payment/mercadopago/process
   * Process a direct payment with card token
   */
  static processPayment = asyncHandler(async (req: Request, res: Response) => {
    const {
      token,
      issuerId,
      paymentMethodId,
      transactionAmount,
      installments,
      description,
      externalReference,
      payer,
    } = req.body;

    if (!token || !paymentMethodId || !transactionAmount || !payer?.email) {
      return res
        .status(400)
        .json(
          ResponseUtil.error(
            'MISSING_FIELDS',
            'Token, paymentMethodId, transactionAmount and payer email are required',
            400
          )
        );
    }

    const result = await mercadoPagoService.processPayment({
      token,
      issuerId,
      paymentMethodId,
      transactionAmount,
      installments: installments || 1,
      description: description || 'Nexo Real - Compra',
      externalReference: externalReference || '',
      payer: {
        email: payer.email,
        identification: payer.identification,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        paymentId: result.id,
        status: result.status,
        statusDetail: result.status_detail,
        paymentType: result.payment_type_id,
        transactionAmount: result.transaction_amount,
        currency: result.currency_id,
      },
    });
  });

  /**
   * GET /api/payment/mercadopago/payment/:paymentId
   * Get payment status by ID
   */
  static getPayment = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res
        .status(400)
        .json(ResponseUtil.error('MISSING_PAYMENT_ID', 'Payment ID is required', 400));
    }

    const payment = await mercadoPagoService.getPayment(paymentId);

    return res.status(200).json({
      success: true,
      data: payment,
    });
  });

  /**
   * GET /api/payment/mercadopago/payment-methods
   * Get available payment methods
   */
  static getPaymentMethods = asyncHandler(async (_req: Request, res: Response) => {
    const methods = await mercadoPagoService.getPaymentMethods();

    return res.status(200).json({
      success: true,
      data: methods,
    });
  });

  /**
   * POST /api/payment/mercadopago/webhook
   * Handle MercadoPago webhook notifications
   */
  static webhook = asyncHandler(async (req: Request, res: Response) => {
    const topic = req.query.topic || req.body.topic;
    const action = req.body.action;

    // ─── TODO 2.1: Signature verification ────────────────────────────────────
    const webhookSecret = config.mercadopago.webhookSecret;
    if (webhookSecret) {
      const xSignature = req.headers['x-signature'] as string | undefined;
      const tsMatch = xSignature?.match(/ts=([^,]+)/);
      const ts = tsMatch ? tsMatch[1] : '';

      // rawBody must be a string; express.raw() or express.json() with verify can provide it
      const rawBody: string =
        (req as RequestWithRawBody).rawBody?.toString() ||
        (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

      if (
        !xSignature ||
        !ts ||
        !mercadoPagoService.verifyWebhookSignature(ts, rawBody, xSignature)
      ) {
        logger.warn({ component: 'MercadoPago Webhook' }, 'Invalid signature — rejecting request');
        return res
          .status(401)
          .json(ResponseUtil.error('INVALID_SIGNATURE', 'Invalid webhook signature', 401));
      }
    } else {
      logger.warn(
        { component: 'MercadoPago Webhook' },
        'MERCADOPAGO_WEBHOOK_SECRET not configured — skipping signature verification (dev mode)'
      );
    }

    // ─── TODO 2.2: Handle payment notification ───────────────────────────────
    // Support both IPN (topic=payment) and Webhooks API (action=payment.updated)
    const isPaymentNotification =
      topic === 'payment' || (action === 'payment.updated' && req.body.data?.id);

    if (isPaymentNotification) {
      const paymentId = req.body.id || req.body.data?.id;

      if (paymentId) {
        try {
          const payment = await mercadoPagoService.getPayment(paymentId.toString());
          logger.info(
            { component: 'MercadoPago Webhook', paymentId: payment.id, status: payment.status },
            'Payment received'
          );

          switch (payment.status) {
            case 'approved': {
              logger.info({ component: 'MercadoPago', paymentId: payment.id }, 'Payment approved');

              try {
                // ── Step 1: Extract buyer info from external_reference (= userId) ──
                const userId = payment.external_reference;
                if (!userId) {
                  logger.error(
                    { component: 'MercadoPago Webhook', paymentId: payment.id },
                    'No external_reference (userId) in payment'
                  );
                  break;
                }

                // ── Step 2: Idempotency check — skip if WebhookEvent already exists for this MP payment ──
                const existingEvent = await WebhookEvent.findOne({
                  where: { eventId: String(payment.id), provider: 'mercadopago' },
                });
                if (existingEvent) {
                  logger.info(
                    { component: 'MercadoPago Webhook', paymentId: payment.id },
                    'WebhookEvent already exists for payment — skipping'
                  );
                  break;
                }

                // ── Step 3: Resolve productId from payment items or fallback to first active product ──
                const itemProductId: string | undefined = payment.additional_info?.items?.[0]?.id;

                let productId: string;
                if (itemProductId) {
                  const foundProduct = await Product.findByPk(itemProductId);
                  productId = foundProduct ? foundProduct.id : '';
                } else {
                  const fallbackProduct = await Product.findOne({ where: { isActive: true } });
                  productId = fallbackProduct?.id ?? '';
                }

                if (!productId) {
                  logger.error(
                    { component: 'MercadoPago Webhook', paymentId: payment.id },
                    'Could not resolve productId for payment'
                  );
                  break;
                }

                const amount = payment.transaction_amount ?? 0;
                const currency = payment.currency_id ?? 'COP';

                // ── Step 4: Create Purchase record ──
                const purchase = await Purchase.create({
                  userId,
                  productId,
                  businessType: 'producto',
                  amount,
                  currency,
                  description: `MercadoPago payment ${payment.id}`,
                  status: 'completed',
                });

                // ── Step 5: Create Order record ──
                const orderNumber =
                  'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

                await Order.create({
                  orderNumber,
                  userId,
                  productId,
                  purchaseId: purchase.id,
                  totalAmount: amount,
                  currency,
                  status: 'completed',
                  paymentMethod: 'mercadopago',
                  notes: `mercadopago:${payment.id}`,
                });

                logger.info(
                  { component: 'MercadoPago Webhook', paymentId: payment.id },
                  'Purchase & Order created for payment'
                );

                // ── Step 6: Trigger commission calculation (fire-and-forget, don't break 200) ──
                try {
                  const commissionService = new CommissionService();
                  await commissionService.calculateCommissions(purchase.id);
                  logger.info(
                    { component: 'MercadoPago Webhook', purchaseId: purchase.id },
                    'Commissions calculated for purchase'
                  );
                } catch (commissionError) {
                  logger.error(
                    { err: commissionError, component: 'MercadoPago Webhook' },
                    'Commission calculation failed'
                  );
                  // Non-fatal — MP still gets 200
                }

                // ── Step 7: Mark event as processed in WebhookEvent table (persistent idempotency) ──
                await WebhookEvent.create({
                  eventId: String(payment.id),
                  provider: 'mercadopago',
                  eventType: 'payment.approved',
                  processedAt: new Date(),
                });
              } catch (orderError) {
                logger.error(
                  { err: orderError, component: 'MercadoPago Webhook' },
                  'Error creating Purchase/Order'
                );
                // Non-fatal — MP must receive 200 regardless
              }

              break;
            }
            case 'pending':
              logger.info({ component: 'MercadoPago', paymentId: payment.id }, 'Payment pending');
              break;
            case 'rejected':
              logger.info({ component: 'MercadoPago', paymentId: payment.id }, 'Payment rejected');
              break;
            case 'cancelled':
              logger.info({ component: 'MercadoPago', paymentId: payment.id }, 'Payment cancelled');
              break;
            default:
              logger.info({ component: 'MercadoPago', status: payment.status }, 'Unknown status');
          }
        } catch (error) {
          logger.error(
            { err: error, component: 'MercadoPago Webhook' },
            'Error processing payment'
          );
        }
      }
    }

    // Return 200 to acknowledge receipt (MercadoPago requires this regardless of processing)
    return res.status(200).json({ received: true });
  });
}
