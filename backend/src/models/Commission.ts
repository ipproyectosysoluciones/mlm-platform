import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { CommissionAttributes } from '../types';

type CommissionCreation = Optional<CommissionAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Commission extends Model<CommissionAttributes, CommissionCreation> {
  declare id: string;
  declare userId: ForeignKey<User['id']>;
  declare fromUserId: ForeignKey<User['id']>;
  declare purchaseId: string | null;
  declare type: 'direct' | 'level_1' | 'level_2' | 'level_3' | 'level_4';
  declare amount: number;
  declare currency: string;
  declare status: 'pending' | 'approved' | 'paid';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare fromUser?: User | null;
  declare user?: User | null;
}

Commission.init(
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
    fromUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'from_user_id',
    },
    purchaseId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'purchase_id',
    },
    type: {
      type: DataTypes.ENUM('direct', 'level_1', 'level_2', 'level_3', 'level_4'),
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
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'paid'),
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    tableName: 'commissions',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['type'] }, { fields: ['status'] }],
  }
);
