/**
 * @fileoverview PayPal Payment Controller
 * @description Endpoints for PayPal payment operations
 * @module controllers/PaymentPayPalController
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { paypalService } from '../services/PayPalService.js';
import { ApiResponse } from '../utils/response.util.js';

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
  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const { amount, currency = 'USD', description, orderId } = req.body;
    const userId = (req as any).user?.id;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json(ApiResponse.error('INVALID_AMOUNT', 'Amount must be greater than 0', 400));
    }

    const order = await paypalService.createOrder({
      amount,
      currency,
      description: description || 'MLM Platform Purchase',
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
        .json(ApiResponse.error('MISSING_ORDER_ID', 'PayPal order ID is required', 400));
    }

    // Validate orderId format to prevent SSRF (CodeQL)
    if (!PAYPAL_ORDER_ID_REGEX.test(orderId)) {
      return res
        .status(400)
        .json(ApiResponse.error('INVALID_ORDER_ID', 'Invalid PayPal order ID format', 400));
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
   * Handle PayPal webhook events
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
      console.error('[PayPal Webhook] Invalid signature');
      return res
        .status(403)
        .json(ApiResponse.error('INVALID_SIGNATURE', 'Webhook signature verification failed', 403));
    }

    const event = req.body;

    // Check idempotency
    if (paypalService.isIdempotent(event.resource?.id)) {
      console.log('[PayPal Webhook] Duplicate event, skipping:', event.resource?.id);
      return res.status(200).json({ received: true, duplicate: true });
    }

    console.log('[PayPal Webhook]', event.event_type, event.resource?.id);

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        // Order was approved by user
        console.log('[PayPal] Order approved:', event.resource?.id);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment successfully captured
        console.log('[PayPal] Payment completed:', event.resource?.id);
        // TODO: Trigger commission calculation
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        // Payment was refunded
        console.log('[PayPal] Payment refunded:', event.resource?.id);
        // TODO: Reverse commissions if applicable
        break;

      default:
        console.log('[PayPal] Unhandled event:', event.event_type);
    }

    // Mark as processed for idempotency
    if (event.resource?.id) {
      paypalService.markAsProcessed(event.resource.id);
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
        .json(ApiResponse.error('MISSING_ORDER_ID', 'Order ID is required', 400));
    }

    // Validate orderId format to prevent SSRF (CodeQL)
    if (!PAYPAL_ORDER_ID_REGEX.test(orderId)) {
      return res
        .status(400)
        .json(ApiResponse.error('INVALID_ORDER_ID', 'Invalid PayPal order ID format', 400));
    }

    const order = await paypalService.getOrder(orderId);

    return res.status(200).json({
      success: true,
      data: order,
    });
  });
}
