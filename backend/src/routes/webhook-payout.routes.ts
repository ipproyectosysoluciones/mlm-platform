/**
 * @fileoverview Webhook payout routes — Raw body + no featureGuard
 * @description Routes for payment provider webhooks (PayPal, MercadoPago)
 *
 * @module routes/webhook-payout.routes
 */

import { Router, Router as ExpressRouter } from 'express';
import {
  paypalPayoutWebhook,
  mercadopagoPayoutWebhook,
} from '../controllers/PayoutWebhookController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router: ExpressRouter = Router();

// PayPal payout webhook — no featureGuard, raw body needed for signature verification
router.post('/paypal/payout-webhook', asyncHandler(paypalPayoutWebhook));

// MercadoPago payout webhook — placeholder
router.post('/mercadopago/payout-webhook', asyncHandler(mercadopagoPayoutWebhook));

export default router;
