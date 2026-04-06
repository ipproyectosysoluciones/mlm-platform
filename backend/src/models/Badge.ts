/**
 * @fileoverview Badge - Model for achievement badges (images/visual assets)
 * @description Sequelize model representing a visual badge linked to an achievement.
 *             Each achievement can have one badge with its image URL and description.
 *             Modelo Sequelize que representa una insignia visual vinculada a un logro.
 * @module models/Badge
 * @author MLM Development Team
 *
 * @example
 * // English: Get badge for an achievement
 * const badge = await Badge.findOne({ where: { achievementId: 'uuid' } });
 *
 * // Español: Obtener insignia de un logro
 * const badge = await Badge.findOne({ where: { achievementId: 'uuid' } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { Achievement } from './Achievement';

export interface BadgeAttributes {
  id: string;
  achievementId: string;
  imageUrl: string | null;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type BadgeCreation = Optional<
  BadgeAttributes,
  'id' | 'imageUrl' | 'description' | 'createdAt' | 'updatedAt'
>;

/**
 * Badge Model - Visual badge linked to an achievement
 * Modelo Badge - Insignia visual vinculada a un logro
 */
export class Badge extends Model<BadgeAttributes, BadgeCreation> {
  declare id: string;
  declare achievementId: string;
  declare imageUrl: string | null;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Association
  declare achievement?: Achievement;
}

Badge.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    achievementId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'achievement_id',
      references: {
        model: 'achievements',
        key: 'id',
      },
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url',
      comment: 'URL to the badge image',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'badges',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['achievement_id'] }],
  }
);
