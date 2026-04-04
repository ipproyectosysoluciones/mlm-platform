/**
 * @fileoverview EmailCampaignLog Model - Audit trail for campaign events
 * @description Sequelize model representing campaign audit log entries with event type and details
 *              Modelo Sequelize representando entradas de log de auditoría de campañas con tipo de evento y detalles
 * @module models/EmailCampaignLog
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Get all events for a campaign
 * const logs = await EmailCampaignLog.findAll({ where: { campaignId }, order: [['event_timestamp', 'DESC']] });
 *
 * // ES: Obtener todos los eventos de una campaña
 * const logs = await EmailCampaignLog.findAll({ where: { campaignId }, order: [['event_timestamp', 'DESC']] });
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import type { EmailCampaignLogAttributes } from '../types';

type EmailCampaignLogCreation = Omit<EmailCampaignLogAttributes, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: Date;
};

export class EmailCampaignLog extends Model<EmailCampaignLogAttributes, EmailCampaignLogCreation> {
  declare id: string;
  declare campaignId: string;
  declare campaignRecipientId: string | null;
  declare eventType: string;
  declare eventTimestamp: Date;
  declare details: Record<string, unknown>;
  declare readonly createdAt: Date;

  // Associations
  declare campaign?: import('./EmailCampaign').EmailCampaign | null;
  declare campaignRecipient?: import('./CampaignRecipient').CampaignRecipient | null;
}

EmailCampaignLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'campaign_id',
    },
    campaignRecipientId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'campaign_recipient_id',
    },
    eventType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'event_type',
    },
    eventTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'event_timestamp',
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'email_campaign_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['campaign_id', 'event_type'], name: 'idx_email_campaign_logs_campaign' },
      { fields: ['campaign_recipient_id'], name: 'idx_email_campaign_logs_recipient' },
    ],
  }
);
