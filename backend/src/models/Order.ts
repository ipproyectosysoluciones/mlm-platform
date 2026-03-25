import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Product } from './Product';
import { Purchase } from './Purchase';
import type { OrderAttributes, OrderCreationAttributes } from '../types';

type OrderCreation = Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Order extends Model<OrderAttributes, OrderCreation> {
  declare id: string;
  declare userId: ForeignKey<User['id']>;
  declare productId: string | null;
  declare purchaseId: string | null;
  declare amount: number;
  declare currency: string;
  declare status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  declare paymentMethod: string | null;
  declare transactionId: string | null;
  declare streamUrl: string | null;
  declare streamToken: string | null;
  declare expiresAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare user?: User;
  declare product?: Product | null;
  declare purchase?: Purchase | null;
}

Order.init(
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
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'product_id',
    },
    purchaseId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'purchase_id',
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
      type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'refunded'),
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'payment_method',
    },
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'transaction_id',
    },
    streamUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'stream_url',
    },
    streamToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'stream_token',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['product_id'] },
      { fields: ['purchase_id'] },
      { fields: ['status'] },
    ],
  }
);
