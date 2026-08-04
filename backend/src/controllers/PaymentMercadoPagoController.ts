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
import { logger } from '../utils/logger.js';
import { Purchase, Order, Product, Reservation, Vendor } from '../models/index.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { CommissionService } from '../services/CommissionService.js';
import {
  marketplaceSplitService,
  RESERVATION_REF_PREFIX,
} from '../services/MarketplaceSplitService.js';
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
    const { items, externalReference, description, vendorId, reservationId } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(ResponseUtil.error('INVALID_ITEMS', 'Items are required', 400));
    }

    // Resolve the vendor for the charge (B3 / SPLIT-1 / RC-1):
    // - explicit vendorId (product flow)
    // - reservationId → reservation's vendor (reservation flow)
    let resolvedVendorId: string | null = vendorId ?? null;
    if (reservationId) {
      const reservation = await Reservation.findByPk(reservationId);
      if (!reservation) {
        return res
          .status(404)
          .json(ResponseUtil.error('RESERVATION_NOT_FOUND', 'Reservation not found', 404));
      }
      if (reservation.userId !== userId) {
        return res
          .status(403)
          .json(ResponseUtil.error('FORBIDDEN', 'Reservation does not belong to the user', 403));
      }
      resolvedVendorId = reservation.vendorId ?? null;
    }

    const externalRef = reservationId
      ? `reservation:${reservationId}`
      : externalReference || userId;

    // Marketplace split (SPLIT-1/SPLIT-2): business token + marketplace_fee + metadata.
    // Without a vendor (or flag OFF) → previous behavior: platform client, no fee.
    let accessToken: string | undefined;
    let marketplaceFee: number | undefined;
    let metadata: Record<string, string> | undefined;
    if (resolvedVendorId && config.marketplace.enabled) {
      try {
        accessToken = await marketplaceSplitService.resolveToken(resolvedVendorId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('CONNECT_MP_REQUIRED')) {
          return res
            .status(400)
            .json(ResponseUtil.error('CONNECT_MP_REQUIRED', error.message, 400));
        }
        throw error;
      }

      const vendor = await Vendor.findByPk(resolvedVendorId);
      if (!vendor) {
        return res
          .status(404)
          .json(ResponseUtil.error('VENDOR_NOT_FOUND', 'Vendor not found', 404));
      }

      const base = items.reduce(
        (sum: number, item: PreferenceItemInput) =>
          sum + parseFloat(String(item.unit_price ?? item.price ?? '0')) * (item.quantity || 1),
        0
      );
      const breakdown = marketplaceSplitService.createFeeBreakdown(
        base,
        vendor,
        config.marketplace.country,
        externalRef
      );
      marketplaceFee = breakdown.fee;
      metadata = { vendorId: resolvedVendorId, country: config.marketplace.country };
    }

    const preference = await mercadoPagoService.createPreference(
      {
        items: items.map((item: PreferenceItemInput) => ({
          id: item.id ?? item.productId ?? '',
          title: item.title ?? item.name ?? '',
          description: item.description || description || 'Nexo Real - Compra',
          quantity: item.quantity || 1,
          currency_id: item.currency_id || 'COP',
          unit_price: parseFloat(String(item.unit_price ?? item.price ?? '0')),
        })),
        payer: {
          email: userEmail,
        },
        external_reference: externalRef,
        notification_url: `${config.app.url}/api/payment/mercadopago/webhook`,
        back_urls: {
          success: `${config.app.frontendUrl}/orders/success`,
          pending: `${config.app.frontendUrl}/orders/pending`,
          failure: `${config.app.frontendUrl}/checkout`,
        },
        ...(marketplaceFee !== undefined ? { marketplace_fee: marketplaceFee } : {}),
        ...(metadata ? { metadata } : {}),
      },
      accessToken
    );

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
   * POST /api/payment/mercadopago/refund
   * Refund a vendor payment (full or partial) within the 180-day window.
   * Triggers the MercadoPago refund; the ledger reversal (feeRefunded,
   * VendorOrder cancelled, Reservation refunded) is applied by the webhook.
   */
  static refund = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { paymentId, amount } = req.body;

    if (!paymentId) {
      return res
        .status(400)
        .json(ResponseUtil.error('MISSING_PAYMENT_ID', 'Payment ID is required', 400));
    }

    try {
      const result = await marketplaceSplitService.refundPayment(String(paymentId), {
        ...(amount !== undefined ? { amount } : {}),
      });

      return res.status(200).json({
        success: true,
        data: {
          status: result.status,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('REFUND_PERIOD_EXPIRED')) {
        return res
          .status(400)
          .json(ResponseUtil.error('REFUND_PERIOD_EXPIRED', error.message, 400));
      }
      if (error instanceof Error && error.message.includes('CONNECT_MP_REQUIRED')) {
        return res.status(400).json(ResponseUtil.error('CONNECT_MP_REQUIRED', error.message, 400));
      }
      if (error instanceof Error && error.message.includes('ORDER_NOT_FOUND')) {
        return res.status(404).json(ResponseUtil.error('ORDER_NOT_FOUND', error.message, 404));
      }
      throw error;
    }
  });

  /**
   * POST /api/payment/mercadopago/webhook
   * Handle MercadoPago webhook notifications
   */
  static webhook = asyncHandler(async (req: Request, res: Response) => {
    const topic = req.query.topic || req.body.topic;
    const action = req.body.action;

    // ─── Signature verification ─────────────────────────────────────────────
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

    // ─── Handle payment notification ────────────────────────────────────────
    // Supports both IPN (topic=payment) and Webhooks API (action=payment.updated)
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
                const externalReference = payment.external_reference ?? '';
                const isReservationPayment = externalReference.startsWith(RESERVATION_REF_PREFIX);

                // ── Reservation flow (B4 / RC-2..3 / BE-6): split-payment charging ──
                // Resolves the reservation from external_reference, marks it paid,
                // persists Order + VendorOrder with the fee breakdown (idempotent).
                if (isReservationPayment) {
                  if (!config.marketplace.enabled) {
                    // NFR-4: marketplace flow is behind the flag — never act when OFF
                    logger.warn(
                      { component: 'MercadoPago Webhook', paymentId: payment.id },
                      'Reservation payment received with marketplace flag OFF — skipping'
                    );
                    break;
                  }

                  await marketplaceSplitService.handleApprovedReservation(payment);
                  await WebhookEvent.create({
                    eventId: String(payment.id),
                    provider: 'mercadopago',
                    eventType: 'payment.approved.reservation',
                    processedAt: new Date(),
                  });
                  logger.info(
                    { component: 'MercadoPago Webhook', paymentId: payment.id },
                    'Reservation approved — Order + VendorOrder created with split'
                  );
                  break;
                }

                // ── Step 1: Extract buyer info from external_reference (= userId) ──
                const userId = externalReference;
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
                  purchaseId: purchase.id ?? null,
                  totalAmount: amount,
                  currency,
                  status: 'completed',
                  paymentMethod: 'mercadopago',
                  notes: `mercadopago:${payment.id}`,
                  shippingAddressId: null,
                  shippingCost: null,
                  shippingStatus: 'not_required',
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
            case 'refunded': {
              // B4 / BE-6 / SPLIT-6 / D9: proportional commission+tax reversal per refund.
              // Idempotency key `${paymentId}:${refundId}` (WebhookEvent).
              logger.info({ component: 'MercadoPago', paymentId: payment.id }, 'Payment refunded');

              if (!config.marketplace.enabled) {
                // NFR-4: marketplace flow is behind the flag — never act when OFF
                logger.warn(
                  { component: 'MercadoPago Webhook', paymentId: payment.id },
                  'Refund received with marketplace flag OFF — skipping'
                );
                break;
              }

              for (const refund of payment.refunds ?? []) {
                const eventId = `${payment.id}:${refund.id}`;
                const existingRefund = await WebhookEvent.findOne({
                  where: { eventId, provider: 'mercadopago' },
                });
                if (existingRefund) {
                  logger.info(
                    {
                      component: 'MercadoPago Webhook',
                      paymentId: payment.id,
                      refundId: refund.id,
                    },
                    'Refund already processed — skipping'
                  );
                  continue;
                }

                await marketplaceSplitService.handleRefund(payment, refund.id);
                await WebhookEvent.create({
                  eventId,
                  provider: 'mercadopago',
                  eventType: 'payment.refunded',
                  processedAt: new Date(),
                });
                logger.info(
                  { component: 'MercadoPago Webhook', paymentId: payment.id, refundId: refund.id },
                  'Refund processed — fee reversed proportionally'
                );
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
