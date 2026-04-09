import { Router } from 'express';
import { body } from 'express-validator';
import * as ShipmentTrackingController from '../controllers/ShipmentTrackingController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const trackingValidationRules = {
  addTracking: [
    body('trackingNumber').notEmpty().withMessage('Tracking number is required'),
    body('providerId').optional().isUUID().withMessage('Provider ID must be a valid UUID'),
    body('estimatedDelivery')
      .optional()
      .isISO8601()
      .withMessage('Estimated delivery must be a valid date'),
  ],
  webhook: [
    body('tracking_number').notEmpty().withMessage('Tracking number is required'),
    body('status')
      .isIn([
        'pending',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'failed',
        'returned',
      ])
      .withMessage('Invalid status'),
    body('details').optional().isString(),
  ],
};

// Order shipping routes (require authentication)
router.put(
  '/orders/:id/shipping',
  authenticate,
  trackingValidationRules.addTracking,
  ShipmentTrackingController.addTracking
);

router.get('/orders/:id/tracking', authenticate, ShipmentTrackingController.getTracking);

// Webhook route (public but signature-validated)
router.post(
  '/webhooks/shipping/:providerId',
  trackingValidationRules.webhook,
  ShipmentTrackingController.webhookUpdate
);

export default router;
