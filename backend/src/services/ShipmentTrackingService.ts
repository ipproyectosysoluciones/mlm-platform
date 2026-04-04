/**
 * @fileoverview ShipmentTrackingService - Shipment tracking management
 * @description Service for managing shipment tracking with status history.
 *             Servicio para gestionar seguimiento de envíos con historial de estados.
 * @module services/ShipmentTrackingService
 * @author MLM Development Team
 *
 * @example
 * // English: Add tracking to an order
 * const tracking = await shipmentTrackingService.addTracking(orderId, trackingData);
 *
 * // Español: Agregar seguimiento a un pedido
 * const tracking = await shipmentTrackingService.addTracking(uuid-pedido, datosSeguimiento);
 */
import { sequelize } from '../config/database';
import { ShipmentTracking, Order, VendorOrder } from '../models';
import { AppError } from '../middleware/error.middleware';
import type {
  ShipmentTrackingAttributes,
  ShipmentTrackingCreationAttributes,
  ShipmentStatusHistoryEntry,
  ShipmentTrackingStatus,
  AddTrackingDto,
} from '../types';

/**
 * ShipmentTrackingService - Handles shipment tracking operations
 * ShipmentTrackingService - Maneja operaciones de seguimiento de envíos
 */
export class ShipmentTrackingService {
  /**
   * Add tracking information to an order
   * Agregar información de seguimiento a un pedido
   *
   * @param {string} orderId - Order UUID
   * @param {AddTrackingDto} data - Tracking data
   * @returns {Promise<ShipmentTracking>} Created tracking record
   * @throws {AppError} 404 if order not found
   */
  async addTracking(orderId: string, data: AddTrackingDto): Promise<ShipmentTracking> {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }

    // Build initial status history entry
    const statusHistory: ShipmentStatusHistoryEntry[] = [
      {
        status: 'picked_up' as ShipmentTrackingStatus,
        timestamp: new Date(),
        details: 'Shipment created',
      },
    ];

    const tracking = await ShipmentTracking.create({
      orderId,
      trackingNumber: data.trackingNumber,
      providerId: data.providerId ?? null,
      status: 'picked_up' as ShipmentTrackingStatus,
      statusHistory,
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
    });

    // Update order shipping status
    await order.update({ shippingStatus: 'shipped' as const });

