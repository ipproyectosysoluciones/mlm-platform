/**
 * @fileoverview WebhookEvent Model - Persistent idempotency store for payment webhooks
 * @description Sequelize model that tracks processed webhook events to prevent
 *   double-processing of the same event (idempotency). Replaces in-memory Set.
 *   Stores events from PayPal, MercadoPago, and any future payment providers.
 *
 * ES: Modelo Sequelize para almacenar eventos de webhook procesados.
 *   Evita el doble procesamiento cuando el proveedor reenvía el mismo evento.
 *
 * EN: Sequelize model to store processed webhook events.
 *   Prevents double-processing when the provider retries the same event.
 *
 * @module models/WebhookEvent
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Verificar si un evento ya fue procesado
 * const exists = await WebhookEvent.findOne({ where: { eventId: 'EVT-123', provider: 'paypal' } });
 * if (exists) return res.sendStatus(200); // idempotent
 *
 * // EN: Check if an event was already processed
 * const exists = await WebhookEvent.findOne({ where: { eventId: 'EVT-123', provider: 'paypal' } });
 * if (exists) return res.sendStatus(200); // idempotent
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/** Supported payment providers */
export type WebhookProvider = 'paypal' | 'mercadopago' | 'stripe';

export interface WebhookEventAttributes {
  id: string;
  /** Provider-assigned event/notification ID */
  eventId: string;
  /** Payment provider that sent the event */
  provider: WebhookProvider;
  /** Event type as reported by the provider, e.g. "PAYMENT.CAPTURE.COMPLETED" */
  eventType: string | null;
  /** ISO timestamp when the event was first received */
  processedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type WebhookEventCreation = Optional<
  WebhookEventAttributes,
  'id' | 'processedAt' | 'createdAt' | 'updatedAt'
>;

export class WebhookEvent extends Model<WebhookEventAttributes, WebhookEventCreation> {
  declare id: string;
  declare eventId: string;
  declare provider: WebhookProvider;
  declare eventType: string | null;
  declare processedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WebhookEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'event_id',
      comment: 'Provider-assigned event ID — unique per provider',
    },
    provider: {
      type: DataTypes.ENUM('paypal', 'mercadopago', 'stripe'),
      allowNull: false,
      comment: 'Payment provider that sent the webhook',
    },
    eventType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'event_type',
      comment: 'Event type string, e.g. PAYMENT.CAPTURE.COMPLETED',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'processed_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'webhook_events',
    underscored: true,
    indexes: [
      {
        // Composite unique index — same eventId can exist for different providers
        unique: true,
        fields: ['event_id', 'provider'],
        name: 'webhook_events_event_id_provider_unique',
      },
      {
        // Prune old records efficiently
        fields: ['processed_at'],
        name: 'webhook_events_processed_at_idx',
      },
    ],
  }
);
