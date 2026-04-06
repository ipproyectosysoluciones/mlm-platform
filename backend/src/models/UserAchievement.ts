/**
 * @fileoverview UserAchievement - Junction model tracking unlocked achievements per user
 * @description Sequelize model for the user_achievements junction table.
 *             Records when a user unlocked a specific achievement and whether
 *             they have been notified.
 *             Modelo Sequelize para la tabla de unión user_achievements.
 *             Registra cuándo un usuario desbloqueó un logro y si fue notificado.
 * @module models/UserAchievement
 * @author MLM Development Team
 *
 * @example
 * // English: Get all achievements unlocked by a user
 * const unlocked = await UserAchievement.findAll({
 *   where: { userId: 'user-uuid' },
 *   include: [Achievement]
 * });
 *
 * // Español: Obtener todos los logros desbloqueados por un usuario
 * const unlocked = await UserAchievement.findAll({
 *   where: { userId: 'uuid-usuario' },
 *   include: [Achievement]
 * });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { Achievement } from './Achievement';
import type { User } from './User';

export interface UserAchievementAttributes {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  notified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserAchievementCreation = Optional<
  UserAchievementAttributes,
  'id' | 'notified' | 'createdAt' | 'updatedAt'
>;

/**
 * UserAchievement Model - Junction table tracking which achievements users have unlocked
 * Modelo UserAchievement - Tabla de unión que registra qué logros han desbloqueado los usuarios
 */
export class UserAchievement extends Model<UserAchievementAttributes, UserAchievementCreation> {
  declare id: string;
  declare userId: string;
  declare achievementId: string;
  declare unlockedAt: Date;
  declare notified: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare achievement?: Achievement;
  declare user?: User;
}

UserAchievement.init(
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
    achievementId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'achievement_id',
    },
    unlockedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'unlocked_at',
    },
    notified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'user_achievements',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['achievement_id'] },
      {
        unique: true,
        fields: ['user_id', 'achievement_id'],
        name: 'user_achievements_user_id_achievement_id_unique',
      },
    ],
  }
);
