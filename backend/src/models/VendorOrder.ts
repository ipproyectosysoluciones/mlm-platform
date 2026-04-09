/**
 * @fileoverview VendorOrder Model - Vendor order entity for marketplace orders
 * @description Sequelize model representing vendor-specific order splits
 * @module models/VendorOrder
 * @author MLM Development Team
 *
 * @example
 * // English: Get vendor orders by order ID
 * const vendorOrders = await VendorOrder.findAll({ where: { orderId: orderId } });
 *
 * // Español: Obtener pedidos de vendedor por ID de pedido
 * const vendorOrders = await VendorOrder.findAll({ where: { orderId: idPedido } });
 */
import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import type { VendorOrderAttributes } from '../types';
import type { Vendor } from './Vendor';
import type { Order } from './Order';

type VendorOrderCreation = Optional<VendorOrderAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * VendorOrder Model - Represents order split by vendor
 * Modelo de Pedido de Vendedor - Representa la división de pedido por vendedor
 */
export class VendorOrder
  extends Model<VendorOrderAttributes, VendorOrderCreation>
  implements VendorOrderAttributes
{
  declare id: string;
  declare orderId: ForeignKey<Order['id']>;
  declare vendorId: ForeignKey<Vendor['id']> | null;
  declare subtotal: number;
  declare commissionAmount: number;
  declare vendorAmount: number;
  declare platformAmount: number;
  declare status: 'pending' | 'processing' | 'completed' | 'cancelled';
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

VendorOrder.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'vendor_id',
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    commissionAmount: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 0,
      field: 'commission_amount',
      comment: 'Total MLM commissions for this vendor order',
    },
    vendorAmount: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 0,
      field: 'vendor_amount',
      comment: 'Amount to be paid to vendor',
    },
    platformAmount: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 0,
      field: 'platform_amount',
      comment: 'Platform net after vendor and MLM commissions',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'vendor_orders',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['order_id'] }, { fields: ['vendor_id'] }, { fields: ['status'] }],
  }
);
