/**
 * @fileoverview EmailCampaign Model - Email campaign with lifecycle status tracking
 * @description Sequelize model representing email campaigns with scheduling, delivery stats, and recipient segments
 *              Modelo Sequelize representando campañas de email con programación, estadísticas de envío y segmentos
 * @module models/EmailCampaign
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Find campaigns in sending status
 * const sending = await EmailCampaign.findAll({ where: { status: 'sending' } });
 *
 * // ES: Buscar campañas en estado de envío
 * const sending = await EmailCampaign.findAll({ where: { status: 'sending' } });
 */

import { DataTypes, Model, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { EmailCampaignAttributes, EmailCampaignStatus } from '../types';

type EmailCampaignCreation = Omit<
  EmailCampaignAttributes,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'scheduledFor'
  | 'startedAt'
  | 'completedAt'
  | 'recipientSegment'
  | 'recipientCount'
  | 'sentCount'
  | 'failedCount'
  | 'deferredCount'
  | 'bounceCount'
  | 'openCount'
  | 'clickCount'
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: EmailCampaignStatus;
  scheduledFor?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  recipientSegment?: Record<string, unknown> | null;
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  deferredCount?: number;
  bounceCount?: number;
  openCount?: number;
  clickCount?: number;
};

export class EmailCampaign extends Model<EmailCampaignAttributes, EmailCampaignCreation> {
  declare id: string;
  declare createdByUserId: ForeignKey<User['id']>;
  declare emailTemplateId: string;
  declare name: string;
  declare status: EmailCampaignStatus;
  declare scheduledFor: Date | null;
  declare startedAt: Date | null;
  declare completedAt: Date | null;
  declare recipientSegment: Record<string, unknown> | null;
  declare recipientCount: number;
  declare sentCount: number;
  declare failedCount: number;
  declare deferredCount: number;
  declare bounceCount: number;
  declare openCount: number;
  declare clickCount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare createdByUser?: User | null;
  declare emailTemplate?: import('./EmailTemplate').EmailTemplate | null;
}

EmailCampaign.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    createdByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by_user_id',
    },
    emailTemplateId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'email_template_id',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_for',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    recipientSegment: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      field: 'recipient_segment',
    },
    recipientCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'recipient_count',
    },
    sentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sent_count',
    },
    failedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'failed_count',
    },
    deferredCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'deferred_count',
    },
    bounceCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'bounce_count',
    },
    openCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'open_count',
    },
    clickCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'click_count',
    },
  },
  {
    sequelize,
    tableName: 'email_campaigns',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['status'], name: 'idx_email_campaigns_status' },
      {
        fields: ['scheduled_for'],
        name: 'idx_email_campaigns_scheduled',
        where: { status: 'scheduled' },
      },
    ],
  }
);
