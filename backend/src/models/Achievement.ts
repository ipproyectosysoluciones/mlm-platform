/**
 * @fileoverview Achievement - Model for the Achievements & Badges feature
 * @description Sequelize model representing an achievement definition.
 *             Each achievement has a condition that must be met to unlock it.
 *             Modelo Sequelize que representa un logro con su condición de desbloqueo.
 * @module models/Achievement
 * @author MLM Development Team
 *
 * @example
 * // English: Find all active achievements
 * const achievements = await Achievement.findAll({ where: { status: 'active' } });
 *
 * // Español: Buscar todos los logros activos
 * const achievements = await Achievement.findAll({ where: { status: 'active' } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AchievementConditionType =
  | 'count_referrals'
  | 'sales_amount'
  | 'sales_count'
  | 'login_streak'
  | 'network_balance';

export type AchievementTier = 'bronze' | 'silver' | 'gold';

export type AchievementStatus = 'active' | 'coming_soon' | 'disabled';

export interface AchievementAttributes {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  conditionType: AchievementConditionType;
  conditionValue: number;
  tier: AchievementTier;
  points: number;
  status: AchievementStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

type AchievementCreation = Optional<
  AchievementAttributes,
  'id' | 'description' | 'icon' | 'points' | 'status' | 'createdAt' | 'updatedAt'
>;

/**
 * Achievement Model - Represents an achievement definition in the MLM platform
 * Modelo Achievement - Representa la definición de un logro en la plataforma MLM
 */
export class Achievement extends Model<AchievementAttributes, AchievementCreation> {
  declare id: string;
  declare key: string;
  declare name: string;
  declare description: string | null;
  declare icon: string | null;
  declare conditionType: AchievementConditionType;
  declare conditionValue: number;
  declare tier: AchievementTier;
  declare points: number;
  declare status: AchievementStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations / Asociaciones
  declare userAchievements?: import('./UserAchievement').UserAchievement[];
  declare badge?: import('./Badge').Badge | null;
}

Achievement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // unique constraint managed via indexes (Sequelize v6 sync bug workaround)
      comment: 'Unique identifier for the achievement (e.g. first_sale, team_10)',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Emoji icon for the achievement',
    },
    conditionType: {
      type: DataTypes.ENUM(
        'count_referrals',
        'sales_amount',
        'sales_count',
        'login_streak',
        'network_balance'
      ),
      allowNull: false,
      field: 'condition_type',
    },
    conditionValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'condition_value',
    },
    tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold'),
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('active', 'coming_soon', 'disabled'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'achievements',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['key'] },
      { fields: ['status'] },
      { fields: ['condition_type'] },
      { fields: ['tier'] },
    ],
  }
);
