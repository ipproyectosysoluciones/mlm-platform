/**
 * @fileoverview AffiliateContract Model - User contract acceptance record
 * @description Sequelize model representing user contract acceptances with hash + metadata
 * @module models/AffiliateContract
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Registrar aceptación de contrato
 * const contract = await AffiliateContract.create({
 *   userId: 'user-uuid',
 *   templateId: 'template-uuid',
 *   status: 'ACCEPTED',
 *   signedAt: new Date(),
 *   ipAddress: '192.168.1.1',
 *   contentHash: 'sha256hash...'
 * });
 *
 * // EN: Record contract acceptance
 * const contract = await AffiliateContract.create({
 *   userId: 'user-uuid',
 *   templateId: 'template-uuid',
 *   status: 'ACCEPTED',
 *   signedAt: new Date(),
 *   ipAddress: '192.168.1.1',
 *   contentHash: 'sha256hash...'
 * });
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type {
  AffiliateContractAttributes,
  AffiliateContractCreationAttributes,
  ContractStatus,
} from '../types';

type AffiliateContractCreation = Optional<
  AffiliateContractAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * AffiliateContract - Records user contract acceptance for legal compliance
 * AffiliateContract - Registra aceptación de contratos de usuarios para cumplimiento legal
 */
export class AffiliateContract
  extends Model<AffiliateContractAttributes, AffiliateContractCreation>
  implements AffiliateContractAttributes
{
  declare id: string;
  declare userId: string;
  declare templateId: string;
  declare status: ContractStatus;
  declare signedAt: Date | null;
  declare ipAddress: string;
  declare userAgent: string | null;
  declare contentHash: string;
  declare revokedAt: Date | null;
  declare revokedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AffiliateContract.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'template_id',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED'),
      defaultValue: 'PENDING',
    },
    signedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When accepted',
      field: 'signed_at',
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: false,
      comment: 'IPv4/IPv6',
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
    },
    contentHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'Hash of content at time of signing',
      field: 'content_hash',
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at',
    },
    revokedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'revoked_by',
    },
  },
  {
    sequelize,
    tableName: 'affiliate_contracts',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['user_id', 'template_id'] },
      { fields: ['user_id'] },
      { fields: ['template_id'] },
      { fields: ['status'] },
    ],
  }
);
