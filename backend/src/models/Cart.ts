/**
 * @fileoverview Cart Model - Shopping cart for MLM platform
 * @description Sequelize model representing shopping carts with lifecycle tracking (active → abandoned → recovered)
 *              Modelo Sequelize representando carritos de compra con seguimiento de ciclo de vida
 * @module models/Cart
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Get user's active cart
 * const cart = await Cart.findOne({ where: { userId, status: 'active' } });
 *
 * // ES: Obtener carrito activo del usuario
 * const cart = await Cart.findOne({ where: { userId, status: 'active' } });
 */

import { DataTypes, Model, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { CartAttributes, CartCreationAttributes, CartStatus } from '../types';

type CartCreation = CartCreationAttributes & { id?: string };

export class Cart extends Model<CartAttributes, CartCreation> {
  declare id: string;
  declare userId: ForeignKey<User['id']>;
  declare status: CartStatus;
  declare lastActivityAt: Date;
  declare abandonedAt: Date | null;
  declare recoveredAt: Date | null;
  declare checkedOutAt: Date | null;
  declare deletedAt: Date | null;
  declare totalAmount: number;
  declare itemCount: number;
  declare metadata: Record<string, unknown>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare user?: User | null;
  declare items?: import('./CartItem').CartItem[];
}

Cart.init(
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
    status: {
      type: DataTypes.ENUM('active', 'abandoned', 'recovered', 'checked_out', 'expired'),
      allowNull: false,
      defaultValue: 'active',
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_activity_at',
    },
    abandonedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'abandoned_at',
    },
    recoveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'recovered_at',
    },
    checkedOutAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'checked_out_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_amount',
    },
    itemCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'item_count',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'carts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_carts_user_active',
        fields: ['user_id', 'status'],
        where: { status: ['active', 'abandoned'] },
      },
      {
        name: 'idx_carts_last_activity',
        fields: ['last_activity_at'],
        where: { status: 'active' },
      },
      {
        name: 'idx_carts_abandoned',
        fields: ['abandoned_at'],
        where: { status: 'abandoned' },
      },
    ],
  }
);
