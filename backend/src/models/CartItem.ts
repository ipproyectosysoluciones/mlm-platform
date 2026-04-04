/**
 * @fileoverview CartItem Model - Individual items within a shopping cart
 * @description Sequelize model representing cart line items with product reference and pricing
 *              Modelo Sequelize representando items del carrito con referencia de producto y precios
 * @module models/CartItem
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Get all items in a cart
 * const items = await CartItem.findAll({ where: { cartId } });
 *
 * // ES: Obtener todos los items de un carrito
 * const items = await CartItem.findAll({ where: { cartId } });
 */

import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import type { CartItemAttributes } from '../types';

type CartItemCreation = Optional<CartItemAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class CartItem extends Model<CartItemAttributes, CartItemCreation> {
  declare id: string;
  declare cartId: ForeignKey<string>;
  declare productId: ForeignKey<string>;
  declare quantity: number;
  declare unitPrice: number;
  declare subtotal: number;
  declare addedAt: Date;
  declare metadata: Record<string, unknown>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare product?: import('./Product').Product;
}

CartItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'cart_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price',
      validate: {
        min: 0.01,
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    addedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'added_at',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'cart_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_cart_items_cart',
        fields: ['cart_id'],
      },
      {
        name: 'idx_cart_items_product',
        fields: ['product_id'],
      },
    ],
  }
);
