/**
 * @fileoverview Vendor Model - Vendor entity for multi-vendor marketplace
 * @description Sequelize model representing vendors in the marketplace
 * @module models/Vendor
 * @author MLM Development Team
 *
 * @example
 * // English: Get vendor by user ID
 * const vendor = await Vendor.findOne({ where: { userId: userId } });
 *
 * // Español: Obtener vendedor por ID de usuario
 * const vendor = await Vendor.findOne({ where: { userId: idUsuario } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { VendorAttributes, VendorCreationAttributes } from '../types';

type VendorCreation = Optional<VendorAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Vendor Model - Represents a vendor in the multi-vendor marketplace
 * Modelo de Vendedor - Representa un vendedor en el marketplace multi-vendedor
 */
export class Vendor extends Model<VendorAttributes, VendorCreation> implements VendorAttributes {
  declare id: string;
  declare userId: string;
  declare businessName: string;
  declare slug: string;
  declare description: string | null;
  declare logoUrl: string | null;
  declare status: 'pending' | 'approved' | 'suspended' | 'rejected';
  declare commissionRate: number;
  declare contactEmail: string;
  declare contactPhone: string | null;
  declare address: Record<string, unknown> | null;
  declare bankDetails: Record<string, unknown> | null;
  declare metadata: Record<string, unknown> | null;
  declare approvedAt: Date | null;
  declare approvedBy: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Vendor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'business_name',
      validate: {
        len: [1, 255],
      },
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'logo_url',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'suspended', 'rejected'),
      defaultValue: 'pending',
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 0.7,
      field: 'commission_rate',
      comment: 'Vendor commission rate (e.g., 0.7000 = 70%)',
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contact_email',
      validate: {
        isEmail: true,
      },
    },
    contactPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'contact_phone',
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    bankDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'bank_details',
      comment: 'Encrypted bank details for payouts',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approved_by',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'vendors',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['user_id'] },
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
    ],
  }
);
