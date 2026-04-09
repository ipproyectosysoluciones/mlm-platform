/**
 * @fileoverview ShippingAddress - Shipping address model for delivery integration
 * @description Sequelize model for user shipping addresses with paranoid soft-delete.
 *             Modelo Sequelize para direcciones de envío de usuarios.
 * @module models/ShippingAddress
 * @author MLM Development Team
 *
 * @example
 * // English: Get user's default shipping address
 * const address = await ShippingAddress.findOne({ where: { userId, isDefault: true } });
 *
 * // Español: Obtener dirección de envío predeterminada del usuario
 * const address = await ShippingAddress.findOne({ where: { userId, isDefault: true } });
 */
import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import type { ShippingAddressAttributes } from '../types';

type ShippingAddressCreation = Optional<
  ShippingAddressAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ShippingAddress Model - Represents user shipping addresses
 * ShippingAddress Modelo - Representa direcciones de envío de usuarios
 */
export class ShippingAddress
  extends Model<ShippingAddressAttributes, ShippingAddressCreation>
  implements ShippingAddressAttributes
{
  declare id: string;
  declare userId: ForeignKey<string>;
  declare label: string | null;
  declare recipientName: string;
  declare street: string;
  declare city: string;
  declare state: string;
  declare postalCode: string;
  declare country: string;
  declare phone: string | null;
  declare isDefault: boolean;
  declare instructions: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ShippingAddress.init(
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
    label: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    recipientName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'recipient_name',
    },
    street: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'postal_code',
    },
    country: {
      type: DataTypes.STRING(3),
      allowNull: false,
      comment: 'ISO 3166-1 alpha-3 country code',
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default',
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'shipping_addresses',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['user_id', 'is_default'] }],
  }
);
