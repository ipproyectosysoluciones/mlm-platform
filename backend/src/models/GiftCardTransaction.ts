/**
 * @fileoverview GiftCardTransaction Model - Audit log for gift card operations
 * @description Sequelize model representing gift card transaction records (redemptions, refunds, adjustments)
 *              Modelo Sequelize representando registros de transacciones de gift card (canjes, reembolsos, ajustes)
 * @module models/GiftCardTransaction
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Obtener transacciones de una gift card
 * const txns = await GiftCardTransaction.findAll({ where: { giftCardId: 'uuid' } });
 *
 * // EN: Get transactions for a gift card
 * const txns = await GiftCardTransaction.findAll({ where: { giftCardId: 'uuid' } });
 */

import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { GiftCard } from './GiftCard';
import { User } from './User';
import type {
  GiftCardTransactionAttributes,
  GiftCardTransactionType,
  GiftCardTransactionStatus,
} from '../types';

type GiftCardTransactionCreation = Optional<
  GiftCardTransactionAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class GiftCardTransaction extends Model<
  GiftCardTransactionAttributes,
  GiftCardTransactionCreation
> {
  declare id: string;
  declare giftCardId: ForeignKey<GiftCard['id']>;
  declare orderId: string | null;
  declare redeemedByUserId: ForeignKey<User['id']>;
  declare amountRedeemed: number;
  declare transactionType: GiftCardTransactionType;
  declare status: GiftCardTransactionStatus;
  declare metadata: Record<string, unknown> | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare giftCard?: GiftCard | null;
  declare redeemedByUser?: User | null;
}

GiftCardTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    giftCardId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'gift_card_id',
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'order_id',
    },
    redeemedByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'redeemed_by_user_id',
    },
    amountRedeemed: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'amount_redeemed',
    },
    transactionType: {
      type: DataTypes.ENUM('redemption', 'refund', 'adjustment'),
      allowNull: false,
      field: 'transaction_type',
    },
    status: {
      type: DataTypes.ENUM('completed', 'refunded', 'failed'),
      allowNull: false,
      defaultValue: 'completed',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'gift_card_transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['gift_card_id'], name: 'idx_gift_card_transactions_gift_card' },
      { fields: ['order_id'], name: 'idx_gift_card_transactions_order' },
    ],
  }
);