    return tracking;
  }

  /**
   * Update tracking status (append-only status history)
   * Actualizar estado de seguimiento (historial de estados append-only)
   *
   * @param {string} trackingNumber - Tracking number
   * @param {ShipmentTrackingStatus} status - New status
   * @param {string} [details] - Optional details about the status update
   * @returns {Promise<ShipmentTracking>} Updated tracking record
   * @throws {AppError} 404 if tracking not found
   */
  async updateStatus(
    trackingNumber: string,
    status: ShipmentTrackingStatus,
    details?: string
  ): Promise<ShipmentTracking> {
    const tracking = await ShipmentTracking.findOne({
      where: { trackingNumber },
    });

    if (!tracking) {
      throw new AppError(404, 'TRACKING_NOT_FOUND', 'Shipment tracking not found');
    }

    // Build new status history entry
    const newEntry: ShipmentStatusHistoryEntry = {
      status,
      timestamp: new Date(),
      details,
    };

    // Append to status history (append-only)
    const currentHistory = tracking.statusHistory || [];
    const updatedHistory = [...currentHistory, newEntry];

    // Update tracking
    await tracking.update({
      status,
      statusHistory: updatedHistory,
    });

    // If delivered, set actual delivery date
    if (status === 'delivered') {
      await tracking.update({ actualDelivery: new Date() });
    }

    // Update order shipping status based on tracking status
    if (tracking.orderId) {
      const order = await Order.findByPk(tracking.orderId);
      if (order) {
        let shippingStatus:
          | 'not_required'
          | 'pending_shipment'
          | 'shipped'
          | 'in_transit'
          | 'delivered';
        switch (status) {
          case 'delivered':
            shippingStatus = 'delivered';
            break;
          case 'in_transit':
          case 'out_for_delivery':
          case 'picked_up':
            shippingStatus = 'in_transit';
            break;
          default:
            shippingStatus = 'shipped';
        }
        await order.update({ shippingStatus });
      }
    }

    return tracking.reload();
  }

  /**
   * Get tracking information for an order
   * Obtener información de seguimiento de un pedido
   *
   * @param {string} orderId - Order UUID
   * @returns {Promise<ShipmentTracking | null>} Tracking record or null
   */
  async getByOrder(orderId: string): Promise<ShipmentTracking | null> {
    const tracking = await ShipmentTracking.findOne({
      where: { orderId },
      include: ['provider'],
    });
    return tracking;
  }

  /**
   * Check if this status update is a duplicate (idempotency)
   * Verificar si esta actualización de estado es un duplicado (idempotencia)
   *
   * @param {string} trackingNumber - Tracking number
   * @param {ShipmentTrackingStatus} status - Status to check
   * @param {Date} timestamp - Timestamp of the update
   * @returns {Promise<boolean>} True if duplicate
   */
  async isDuplicateUpdate(
    trackingNumber: string,
    status: ShipmentTrackingStatus,
    timestamp: Date
  ): Promise<boolean> {
    const tracking = await ShipmentTracking.findOne({
      where: { trackingNumber },
    });

    if (!tracking) {
      return false;
    }

    const history = tracking.statusHistory || [];
    // Check if same status with same timestamp already exists
    const exists = history.some(
      (entry) => entry.status === status && entry.timestamp.getTime() === timestamp.getTime()
    );

    return exists;
  }

  /**
   * Handle webhook status update (idempotent)
   * Manejar actualización de estado por webhook (idempotente)
   *
   * @param {string} trackingNumber - Tracking number
   * @param {ShipmentTrackingStatus} status - Status from webhook
   * @param {string} [details] - Optional details
   * @returns {Promise<{ tracking: ShipmentTracking; isNew: boolean }>} Tracking and whether status was new
   */
  async handleWebhookUpdate(
    trackingNumber: string,
    status: ShipmentTrackingStatus,
    details?: string
  ): Promise<{ tracking: ShipmentTracking; isNew: boolean }> {
    const tracking = await ShipmentTracking.findOne({
      where: { trackingNumber },
    });

    if (!tracking) {
      throw new AppError(404, 'TRACKING_NOT_FOUND', 'Shipment tracking not found');
    }

    // Check if this status already exists in history (idempotency)
    const currentHistory = tracking.statusHistory || [];
    const statusExists = currentHistory.some((entry) => entry.status === status);

    if (statusExists) {
      // Idempotent: same status already recorded, return without adding
      return { tracking, isNew: false };
    }

    // Add new status to history
    const newEntry: ShipmentStatusHistoryEntry = {
      status,
      timestamp: new Date(),
      details,
    };

    const updatedHistory = [...currentHistory, newEntry];

    await tracking.update({
      status,
      statusHistory: updatedHistory,
    });

    // If delivered, set actual delivery date
    if (status === 'delivered') {
      await tracking.update({ actualDelivery: new Date() });
    }

    // Update order shipping status
    if (tracking.orderId) {
      const order = await Order.findByPk(tracking.orderId);
      if (order) {
        let shippingStatus:
          | 'not_required'
          | 'pending_shipment'
          | 'shipped'
          | 'in_transit'
          | 'delivered';
        switch (status) {
          case 'delivered':
            shippingStatus = 'delivered';
            break;
          case 'in_transit':
          case 'out_for_delivery':
          case 'picked_up':
            shippingStatus = 'in_transit';
            break;
          default:
            shippingStatus = 'shipped';
        }
        await order.update({ shippingStatus });
      }
    }

    return { tracking: tracking.reload(), isNew: true };
  }
}
