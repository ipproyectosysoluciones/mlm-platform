/**
 * @fileoverview CampaignRecipient Model - Per-recipient delivery tracking for campaigns
 * @description Sequelize model tracking individual recipient status within an email campaign
 *              Modelo Sequelize para seguimiento de estado individual de destinatarios en una campaña de email
 * @module models/CampaignRecipient
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Find failed recipients for a campaign
 * const failed = await CampaignRecipient.findAll({ where: { campaignId, status: 'failed' } });
 *
 * // ES: Buscar destinatarios fallidos para una campaña
 * const failed = await CampaignRecipient.findAll({ where: { campaignId, status: 'failed' } });
 */

import { DataTypes, Model, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { CampaignRecipientAttributes, CampaignRecipientStatus } from '../types';

type CampaignRecipientCreation = Omit<
  CampaignRecipientAttributes,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'openedAt'
  | 'firstClickAt'
  | 'clickCount'
  | 'sentAt'
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: CampaignRecipientStatus;
  openedAt?: Date | null;
  firstClickAt?: Date | null;
  clickCount?: number;
  sentAt?: Date | null;
};

export class CampaignRecipient extends Model<
  CampaignRecipientAttributes,
  CampaignRecipientCreation
> {
  declare id: string;
  declare campaignId: string;
  declare userId: ForeignKey<User['id']>;
  declare emailAddress: string;
  declare status: CampaignRecipientStatus;
  declare openedAt: Date | null;
  declare firstClickAt: Date | null;
  declare clickCount: number;
  declare sentAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare user?: User | null;
  declare campaign?: import('./EmailCampaign').EmailCampaign | null;
}

CampaignRecipient.init(
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
    status: {
      type: DataTypes.ENUM(
        'pending',
        'sent',
        'delivered',
        'opened',
        'clicked',
        'bounced',
        'failed'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    openedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'opened_at',
    },
    firstClickAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'first_click_at',
    },
    clickCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'click_count',
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at',
    },
  },
  {
    sequelize,
    tableName: 'campaign_recipients',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['campaign_id', 'status'], name: 'idx_campaign_recipients_campaign' },
      { fields: ['user_id'], name: 'idx_campaign_recipients_user' },
    ],
  }
);
