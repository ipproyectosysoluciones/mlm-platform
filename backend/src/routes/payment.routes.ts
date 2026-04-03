/**
 * @fileoverview Payment Routes
 * @description API endpoints for payment operations
 * @module routes/payment
 */

import { Router } from 'express';
import { PaymentPayPalController } from '../controllers/PaymentPayPalController.js';
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

export default router;
