/**
 * @fileoverview Shipping and Tracking Routes
 * @description API endpoints for shipment tracking and carrier webhooks
 * @module routes/shipping
 */

import { Router } from 'express';
import { body } from 'express-validator';
import * as ShipmentTrackingController from '../controllers/ShipmentTrackingController.js';
import { authenticate } from '../middleware/auth.middleware.js';

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

/**
 * @swagger
 * /orders/{id}/shipping:
 *   put:
 *     summary: Add tracking to order / Agregar tracking al pedido
 *     description: Adds shipment tracking information to an order (vendor/admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order UUID / UUID del pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackingNumber
 *             properties:
 *               trackingNumber:
 *                 type: string
 *                 description: Carrier tracking number / Número de rastreo
 *               providerId:
 *                 type: string
 *                 format: uuid
 *                 description: Delivery provider UUID / UUID del proveedor de envío
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *                 description: Estimated delivery date (ISO 8601) / Fecha estimada de entrega
 *     responses:
 *       200:
 *         description: Tracking added / Tracking agregado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error / Error de validación
 *       401:
 *         description: Not authenticated / No autenticado
 *       404:
 *         description: Order not found / Pedido no encontrado
 *       500:
 *         description: Internal error / Error interno
 */
router.put(
  '/orders/:id/shipping',
  authenticate,
  trackingValidationRules.addTracking,
  ShipmentTrackingController.addTracking
);

/**
 * @swagger
 * /orders/{id}/tracking:
 *   get:
 *     summary: Get order tracking / Obtener tracking del pedido
 *     description: Returns tracking information for an order
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order UUID / UUID del pedido
 *     responses:
 *       200:
 *         description: Tracking retrieved / Tracking obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Order not found / Pedido no encontrado
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.get('/orders/:id/tracking', authenticate, ShipmentTrackingController.getTracking);

/**
 * @swagger
 * /webhooks/shipping/{providerId}:
 *   post:
 *     summary: Shipping webhook / Webhook de envío
 *     description: Receives tracking updates from shipping providers (signature-validated, public)
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery provider ID / ID del proveedor de envío
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tracking_number
 *               - status
 *             properties:
 *               tracking_number:
 *                 type: string
 *                 description: Carrier tracking number / Número de rastreo
 *               status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - picked_up
 *                   - in_transit
 *                   - out_for_delivery
 *                   - delivered
 *                   - failed
 *                   - returned
 *                 description: Shipment status / Estado del envío
 *               details:
 *                 type: string
 *                 description: Additional status details / Detalles adicionales del estado
 *     responses:
 *       200:
 *         description: Webhook processed / Webhook procesado
 *       400:
 *         description: Validation error / Error de validación
 *       403:
 *         description: Invalid webhook signature / Firma de webhook inválida
 *       500:
 *         description: Internal error / Error interno
 */
router.post(
  '/webhooks/shipping/:providerId',
  trackingValidationRules.webhook,
  ShipmentTrackingController.webhookUpdate
);

export default router;
