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

// Commission levels
export const COMMISSION_LEVELS = {
  DIRECT: 'direct',
  LEVEL_1: 'level_1',
  LEVEL_2: 'level_2',
  LEVEL_3: 'level_3',
  LEVEL_4: 'level_4',
} as const;

export type CommissionLevel = (typeof COMMISSION_LEVELS)[keyof typeof COMMISSION_LEVELS];

/**
 * CommissionConfig attributes
 */
export interface CommissionConfigAttributes {
  id: string;
  businessType: BusinessType;
  customBusinessName?: string;
  level: CommissionLevel;
  percentage: number;
  isActive: boolean;
}

/**
 * CommissionConfig creation attributes
 */
export interface CommissionConfigCreationAttributes extends Optional<
  CommissionConfigAttributes,
  'id'
> {}

export class CommissionConfig
  extends Model<CommissionConfigAttributes, CommissionConfigCreationAttributes>
  implements CommissionConfigAttributes
{
  declare id: string;
  declare businessType: BusinessType;
  declare customBusinessName?: string;
  declare level: CommissionLevel;
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
      type: DataTypes.ENUM(
        COMMISSION_LEVELS.DIRECT,
        COMMISSION_LEVELS.LEVEL_1,
        COMMISSION_LEVELS.LEVEL_2,
        COMMISSION_LEVELS.LEVEL_3,
        COMMISSION_LEVELS.LEVEL_4
      ),
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
