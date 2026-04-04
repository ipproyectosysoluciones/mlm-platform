/**
 * @fileoverview ShipmentTracking - Shipment tracking model for delivery status
 * @description Sequelize model for tracking shipments with status history.
 *             Modelo Sequelize para seguimiento de envíos con historial de estados.
 * @module models/ShipmentTracking
 * @author MLM Development Team
 *
 * @example
 * // English: Get tracking for an order
 * const tracking = await ShipmentTracking.findOne({ where: { orderId } });
 *
 * // Español: Obtener seguimiento de un pedido
 * const tracking = await ShipmentTracking.findOne({ where: { orderId } });
 */
import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import type {
  ShipmentTrackingAttributes,
  ShipmentTrackingCreationAttributes,
  ShipmentStatusHistoryEntry,
} from '../types';

type ShipmentTrackingCreation = Optional<
  ShipmentTrackingAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ShipmentTracking Model - Represents shipment tracking information
 * ShipmentTracking Modelo - Representa información de seguimiento de envío
 */
export class ShipmentTracking
  extends Model<ShipmentTrackingAttributes, ShipmentTrackingCreation>
  implements ShipmentTrackingAttributes
{
  declare id: string;
  declare orderId: ForeignKey<string> | null;
  declare vendorOrderId: ForeignKey<string> | null;
  declare providerId: ForeignKey<string> | null;
  declare trackingNumber: string;
  declare status: string;
  declare statusHistory: ShipmentStatusHistoryEntry[];
  declare estimatedDelivery: Date | null;
  declare actualDelivery: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ShipmentTracking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'order_id',
    },
    vendorOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'vendor_order_id',
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'provider_id',
    },
    trackingNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'tracking_number',
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'failed',
        'returned'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    statusHistory: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'status_history',
      comment: 'Array of status history entries [{ status, timestamp, details? }]',
    },
    estimatedDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'estimated_delivery',
    },
    actualDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'actual_delivery',
    },
  },
  {
    sequelize,
    tableName: 'shipment_trackings',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['vendor_order_id'] },
      { fields: ['tracking_number'] },
      { fields: ['status'] },
    ],
  }
);
