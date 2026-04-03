/**
 * @fileoverview MercadoPago Payment Controller
 * @description Endpoints for MercadoPago payment operations
 * @module controllers/PaymentMercadoPagoController
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { mercadoPagoService } from '../services/MercadoPagoService.js';
import { ApiResponse } from '../utils/response.util.js';
import { config } from '../config/env.js';

export class PaymentMercadoPagoController {
  /**
   * POST /api/payment/mercadopago/create-preference
   * Create a MercadoPago payment preference
   */
  static createPreference = asyncHandler(async (req: Request, res: Response) => {
    const { items, externalReference, description } = req.body;
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(ApiResponse.error('INVALID_ITEMS', 'Items are required', 400));
    }

    const preference = await mercadoPagoService.createPreference({
      items: items.map((item: any) => ({
        id: item.id || item.productId,
        title: item.title || item.name,
        description: item.description || description || 'MLM Platform Purchase',
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
          ApiResponse.error(
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
      description: description || 'MLM Platform Purchase',
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
        .json(ApiResponse.error('MISSING_PAYMENT_ID', 'Payment ID is required', 400));
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

    // Handle IPN (Instant Payment Notification)
    if (topic === 'payment') {
      const paymentId = req.body.id || req.body.data?.id;

      if (paymentId) {
        try {
          const payment = await mercadoPagoService.getPayment(paymentId.toString());
          console.log('[MercadoPago Webhook] Payment:', payment.id, payment.status);

          // Handle different payment statuses
          switch (payment.status) {
            case 'approved':
              console.log('[MercadoPago] Payment approved:', payment.id);
              // TODO: Trigger commission calculation
              // TODO: Create or update order
              break;
            case 'pending':
              console.log('[MercadoPago] Payment pending:', payment.id);
              break;
            case 'rejected':
              console.log('[MercadoPago] Payment rejected:', payment.id);
              break;
            case 'cancelled':
              console.log('[MercadoPago] Payment cancelled:', payment.id);
              break;
            default:
              console.log('[MercadoPago] Unknown status:', payment.status);
          }
        } catch (error) {
          console.error('[MercadoPago Webhook] Error processing payment:', error);
        }
      }
    }

    // Return 200 to acknowledge receipt
    return res.status(200).json({ received: true });
  });
}
