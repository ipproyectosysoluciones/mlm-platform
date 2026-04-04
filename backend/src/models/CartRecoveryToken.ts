/**
 * @fileoverview CartRecoveryToken Model - One-time recovery tokens for abandoned carts
 * @description Sequelize model representing bcrypt-hashed recovery tokens sent via email
 *              Modelo Sequelize representando tokens de recuperación hasheados con bcrypt enviados por email
 * @module models/CartRecoveryToken
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Find pending token for a cart
 * const token = await CartRecoveryToken.findOne({ where: { cartId, status: 'pending' } });
 *
 * // ES: Buscar token pendiente para un carrito
 * const token = await CartRecoveryToken.findOne({ where: { cartId, status: 'pending' } });
 */

import { DataTypes, Model, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type {
  CartRecoveryTokenAttributes,
  CartRecoveryTokenCreationAttributes,
  CartRecoveryTokenStatus,
} from '../types';

type CartRecoveryTokenCreation = CartRecoveryTokenCreationAttributes & { id?: string };

export class CartRecoveryToken extends Model<
  CartRecoveryTokenAttributes,
  CartRecoveryTokenCreation
> {
  declare id: string;
  declare cartId: ForeignKey<string>;
  declare userId: ForeignKey<User['id']>;
  declare tokenHash: string;
  declare status: CartRecoveryTokenStatus;
  declare expiresAt: Date;
  declare usedAt: Date | null;
  declare emailSentAt: Date | null;
  declare clickCount: number;
  declare lastClickedAt: Date | null;
  declare metadata: Record<string, unknown>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare user?: User | null;
  declare cart?: import('./Cart').Cart;
}

CartRecoveryToken.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'token_hash',
    },
    status: {
      type: DataTypes.ENUM('pending', 'used', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'used_at',
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_sent_at',
    },
    clickCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'click_count',
    },
    lastClickedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_clicked_at',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'cart_recovery_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_recovery_tokens_cart',
        fields: ['cart_id'],
      },
      {
        name: 'idx_recovery_tokens_user',
        fields: ['user_id'],
      },
      {
        name: 'idx_recovery_tokens_hash',
        unique: true,
        fields: ['token_hash'],
      },
      {
        name: 'idx_recovery_tokens_expires',
        fields: ['expires_at'],
        where: { status: 'pending' },
      },
      {
        name: 'idx_cart_recovery_tokens_status_expires',
        fields: ['status', 'expires_at'],
      },
    ],
  }
);
