/**
 * @fileoverview QrMapping Model - Short code to gift card UUID mapping
 * @description Sequelize model representing QR code short URL mappings for gift cards
 *              Modelo Sequelize representando mapeos de URL corta QR para gift cards
 * @module models/QrMapping
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Resolver código corto a gift card
 * const mapping = await QrMapping.findOne({ where: { shortCode: 'abc123xyz' } });
 *
 * // EN: Resolve short code to gift card
 * const mapping = await QrMapping.findOne({ where: { shortCode: 'abc123xyz' } });
 */

import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { GiftCard } from './GiftCard';
import type { QrMappingAttributes } from '../types';

type QrMappingCreation = Optional<QrMappingAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class QrMapping extends Model<QrMappingAttributes, QrMappingCreation> {
  declare id: string;
  declare shortCode: string;
  declare giftCardId: ForeignKey<GiftCard['id']>;
  declare scanCount: number;
  declare lastScannedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare giftCard?: GiftCard | null;
}

QrMapping.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    shortCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      // unique constraint managed via indexes (Sequelize v6 sync bug workaround)
      field: 'short_code',
    },
    giftCardId: {
      type: DataTypes.UUID,
      allowNull: false,
      // unique constraint managed via indexes (Sequelize v6 sync bug workaround)
      field: 'gift_card_id',
    },
    scanCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'scan_count',
    },
    lastScannedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_scanned_at',
    },
  },
  {
    sequelize,
    tableName: 'qr_mappings',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['short_code'], name: 'idx_qr_mappings_short_code' },
      { unique: true, fields: ['gift_card_id'], name: 'idx_qr_mappings_gift_card' },
    ],
  }
);
