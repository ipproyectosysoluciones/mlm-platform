/**
 * @fileoverview Payment Routes
 * @description API endpoints for payment operations
 * @module routes/payment
 */

import { Router } from 'express';
import { PaymentPayPalController } from '../controllers/PaymentPayPalController.js';
import { PaymentMercadoPagoController } from '../controllers/PaymentMercadoPagoController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route POST /api/payment/paypal/create
 * @description Create a new PayPal order
 * @access Authenticated
 */
router.post('/paypal/create', authenticate, PaymentPayPalController.createOrder);

/**
 * @route POST /api/payment/paypal/capture
 * @description Capture a PayPal order after approval
 * @access Authenticated
 */
router.post('/paypal/capture', authenticate, PaymentPayPalController.captureOrder);

/**
 * @route POST /api/payment/paypal/webhook
 * @description PayPal webhook endpoint
 * @access Public (verified by signature in production)
 */
router.post('/paypal/webhook', PaymentPayPalController.webhook);

/**
 * @route GET /api/payment/paypal/:orderId
 * @description Get PayPal order status
 * @access Authenticated
 */
router.get('/paypal/:orderId', authenticate, PaymentPayPalController.getOrder);

// ============================================
// MercadoPago Routes
// ============================================

/**
 * @route POST /api/payment/mercadopago/create-preference
 * @description Create a MercadoPago payment preference
 * @access Authenticated
 */
router.post(
  '/mercadopago/create-preference',
  authenticate,
  PaymentMercadoPagoController.createPreference
);

/**
 * @route POST /api/payment/mercadopago/process
 * @description Process a direct payment with card token
 * @access Authenticated
 */
router.post('/mercadopago/process', authenticate, PaymentMercadoPagoController.processPayment);

/**
 * @route GET /api/payment/mercadopago/payment/:paymentId
 * @description Get MercadoPago payment status
 * @access Authenticated
 */
router.get(
  '/mercadopago/payment/:paymentId',
  authenticate,
  PaymentMercadoPagoController.getPayment
);

/**
 * @route GET /api/payment/mercadopago/payment-methods
 * @description Get available payment methods
 * @access Authenticated
 */
router.get(
  '/mercadopago/payment-methods',
  authenticate,
  PaymentMercadoPagoController.getPaymentMethods
);

/**
 * @route POST /api/payment/mercadopago/webhook
 * @description MercadoPago webhook endpoint
 * @access Public (verified in production)
 */
router.post('/mercadopago/webhook', PaymentMercadoPagoController.webhook);

export default router;
