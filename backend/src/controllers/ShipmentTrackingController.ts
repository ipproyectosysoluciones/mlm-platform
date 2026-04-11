/**
 * @fileoverview ShipmentTrackingController - HTTP controller for shipment tracking
 * @description Express controller for shipment tracking and webhook operations.
 *             Controlador Express para seguimiento de envíos y operaciones webhook.
 * @module controllers/ShipmentTrackingController
 * @author MLM Development Team
 */
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ShipmentTrackingService } from '../services/ShipmentTrackingService';
import { DeliveryProvider } from '../models/DeliveryProvider';
import { Order, Product } from '../models';
import { AppError } from '../middleware/error.middleware';
import type { ApiResponse } from '../types';
import { ShipmentTrackingStatus } from '../types';

const shipmentTrackingService = new ShipmentTrackingService();

/**
 * Validate webhook signature
 * Validar firma del webhook
 */
function validateWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string | null
): boolean {
  if (!secret || !signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Add tracking to an order (vendor/admin only)
 * PUT /api/orders/:id/shipping
 */
export async function addTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { trackingNumber, providerId, estimatedDelivery } = req.body;

    // Verify order exists
    const order = await Order.findByPk(id, {
      include: [{ model: Product, as: 'product' }],
    });

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    // Check if user owns the order or is admin
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    if (!isAdmin && order.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to add tracking to this order');
    }

    const tracking = await shipmentTrackingService.addTracking(id, {
      trackingNumber,
      providerId,
      estimatedDelivery,
    });

    const response: ApiResponse<typeof tracking> = {
      success: true,
      data: tracking,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get tracking for an order
 * GET /api/orders/:id/tracking
 */
export async function getTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // Verify order exists
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    // Check if user owns the order or is admin
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    if (!isAdmin && order.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to view tracking for this order');
    }

    const tracking = await shipmentTrackingService.getByOrder(id);

    const response: ApiResponse<typeof tracking> = {
      success: true,
      data: tracking,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle shipping webhook from delivery provider
 * POST /api/webhooks/shipping/:providerId
 */
export async function webhookUpdate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { providerId } = req.params;
    const signature = req.headers['x-webhook-signature'] as string | undefined;

    // Get provider for signature validation
    const provider = await DeliveryProvider.findByPk(providerId);

    if (!provider) {
      throw new AppError(404, 'PROVIDER_NOT_FOUND', 'Delivery provider not found');
    }

    if (!provider.isActive) {
      throw new AppError(400, 'PROVIDER_INACTIVE', 'Delivery provider is not active');
    }

    // Validate webhook signature
    const rawBody = JSON.stringify(req.body);
    const isValid = validateWebhookSignature(rawBody, signature, provider.webhookSecret);

    if (!isValid) {
      throw new AppError(401, 'INVALID_SIGNATURE', 'Webhook signature validation failed');
    }

    // Extract tracking data from webhook payload
    const { tracking_number, status, details } = req.body;

    if (!tracking_number || !status) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Missing tracking_number or status');
    }

    // Handle the webhook update (idempotent)
    const result = await shipmentTrackingService.handleWebhookUpdate(
      tracking_number,
      status as ShipmentTrackingStatus,
      details
    );

    const response: ApiResponse<{
      tracking: typeof result.tracking;
      isNew: boolean;
    }> = {
      success: true,
      data: {
        tracking: result.tracking,
        isNew: result.isNew,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}
