/**
 * @fileoverview EmailQueue Model - Transactional email queue with retry logic
 * @description Sequelize model representing the email delivery queue with Brevo tracking and exponential backoff
 *              Modelo Sequelize representando la cola de envío de emails con tracking Brevo y backoff exponencial
 * @module models/EmailQueue
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Find pending queue items ready for processing
 * const pending = await EmailQueue.findAll({ where: { status: 'pending' } });
 *
 * // ES: Buscar items pendientes listos para procesamiento
 * const pending = await EmailQueue.findAll({ where: { status: 'pending' } });
 */

import { DataTypes, Model, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { EmailQueueAttributes, EmailQueueStatus } from '../types';

type EmailQueueCreation = Omit<
  EmailQueueAttributes,
  | 'id'
  | 'createdAt'
  | 'status'
  | 'retryCount'
  | 'nextRetryAt'
  | 'lastError'
  | 'brevoMessageId'
  | 'brevoResponse'
  | 'processedAt'
> & {
  id?: string;
  createdAt?: Date;
  status?: EmailQueueStatus;
  retryCount?: number;
  nextRetryAt?: Date | null;
  lastError?: string | null;
  brevoMessageId?: string | null;
  brevoResponse?: Record<string, unknown> | null;
  processedAt?: Date | null;
};

export class EmailQueue extends Model<EmailQueueAttributes, EmailQueueCreation> {
  declare id: string;
  declare campaignId: string;
  declare campaignRecipientId: string;
  declare userId: ForeignKey<User['id']>;
  declare emailAddress: string;
  declare subjectLine: string;
  declare htmlContent: string;
  declare status: EmailQueueStatus;
  declare retryCount: number;
  declare nextRetryAt: Date | null;
  declare lastError: string | null;
  declare brevoMessageId: string | null;
  declare brevoResponse: Record<string, unknown> | null;
  declare readonly createdAt: Date;
  declare processedAt: Date | null;

  // Associations
  declare user?: User | null;
  declare campaign?: import('./EmailCampaign').EmailCampaign | null;
  declare campaignRecipient?: import('./CampaignRecipient').CampaignRecipient | null;
}

EmailQueue.init(
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
      allowNull: false,
      field: 'campaign_recipient_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    emailAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'email_address',
    },
    subjectLine: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'subject_line',
    },
    htmlContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'html_content',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'sent', 'deferred', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'retry_count',
    },
    nextRetryAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_retry_at',
    },
    lastError: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'last_error',
    },
    brevoMessageId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'brevo_message_id',
    },
    brevoResponse: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      field: 'brevo_response',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at',
    },
  },
  {
    sequelize,
    tableName: 'email_queue',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['status', 'next_retry_at'],
        name: 'idx_email_queue_status_retry',
        where: { status: ['pending', 'deferred'] },
      },
      { fields: ['campaign_id'], name: 'idx_email_queue_campaign' },
    ],
  }
);
