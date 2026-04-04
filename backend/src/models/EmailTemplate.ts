/**
 * @fileoverview EmailTemplate Model - WYSIWYG email template for campaigns
 * @description Sequelize model representing email templates with variable validation, WYSIWYG state, and soft delete
 *              Modelo Sequelize representando templates de email con validación de variables, estado WYSIWYG y borrado suave
 * @module models/EmailTemplate
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Find active templates
 * const templates = await EmailTemplate.findAll({ where: { deletedAt: null } });
 *
 * // ES: Buscar templates activos
 * const templates = await EmailTemplate.findAll({ where: { deletedAt: null } });
 */

import { DataTypes, Model, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import type { EmailTemplateAttributes } from '../types';

type EmailTemplateCreation = Omit<EmailTemplateAttributes, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export class EmailTemplate extends Model<EmailTemplateAttributes, EmailTemplateCreation> {
  declare id: string;
  declare createdByUserId: ForeignKey<User['id']>;
  declare name: string;
  declare subjectLine: string;
  declare htmlContent: string;
  declare wysiwygState: Record<string, unknown>;
  declare variablesUsed: string[];
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare createdByUser?: User | null;
}

EmailTemplate.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    wysiwygState: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'wysiwyg_state',
    },
    variablesUsed: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
      field: 'variables_used',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'email_templates',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['created_by_user_id', 'created_at'], name: 'idx_email_templates_created_by' },
    ],
  }
);
