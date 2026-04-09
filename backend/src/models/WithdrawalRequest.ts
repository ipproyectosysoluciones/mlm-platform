/**
 * @fileoverview WithdrawalRequest Model - Withdrawal request records from users
 * @description Sequelize model representing user withdrawal requests with status tracking
 *              Modelo Sequelize representando solicitudes de retiro de usuarios con seguimiento de estado
 * @module models/WithdrawalRequest
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Obtener solicitudes de retiro pendientes
 * const pending = await WithdrawalRequest.findAll({ where: { status: 'pending' } });
 *
 * // EN: Get pending withdrawal requests
 * const pending = await WithdrawalRequest.findAll({ where: { status: 'pending' } });
 */

import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { WithdrawalRequestAttributes, WithdrawalStatus } from '../types';

type WithdrawalRequestCreation = Optional<
  WithdrawalRequestAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class WithdrawalRequest extends Model<
  WithdrawalRequestAttributes,
  WithdrawalRequestCreation
> {
  declare id: string;
  declare userId: ForeignKey<User['id']>;
  declare requestedAmount: number;
  declare feeAmount: number;
  declare netAmount: number;
  declare status: WithdrawalStatus;
  declare rejectionReason: string | null;
  declare approvalComment: string | null;
  declare processedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare user?: User | null;
}

WithdrawalRequest.init(
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
    requestedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'requested_amount',
    },
    feeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'fee_amount',
    },
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'net_amount',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    rejectionReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'rejection_reason',
    },
    approvalComment: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'approval_comment',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at',
    },
  },
  {
    sequelize,
    tableName: 'withdrawal_requests',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['status'] }, { fields: ['created_at'] }],
  }
);
