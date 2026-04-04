/**
 * @fileoverview Order - Order model for streaming subscription purchases
 * @description Sequelize model for orders with associations to User, Product, and Purchase.
 *             Modelo Sequelize para pedidos con asociaciones a Usuario, Producto y Compra.
 * @module models/Order
 * @author MLM Development Team
 *
 * @example
 * // English: Get user's orders with products
 * const orders = await Order.findAll({
 *   where: { userId: 'user-uuid' },
 *   include: ['product', 'purchase']
 * });
 *
 * // Español: Obtener pedidos del usuario con productos
 * const orders = await Order.findAll({
 *   where: { userId: 'uuid-usuario' },
 *   include: ['product', 'purchase']
 * });
 */
import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Product } from './Product';
import { Purchase } from './Purchase';
import type { OrderAttributes, OrderCreationAttributes, ShippingStatus } from '../types';

type OrderCreation = Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Order Model - Represents orders for streaming subscription purchases
 * Modelo de Pedido - Representa pedidos de compra de suscripciones de streaming
 */
export class Order extends Model<OrderAttributes, OrderCreation> {
  declare id: string;
  declare orderNumber: string;
  declare userId: ForeignKey<User['id']>;
  declare productId: string; // FK to products table
  declare purchaseId: string | null; // FK to purchases table (nullable)
  declare totalAmount: number;
  declare currency: string;
  declare status: 'pending' | 'completed' | 'failed';
  declare paymentMethod: 'manual' | 'simulated';
  declare notes: string | null;
  // Shipping fields (Phase 3)
  declare shippingAddressId: string | null;
  declare shippingCost: number | null;
  declare shippingStatus: ShippingStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare user?: User;
  declare product?: Product | null;
  declare purchase?: Purchase | null;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'order_number',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    purchaseId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'purchase_id',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.ENUM('manual', 'simulated'),
      allowNull: false,
      defaultValue: 'simulated',
      field: 'payment_method',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Shipping fields (Phase 3 - Delivery Integration)
    shippingAddressId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'shipping_address_id',
      comment: 'FK to shipping_addresses table',
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'shipping_cost',
      comment: 'Cost of shipping',
    },
    shippingStatus: {
      type: DataTypes.ENUM(
        'not_required',
        'pending_shipment',
        'shipped',
        'in_transit',
        'delivered'
      ),
      allowNull: true,
      defaultValue: 'not_required',
      field: 'shipping_status',
      comment: 'Shipping status for the order',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['order_number'], unique: true },
      { fields: ['user_id'] },
      { fields: ['product_id'] },
      { fields: ['purchase_id'] },
      { fields: ['status'] },
      { fields: ['shipping_address_id'] },
      { fields: ['shipping_status'] },
    ],
  }
);
