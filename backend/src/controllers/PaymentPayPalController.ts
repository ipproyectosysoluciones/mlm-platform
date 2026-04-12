/**
 * @fileoverview PayPal Payment Controller
 * @description Endpoints for PayPal payment operations
 * @module controllers/PaymentPayPalController
 */

import { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { paypalService } from '../services/PayPalService.js';
import { ResponseUtil } from '../utils/response.util.js';
import { logger } from '../utils/logger';
import { Purchase, Order, Product } from '../models/index.js';
import { CommissionService } from '../services/CommissionService.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * PayPal order ID format: alphanumeric, 17 characters
 * @see https://developer.paypal.com/docs/api/orders/v2/
 */
const PAYPAL_ORDER_ID_REGEX = /^[A-Z0-9]{17}$/;

export class PaymentPayPalController {
  /**
   * POST /api/payment/paypal/create
   * Create a new PayPal order
   */
  static createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { amount, currency = 'USD', description, orderId } = req.body;
    const userId = req.user?.id;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json(ResponseUtil.error('INVALID_AMOUNT', 'Amount must be greater than 0', 400));
    }

    const order = await paypalService.createOrder({
      amount,
      currency,
      description: description || 'Nexo Real - Compra',
      orderId,
      userId,
    });

    // Find approval URL
    const approvalLink = order.links?.find((link) => link.rel === 'approve');

    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        approvalUrl: approvalLink?.href,
      },
    });
  });

  /**
   * POST /api/payment/paypal/capture
   * Capture a PayPal order after user approval
   */
  static captureOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, internalOrderId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json(ResponseUtil.error('MISSING_ORDER_ID', 'PayPal order ID is required', 400));
    }

    // Validate orderId format to prevent SSRF (CodeQL)
    if (!PAYPAL_ORDER_ID_REGEX.test(orderId)) {
      return res
        .status(400)
        .json(ResponseUtil.error('INVALID_ORDER_ID', 'Invalid PayPal order ID format', 400));
    }

    if (!internalOrderId) {
      return res
        .status(400)
        .json(
          ResponseUtil.error('MISSING_INTERNAL_ORDER_ID', 'Internal order ID is required', 400)
        );
    }

    const capturedOrder = await paypalService.captureOrder({
      orderId,
      internalOrderId,
    });

    // Extract capture details
    const capture = capturedOrder.purchase_units?.[0]?.payments?.captures?.[0];

    return res.status(200).json({
      success: true,
      data: {
        orderId: capturedOrder.id,
        status: capturedOrder.status,
        captureId: capture?.id,
        amount: capture?.amount?.value,
        currency: capture?.amount?.currency_code,
        internalOrderId,
      },
    });
  });

  /**
   * POST /api/payment/paypal/webhook
   * Handle PayPal webhook events.
   * Processes PAYMENT.CAPTURE.COMPLETED (creates Purchase + Order + commissions)
   * and PAYMENT.CAPTURE.REFUNDED (marks Order failed + Purchase refunded).
   *
   * Maneja eventos de webhook de PayPal.
   * Procesa PAYMENT.CAPTURE.COMPLETED (crea Purchase + Order + comisiones)
   * y PAYMENT.CAPTURE.REFUNDED (marca Order como fallida + Purchase reembolsada).
   *
   * @see https://developer.paypal.com/docs/api-basics/notifications/webhooks/
   */
  static webhook = asyncHandler(async (req: Request, res: Response) => {
    const body = JSON.stringify(req.body);
    const headers = {
      'paypal-transmission-id': req.headers['paypal-transmission-id'] as string,
      'paypal-transmission-time': req.headers['paypal-transmission-time'] as string,
      'paypal-transmission-sig': req.headers['paypal-transmission-sig'] as string,
      'paypal-cert-url': req.headers['paypal-cert-url'] as string,
      'paypal-auth-algo': req.headers['paypal-auth-algo'] as string,
    };

    // Verify webhook signature
    const isValid = await paypalService.verifyWebhookSignature(headers, body);
    if (!isValid) {
      logger.error({ component: 'PayPal Webhook' }, 'Invalid signature');
      return res
        .status(403)
        .json(
          ResponseUtil.error('INVALID_SIGNATURE', 'Webhook signature verification failed', 403)
        );
    }

    const event = req.body;
    const eventId: string | undefined = event.id;

    // ── Global idempotency check (persistent via WebhookEvent table) ──
    if (eventId && (await paypalService.isEventProcessed(eventId, 'paypal'))) {
      logger.info({ component: 'PayPal Webhook', eventId }, 'Duplicate event, skipping');
      return res.status(200).json({ received: true, duplicate: true });
    }

    logger.info(
      { component: 'PayPal Webhook', eventType: event.event_type, eventId },
      'Webhook event received'
    );

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        // Order was approved by user — no action needed
        logger.info({ component: 'PayPal', eventId }, 'Order approved');
        break;

      case 'PAYMENT.CAPTURE.COMPLETED': {
        /**
         * Payment successfully captured — create Purchase + Order + commissions.
         * Follows the same pattern as the MercadoPago webhook for consistency.
         *
         * Pago capturado exitosamente — crea Purchase + Order + comisiones.
         * Sigue el mismo patrón del webhook de MercadoPago por consistencia.
         */
        try {
          const resource = event.resource;
          const captureId: string = resource?.id ?? '';
          const amount: number = parseFloat(resource?.amount?.value ?? '0');
          const currency: string = resource?.amount?.currency_code ?? 'USD';

          // Extract userId from custom_id (set during createOrder as JSON)
          let userId: string | undefined;
          let internalOrderId: string | undefined;
          const customId: string | undefined =
            resource?.custom_id ?? event.resource?.supplementary_data?.related_ids?.order_id;

          if (customId) {
            try {
              const parsed: { userId?: string; internalOrderId?: string } = JSON.parse(
                customId
              ) as { userId?: string; internalOrderId?: string };
              userId = parsed.userId;
              internalOrderId = parsed.internalOrderId;
            } catch {
              // custom_id may be a plain string (userId) — use it directly
              userId = customId;
            }
          }

          if (!userId) {
            logger.error(
              { component: 'PayPal Webhook', eventId, captureId },
              'No userId found in PayPal webhook payload (custom_id)'
            );
            break;
          }

          // ── Additional idempotency: check if Order already exists for this capture ──
          const existingOrder = await Order.findOne({
            where: { notes: `paypal:${captureId}` },
          });
          if (existingOrder) {
            logger.info(
              { component: 'PayPal Webhook', captureId },
              'Order already exists for capture — skipping'
            );
            break;
          }

          // ── Resolve productId from internalOrderId or fallback to first active product ──
          let productId: string = '';
          if (internalOrderId) {
            const existingInternalOrder = await Order.findByPk(internalOrderId);
            if (existingInternalOrder) {
              productId = existingInternalOrder.productId;
            }
          }
          if (!productId) {
            const fallbackProduct = await Product.findOne({ where: { isActive: true } });
            productId = fallbackProduct?.id ?? '';
          }

          if (!productId) {
            logger.error(
              { component: 'PayPal Webhook', eventId },
              'Could not resolve productId for payment'
            );
            break;
          }

          // ── Create Purchase record ──
          const purchase = await Purchase.create({
            userId,
            productId,
            businessType: 'producto',
            amount,
            currency,
            description: `PayPal payment ${captureId}`,
            status: 'completed',
          });

          // ── Create Order record ──
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
            paymentMethod: 'paypal',
            notes: `paypal:${captureId}`,
          });

          logger.info(
            { component: 'PayPal Webhook', captureId },
            'Purchase & Order created for payment'
          );

          // ── Trigger commission calculation (fire-and-forget, don't break 200) ──
          try {
            const commissionService = new CommissionService();
            await commissionService.calculateCommissions(purchase.id);
            logger.info(
              { component: 'PayPal Webhook', purchaseId: purchase.id },
              'Commissions calculated for purchase'
            );
          } catch (commissionError) {
            logger.error(
              { err: commissionError, component: 'PayPal Webhook' },
              'Commission calculation failed'
            );
            // Non-fatal — PayPal still gets 200
          }
        } catch (orderError) {
          logger.error(
            { err: orderError, component: 'PayPal Webhook' },
            'Error creating Purchase/Order'
          );
          // Non-fatal — PayPal must receive 200 regardless
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        /**
         * Payment was refunded — update Order to 'failed' + Purchase to 'refunded'.
         * NO commission reversal (this is a business decision).
         *
         * Pago reembolsado — actualiza Order a 'failed' + Purchase a 'refunded'.
         * NO se revierten comisiones (decisión de negocio).
         */
        try {
          const resource = event.resource;
          const refundId: string = resource?.id ?? '';

          // The refund resource links back to the original capture via links
          // Find the original capture ID from the refund payload
          const captureLink = resource?.links?.find(
            (link: { rel: string; href: string }) => link.rel === 'up'
          );
          const captureId: string | undefined = captureLink?.href?.split('/').pop();

          if (!captureId) {
            logger.error(
              { component: 'PayPal Webhook', refundId },
              'Could not extract original capture ID from refund event'
            );
            break;
          }

          // Find the original Order by notes pattern
          const originalOrder = await Order.findOne({
            where: { notes: `paypal:${captureId}` },
          });

          if (!originalOrder) {
            logger.warn(
              { component: 'PayPal Webhook', captureId },
              'Original order not found for refund — may not have been processed by us'
            );
            break;
          }

          // Update Order status to 'failed' (no 'refunded' in Order ENUM)
          originalOrder.status = 'failed';
          await originalOrder.save();

          // Update related Purchase status to 'refunded'
          if (originalOrder.purchaseId) {
            const purchase = await Purchase.findByPk(originalOrder.purchaseId);
            if (purchase) {
              purchase.status = 'refunded';
              await purchase.save();
            }
          }

          logger.info(
            { component: 'PayPal Webhook', captureId, refundId, orderId: originalOrder.id },
            'Order marked as failed and Purchase as refunded'
          );
        } catch (refundError) {
          logger.error(
            { err: refundError, component: 'PayPal Webhook' },
            'Error processing refund'
          );
          // Non-fatal — PayPal must receive 200 regardless
        }
        break;
      }

      default:
        logger.info({ component: 'PayPal', eventType: event.event_type }, 'Unhandled event');
    }

    // Mark as processed for idempotency (persistent)
    if (eventId) {
      await paypalService.markEventProcessed(eventId, 'paypal', event.event_type ?? 'unknown');
    }

    return res.status(200).json({ received: true });
  });

  /**
   * GET /api/payment/paypal/:orderId
   * Get PayPal order status
   */
  static getOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    if (!orderId) {
      return res
        .status(400)
        .json(ResponseUtil.error('MISSING_ORDER_ID', 'Order ID is required', 400));
    }

    // Validate orderId format to prevent SSRF (CodeQL)
    if (!PAYPAL_ORDER_ID_REGEX.test(orderId)) {
      return res
        .status(400)
        .json(ResponseUtil.error('INVALID_ORDER_ID', 'Invalid PayPal order ID format', 400));
    }

    const order = await paypalService.getOrder(orderId);

    return res.status(200).json({
      success: true,
      data: order,
    });
  });
}
