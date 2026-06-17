/**
 * @fileoverview CommissionConfig Model - Configuration for commission rates by business type
 * @description Sequelize model for storing commission rate configurations
 *              Modelo Sequelize para almacenar configuraciones de tasas de comisión
 * @module models/CommissionConfig
 * @author MLM Development Team
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Business types for commission configuration
export const BUSINESS_TYPES = {
  SUSCRIPTION: 'suscripcion',
  PRODUCT: 'producto',
  MEMBERSHIP: 'membresia',
  SERVICE: 'servicio',
  OTHER: 'otro',
} as const;

export type BusinessType = (typeof BUSINESS_TYPES)[keyof typeof BUSINESS_TYPES];

/**
 * CommissionConfig attributes
 */
export interface CommissionConfigAttributes {
  id: string;
  businessType: BusinessType;
  customBusinessName?: string;
  level: string;
  percentage: number;
  isActive: boolean;
}

/**
 * CommissionConfig creation attributes
 */
export type CommissionConfigCreationAttributes = Optional<CommissionConfigAttributes, 'id'>;

export class CommissionConfig
  extends Model<CommissionConfigAttributes, CommissionConfigCreationAttributes>
  implements CommissionConfigAttributes
{
  declare id: string;
  declare businessType: BusinessType;
  declare customBusinessName?: string;
  declare level: string;
  declare percentage: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CommissionConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    businessType: {
      type: DataTypes.ENUM(
        BUSINESS_TYPES.SUSCRIPTION,
        BUSINESS_TYPES.PRODUCT,
        BUSINESS_TYPES.MEMBERSHIP,
        BUSINESS_TYPES.SERVICE,
        BUSINESS_TYPES.OTHER
      ),
      allowNull: false,
      field: 'business_type',
    },
    customBusinessName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'custom_business_name',
      comment: 'Custom name when business_type is "otro"',
    },
    level: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 4), // 0.0000 to 1.0000
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'commission_configs',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['business_type', 'level'] }, { fields: ['is_active'] }],
  }
);

export default CommissionConfig;
