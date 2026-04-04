/**
 * @fileoverview VendorPayout Model - Vendor payout entity for marketplace
 * @description Sequelize model representing vendor payout requests
 * @module models/VendorPayout
 * @author MLM Development Team
 *
 * @example
 * // English: Get pending payouts for a vendor
 * const payouts = await VendorPayout.findAll({
 *   where: { vendorId, status: 'pending' }
 * });
 *
 * // Español: Obtener pagos pendientes de un vendedor
 * const payouts = await VendorPayout.findAll({
 *   where: { vendorId, status: 'pending' }
 * });
 */
import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import type { VendorPayoutAttributes, VendorPayoutCreationAttributes } from '../types';
import type { Vendor } from './Vendor';

type VendorPayoutCreation = Optional<VendorPayoutAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * VendorPayout Model - Represents vendor payout requests
 * Modelo de Pago a Vendedor - Representa solicitudes de pago a vendedores
 */
export class VendorPayout
  extends Model<VendorPayoutAttributes, VendorPayoutCreation>
  implements VendorPayoutAttributes
{
  declare id: string;
  declare vendorId: ForeignKey<Vendor['id']>;
  declare amount: number;
  declare currency: string;
  declare status: 'pending' | 'processing' | 'completed' | 'failed';
  declare paymentMethod: string | null;
  declare paymentReference: string | null;
  declare periodStart: Date | null;
  declare periodEnd: Date | null;
  declare requestedAt: Date;
  declare processedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

VendorPayout.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'vendor_id',
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'payment_method',
    },
    paymentReference: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'payment_reference',
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'period_start',
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'period_end',
    },
    requestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'requested_at',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at',
    },
  },
  {
    sequelize,
    tableName: 'vendor_payouts',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['vendor_id'] }, { fields: ['status'] }, { fields: ['requested_at'] }],
  }
);
