/**
 * @fileoverview GiftCard Model - Digital gift card for MLM platform
 * @description Sequelize model representing gift cards with balance, status, and expiration tracking
 *              Modelo Sequelize representando gift cards con balance, estado y seguimiento de expiración
 * @module models/GiftCard
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Obtener gift card activa
 * const card = await GiftCard.findOne({ where: { code: 'ABC123', isActive: true } });
 *
 * // EN: Get active gift card
 * const card = await GiftCard.findOne({ where: { code: 'ABC123', isActive: true } });
 */

import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { GiftCardAttributes, GiftCardStatus } from '../types';

type GiftCardCreation = Optional<GiftCardAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class GiftCard extends Model<GiftCardAttributes, GiftCardCreation> {
  declare id: string;
  declare code: string;
  declare qrCodeData: string | null;
  declare balance: number;
  declare status: GiftCardStatus;
  declare isActive: boolean;
  declare createdByUserId: ForeignKey<User['id']>;
  declare redeemedByUserId: ForeignKey<User['id']> | null;
  declare expiresAt: Date;
  declare redeemedAt: Date | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare createdByUser?: User | null;
  declare redeemedByUser?: User | null;
}

GiftCard.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // unique constraint managed via indexes (Sequelize v6 sync bug workaround)
    },
    qrCodeData: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'qr_code_data',
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'redeemed', 'expired'),
      allowNull: false,
      defaultValue: 'active',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    createdByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by_user_id',
    },
    redeemedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'redeemed_by_user_id',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    redeemedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'redeemed_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'gift_cards',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['status', 'expires_at'], name: 'idx_gift_cards_status_expires' },
      { fields: ['created_by_user_id'], name: 'idx_gift_cards_created_by' },
      { fields: ['redeemed_by_user_id'], name: 'idx_gift_cards_redeemed_by' },
    ],
  }
);
