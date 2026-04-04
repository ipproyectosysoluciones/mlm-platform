/**
 * @fileoverview DeliveryProvider - Delivery provider model for shipment tracking
 * @description Sequelize model for delivery service providers (e.g., FedEx, UPS, DHL).
 *             Modelo Sequelize para proveedores de envío.
 * @module models/DeliveryProvider
 * @author MLM Development Team
 *
 * @example
 * // English: Get all active delivery providers
 * const providers = await DeliveryProvider.findAll({ where: { isActive: true } });
 *
 * // Español: Obtener todos los proveedores de envío activos
 * const providers = await DeliveryProvider.findAll({ where: { isActive: true } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { DeliveryProviderAttributes, DeliveryProviderCreationAttributes } from '../types';

type DeliveryProviderCreation = Optional<
  DeliveryProviderAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * DeliveryProvider Model - Represents delivery service providers
 * DeliveryProvider Modelo - Representa proveedores de servicios de envío
 */
export class DeliveryProvider
  extends Model<DeliveryProviderAttributes, DeliveryProviderCreation>
  implements DeliveryProviderAttributes
{
  declare id: string;
  declare name: string;
  declare slug: string;
  declare trackingUrlTemplate: string | null;
  declare webhookSecret: string | null;
  declare isActive: boolean;
  declare metadata: Record<string, unknown> | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DeliveryProvider.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    trackingUrlTemplate: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'tracking_url_template',
      comment: 'Template for tracking URL, e.g., https://example.com/track/{tracking}',
    },
    webhookSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'webhook_secret',
      comment: 'Secret for webhook signature validation (HMAC-SHA256)',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'delivery_providers',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['slug'], unique: true }, { fields: ['is_active'] }],
  }
);
