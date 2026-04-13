/**
 * @fileoverview Wallet Model - Digital wallet for MLM platform users
 * @description Sequelize model representing user wallets with balance tracking
 *              Modelo Sequelize representando billeteras de usuarios con seguimiento de balance
 * @module models/Wallet
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Obtener wallet de usuario
 * const wallet = await Wallet.findOne({ where: { userId: 'user-uuid' } });
 *
 * // EN: Get user wallet
 * const wallet = await Wallet.findOne({ where: { userId: 'user-uuid' } });
 */

import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { WalletAttributes } from '../types';

type WalletCreation = Optional<WalletAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Wallet extends Model<WalletAttributes, WalletCreation> {
  declare id: string;
  declare userId: ForeignKey<User['id']>;
  declare balance: number;
  declare currency: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare user?: User | null;
}

Wallet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      // unique constraint managed via indexes (Sequelize v6 sync bug workaround)
      field: 'user_id',
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
  },
  {
    sequelize,
    tableName: 'wallets',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['user_id'] }, { fields: ['balance'] }],
  }
);
