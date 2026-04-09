/**
 * @fileoverview WalletTransaction Model - Transaction records for wallet operations
 * @description Sequelize model representing wallet transactions (commissions, withdrawals, fees, adjustments)
 *              Modelo Sequelize representando transacciones de wallet (comisiones, retiros, fees, ajustes)
 * @module models/WalletTransaction
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Obtener transacciones de wallet
 * const transactions = await WalletTransaction.findAll({ where: { walletId: 'wallet-uuid' } });
 *
 * // EN: Get wallet transactions
 * const transactions = await WalletTransaction.findAll({ where: { walletId: 'wallet-uuid' } });
 */

import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { Wallet } from './Wallet';
import type { WalletTransactionAttributes, WalletTransactionType } from '../types';

type WalletTransactionCreation = Optional<
  WalletTransactionAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class WalletTransaction extends Model<
  WalletTransactionAttributes,
  WalletTransactionCreation
> {
  declare id: string;
  declare walletId: ForeignKey<Wallet['id']>;
  declare type: WalletTransactionType;
  declare amount: number;
  declare currency: string;
  declare referenceId: string | null;
  declare description: string;
  declare exchangeRate: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare wallet?: Wallet | null;
}

WalletTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'wallet_id',
    },
    type: {
      type: DataTypes.ENUM('commission_earned', 'withdrawal', 'fee', 'adjustment'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reference_id',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      field: 'exchange_rate',
    },
  },
  {
    sequelize,
    tableName: 'wallet_transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['wallet_id'] },
      { fields: ['type'] },
      { fields: ['reference_id'] },
      { fields: ['created_at'] },
    ],
  }
);
