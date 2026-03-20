import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { PurchaseAttributes } from '../types';

type PurchaseCreation = Optional<PurchaseAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Purchase extends Model<PurchaseAttributes, PurchaseCreation> {
  declare id: string;
  declare userId: ForeignKey<User['id']>;
  declare amount: number;
  declare currency: string;
  declare description: string | null;
  declare status: 'pending' | 'completed' | 'refunded';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Purchase.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'refunded'),
      defaultValue: 'completed',
    },
  },
  {
    sequelize,
    tableName: 'purchases',
    indexes: [{ fields: ['user_id'] }, { fields: ['status'] }],
  }
);
