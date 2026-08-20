/**
 * @fileoverview VendorMercadoPagoAccount Model
 * @description Sequelize model for the MercadoPago connection of a vendor:
 *              encrypted OAuth tokens and connection status (one per country).
 *              Modelo Sequelize de la conexión MercadoPago del vendedor.
 * @module models/VendorMercadoPagoAccount
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';
import type { VendorMercadoPagoAccountAttributes } from '../types/index.js';

type VendorMercadoPagoAccountCreation = Optional<
  VendorMercadoPagoAccountAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * VendorMercadoPagoAccount Model
 * Representa la cuenta MercadoPago conectada de un vendedor (una por país).
 */
export class VendorMercadoPagoAccount
  extends Model<VendorMercadoPagoAccountAttributes, VendorMercadoPagoAccountCreation>
  implements VendorMercadoPagoAccountAttributes
{
  declare id: string;
  declare vendorId: string;
  declare mpUserId: string | null;
  declare status: 'processing' | 'connected' | 'expired' | 'disconnected';
  declare country: string;
  declare accessTokenEncrypted: string | null;
  declare refreshTokenEncrypted: string | null;
  declare codeVerifierEncrypted: string | null;
  declare stateExpiresAt: Date | null;
  declare accessTokenExpiresAt: Date | null;
  declare lastConnectedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

VendorMercadoPagoAccount.init(
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
    mpUserId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'mp_user_id',
    },
    status: {
      type: DataTypes.ENUM('processing', 'connected', 'expired', 'disconnected'),
      allowNull: false,
      defaultValue: 'processing',
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: 'CO',
    },
    accessTokenEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'access_token_encrypted',
    },
    refreshTokenEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token_encrypted',
    },
    codeVerifierEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'code_verifier_encrypted',
    },
    stateExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'state_expires_at',
    },
    accessTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'access_token_expires_at',
    },
    lastConnectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_connected_at',
    },
  },
  {
    sequelize,
    modelName: 'VendorMercadoPagoAccount',
    tableName: 'vendor_mercadopago_accounts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'uq_vendor_mercadopago_accounts_vendor_country',
        fields: ['vendor_id', 'country'],
      },
    ],
  }
);

export default VendorMercadoPagoAccount;
