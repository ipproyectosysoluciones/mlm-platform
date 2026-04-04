/**
 * @fileoverview ContractTemplate Model - Contract template entity for legal compliance
 * @description Sequelize model representing contract templates with version tracking
 * @module models/ContractTemplate
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Crear template de contrato
 * const template = await ContractTemplate.create({
 *   type: 'AFFILIATE_AGREEMENT',
 *   version: '1.0.0',
 *   title: 'Acuerdo de Afiliado',
 *   content: '<h1>Acuerdo de Afiliado</h1>...',
 *   contentHash: 'sha256hash...',
 *   effectiveFrom: new Date()
 * });
 *
 * // EN: Create contract template
 * const template = await ContractTemplate.create({
 *   type: 'AFFILIATE_AGREEMENT',
 *   version: '1.0.0',
 *   title: 'Affiliate Agreement',
 *   content: '<h1>Affiliate Agreement</h1>...',
 *   contentHash: 'sha256hash...',
 *   effectiveFrom: new Date()
 * });
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type {
  ContractTemplateAttributes,
  ContractTemplateCreationAttributes,
  ContractType,
} from '../types';
import crypto from 'crypto';

type ContractTemplateCreation = Optional<
  ContractTemplateAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ContractTemplate - Manages contract versions for legal compliance
 * ContractTemplate - Gestiona versiones de contratos para cumplimiento legal
 */
export class ContractTemplate
  extends Model<ContractTemplateAttributes, ContractTemplateCreation>
  implements ContractTemplateAttributes
{
  declare id: string;
  declare type: ContractType;
  declare version: string;
  declare title: string;
  declare content: string;
  declare contentHash: string;
  declare effectiveFrom: Date;
  declare effectiveTo: Date | null;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /**
   * Compute SHA256 hash of content
   * Calcular hash SHA256 del contenido
   */
  static computeContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

ContractTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(
        'AFFILIATE_AGREEMENT',
        'COMPENSATION_PLAN',
        'PRIVACY_POLICY',
        'TERMS_OF_SERVICE'
      ),
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'e.g., "1.0.0"',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Full contract HTML',
    },
    contentHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'SHA256 of content at creation time',
      field: 'content_hash',
    },
    effectiveFrom: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'effective_from',
    },
    effectiveTo: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'NULL = current active version',
      field: 'effective_to',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'contract_templates',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['type', 'is_active'] },
      { fields: ['effective_from'] },
    ],
  }
);
