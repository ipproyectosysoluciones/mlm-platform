/**
 * @fileoverview Push notification routes
 * @description API routes for push subscription management
 * @module routes/push.routes
 * @author MLM Development Team
 *
 * @example
 * // English: Subscribe to push notifications
 * POST /api/push/subscribe
 * { endpoint, keys: { p256dh, auth }, userAgent }
 *
 * // Español: Suscribirse a notificaciones push
 * POST /api/push/subscribe
 * { endpoint, keys: { p256dh, auth }, userAgent }
 */
import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { pushService } from '../services/PushService';
import { getVapidPublicKey } from '../utils/vapid';
import { authenticateToken } from '../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import type { ApiResponse } from '../types';

const router = Router();

// Validation rules for subscription
const subscribeValidation = [
  body('endpoint')
    .isString()
    .notEmpty()
    .withMessage('Endpoint is required')
    .isURL()
    .withMessage('Invalid endpoint URL'),
  body('keys')
    .isObject()
    .withMessage('Keys must be an object')
    .withMessage('Keys object is required'),
  body('keys.p256dh').isString().notEmpty().withMessage('p256dh key is required'),
  body('keys.auth').isString().notEmpty().withMessage('auth key is required'),
  body('userAgent').optional().isString().withMessage('User agent must be a string'),
];

// Validation for unsubscription
const unsubscribeValidation = [
  body('endpoint').isString().notEmpty().withMessage('Endpoint is required'),
];

/**
 * @swagger
 * /push/vapid-public-key:
 *   get:
 *     summary: Get VAPID public key
 *     description: Returns the VAPID public key for client-side push subscription
 *     tags: [push]
 *     responses:
 *       200:
 *         description: VAPID public key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: VAPID keys not configured
 */
router.get(
  '/vapid-public-key',
  asyncHandler(async (req: Request, res: Response) => {
    const publicKey = getVapidPublicKey();

    const response: ApiResponse<{ publicKey: string }> = {
      success: true,
      data: { publicKey },
    };

    res.json(response);
  })
);

/**
 * @swagger
 * /push/subscribe:
 *   post:
 *     summary: Subscribe to push notifications
 *     description: Save a push notification subscription for the authenticated user
 *     tags: [push]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *               - keys
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: Push subscription endpoint URL
 *               keys:
 *                 type: object
 *                 required:
 *                   - p256dh
 *                   - auth
 *                 properties:
 *                   p256dh:
 *                     type: string
 *                     description: Base64 encoded public key
 *                   auth:
 *                     type: string
 *                     description: Base64 encoded auth secret
 *               userAgent:
 *                 type: string
 *                 description: Optional browser user agent
 *     responses:
 *       201:
 *         description: Subscription created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/subscribe',
  authenticateToken,
  validate(subscribeValidation),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { endpoint, keys, userAgent } = req.body;

    const subscription = await pushService.handleSubscription(
      userId,
      { endpoint, keys },
      userAgent
    );

    const response: ApiResponse<{
      id: string;
      createdAt: string;
    }> = {
      success: true,
      data: {
        id: subscription.id,
        createdAt: (
          subscription.createdAt ??
          subscription.dataValues?.createdAt ??
          new Date()
        ).toISOString(),
      },
    };

    res.status(201).json(response);
  })
);

/**
 * @swagger
 * /push/unsubscribe:
 *   delete:
 *     summary: Unsubscribe from push notifications
 *     description: Remove a push notification subscription
 *     tags: [push]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: Push subscription endpoint URL
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/unsubscribe',
  authenticateToken,
  validate(unsubscribeValidation),
  asyncHandler(async (req: Request, res: Response) => {
    const { endpoint } = req.body;

    await pushService.removeSubscription(endpoint);

    const response: ApiResponse<null> = {
      success: true,
    };

    res.json(response);
  })
);

export default router;
