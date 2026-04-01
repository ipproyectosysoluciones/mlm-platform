/**
 * @fileoverview PushSubscription - Model for Web Push notification subscriptions
 * @description Sequelize model for storing browser push notification subscriptions.
 *             Used for sending push notifications to users via their browsers.
 * @module models/PushSubscription
 * @author MLM Development Team
 *
 * @example
 * // English: Get all subscriptions for a user
 * const subscriptions = await PushSubscription.findAll({ where: { userId: userId } });
 *
 * // Español: Obtener todas las suscripciones de un usuario
 * const subscriptions = await PushSubscription.findAll({ where: { userId: userId } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PushSubscriptionAttributes {
  id: string;
  userId: string | null;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  browser: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type PushSubscriptionCreation = Optional<
  PushSubscriptionAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * PushSubscription Model - Stores browser push notification subscriptions
 * Modelo PushSubscription - Almacena suscripciones de notificaciones push del navegador
 */
export class PushSubscription extends Model<PushSubscriptionAttributes, PushSubscriptionCreation> {
  declare id: string;
  declare userId: string | null;
  declare endpoint: string;
  declare keys: {
    p256dh: string;
    auth: string;
  };
  declare browser: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PushSubscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    keys: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'JSON object containing p256dh and auth keys from PushSubscription',
    },
    browser: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Browser name (chrome, firefox, safari, edge)',
    },
  },
  {
    sequelize,
    tableName: 'push_subscriptions',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['endpoint'] }, { fields: ['created_at'] }],
  }
);
