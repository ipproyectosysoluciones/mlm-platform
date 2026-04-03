/**
 * @fileoverview AchievementService - Core logic for the Achievements & Badges feature
 * @description Handles seeding, checking, and unlocking achievements for users.
 *             Gestiona el sembrado, verificación y desbloqueo de logros para usuarios.
 * @module services/AchievementService
 * @author MLM Development Team
 *
 * @example
 * // English: Check and unlock achievements after an order
 * achievementService.checkAndUnlock(userId, 'sale_completed')
 *   .catch(err => console.error('[Achievements]', err));
 *
 * // Español: Verificar y desbloquear logros después de un pedido
 * achievementService.checkAndUnlock(userId, 'sale_completed')
 *   .catch(err => console.error('[Achievements]', err));
 */
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { Achievement, Badge, UserAchievement } from '../models';
import type { AchievementConditionType } from '../models/Achievement';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Trigger events that can unlock achievements
 * Eventos que pueden desbloquear logros
 */
export type AchievementTrigger = 'referral_added' | 'sale_completed' | 'login' | 'binary_update';

/**
 * Maps each trigger to the conditionTypes it should evaluate
 * Mapea cada trigger a los conditionTypes que debe evaluar
 */
const TRIGGER_MAP: Record<AchievementTrigger, AchievementConditionType[]> = {
  referral_added: ['count_referrals', 'binary_balance'],
  sale_completed: ['sales_count', 'sales_amount'],
  login: ['login_streak'],
  binary_update: ['binary_balance'],
};

/**
 * Shape returned by getUserAchievements
 * Forma devuelta por getUserAchievements
 */
export interface AchievementWithProgress {
  achievement: Achievement;
  badge: Badge | null;
  unlockedAt: Date | null;
  progress: {
    current: number;
    required: number;
  };
}

// ─── Seed data ────────────────────────────────────────────────────────────────

/**
 * The 8 canonical achievements to seed on startup.
 * conditionType must match the DB ENUM: count_referrals | sales_amount | sales_count | login_streak | binary_balance
 *
 * NOTE: 'network_depth' is not a valid conditionType ENUM value in the DB.
 * The 'network_depth_5' achievement uses 'sales_count' as its conditionType field
 * but the actual progress check is done by key ('network_depth_5') in getProgressForUser.
 *
 * NOTE: 'platinum' is not a valid tier ENUM in the DB (bronze|silver|gold).
 * 'top_seller' (50 sales) uses 'gold' as the closest tier.
 */
const ACHIEVEMENTS_SEED = [
  {
    key: 'first_sale',
    name: 'Primera Venta',
    description: 'Realiza tu primera venta completada.',
    icon: '🎯',
    points: 100,
    conditionType: 'sales_count' as AchievementConditionType,
    conditionValue: 1,
    tier: 'bronze' as const,
    status: 'active' as const,
  },
  {
    key: 'ten_sales',
    name: 'Diez Ventas',
    description: 'Alcanza 10 ventas completadas.',
    icon: '💰',
    points: 300,
    conditionType: 'sales_count' as AchievementConditionType,
    conditionValue: 10,
    tier: 'silver' as const,
    status: 'active' as const,
  },
  {
    key: 'first_referral',
    name: 'Primer Referido',
    description: 'Agrega tu primer referido a la red.',
    icon: '🤝',
    points: 150,
    conditionType: 'count_referrals' as AchievementConditionType,
    conditionValue: 1,
    tier: 'bronze' as const,
    status: 'active' as const,
  },
  {
    key: 'five_referrals',
    name: 'Cinco Referidos',
    description: 'Lleva 5 referidos a tu red.',
    icon: '👥',
    points: 400,
    conditionType: 'count_referrals' as AchievementConditionType,
    conditionValue: 5,
    tier: 'silver' as const,
    status: 'active' as const,
  },
  {
    key: 'binary_balance',
    name: 'Balance Binario',
    description: 'Tiene al menos un referido en cada lado del árbol binario.',
    icon: '⚖️',
    points: 500,
    conditionType: 'binary_balance' as AchievementConditionType,
    conditionValue: 1,
    tier: 'gold' as const,
    status: 'active' as const,
  },
  {
    key: 'network_depth_5',
    name: 'Red Profunda',
    description: 'Tu red alcanza una profundidad de 5 niveles.',
    icon: '🌳',
    points: 600,
    // NOTE: 'network_depth' not in ENUM — stored as 'sales_count' but
    // getProgressForUser uses the achievement key for the actual depth query
    conditionType: 'sales_count' as AchievementConditionType,
    conditionValue: 5,
    tier: 'gold' as const,
    status: 'active' as const,
  },
  {
    key: 'top_seller',
    name: 'Top Vendedor',
    description: 'Completa 50 ventas. ¡Eres el mejor vendedor!',
    icon: '🏆',
    points: 1000,
    conditionType: 'sales_count' as AchievementConditionType,
    conditionValue: 50,
    // NOTE: 'platinum' not in DB ENUM — using 'gold' as the highest tier
    tier: 'gold' as const,
    status: 'active' as const,
  },
  {
    key: 'consistency_30',
    name: 'Constancia 30 Días',
    description: 'Inicia sesión 30 días consecutivos.',
    icon: '🔥',
    points: 800,
    conditionType: 'login_streak' as AchievementConditionType,
    conditionValue: 30,
    tier: 'gold' as const,
    // MUST be coming_soon — login streak logic not yet implemented
    status: 'coming_soon' as const,
  },
] as const;

// ─── Service ──────────────────────────────────────────────────────────────────

export class AchievementService {
  // ── Seed ──────────────────────────────────────────────────────────────────

  /**
   * Idempotent upsert of the 8 canonical achievements.
   * Safe to call on every server startup.
   * Upsert idempotente de los 8 logros canónicos. Seguro de llamar en cada inicio del servidor.
   */
  async seedAchievements(): Promise<void> {
    for (const data of ACHIEVEMENTS_SEED) {
      await (Achievement as any).upsert(
        {
          key: data.key,
          name: data.name,
          description: data.description ?? null,
          icon: data.icon ?? null,
          conditionType: data.conditionType,
          conditionValue: data.conditionValue,
          tier: data.tier,
          points: data.points,
          status: data.status,
        },
        { conflictFields: ['key'] }
      );
    }
    console.log('✅ Achievements seeded (8 records upserted)');
  }

  // ── Progress helpers ───────────────────────────────────────────────────────

  /**
   * Get the current progress value for a given user and achievement.
   * Returns a number to compare against achievement.conditionValue.
   *
   * Obtiene el valor de progreso actual para un usuario y logro dados.
   */
  private async getProgressForUser(userId: string, achievement: Achievement): Promise<number> {
    const { conditionType, key } = achievement;

    // Special case: network_depth_5 uses UserClosure depth query
    if (key === 'network_depth_5') {
      const rows = await sequelize.query<{ maxDepth: number }>(
        `SELECT MAX(depth) AS maxDepth FROM user_closure WHERE ancestor_id = :userId AND ancestor_id != descendant_id`,
        { replacements: { userId }, type: QueryTypes.SELECT }
      );
      return rows[0]?.maxDepth ?? 0;
    }

    switch (conditionType) {
      case 'sales_count': {
        const rows = await sequelize.query<{ cnt: number }>(
          `SELECT COUNT(*) AS cnt FROM orders WHERE user_id = :userId AND status = 'completed'`,
          { replacements: { userId }, type: QueryTypes.SELECT }
        );
        return Number(rows[0]?.cnt ?? 0);
      }

      case 'sales_amount': {
        const rows = await sequelize.query<{ total: number }>(
          `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE user_id = :userId AND status = 'completed'`,
          { replacements: { userId }, type: QueryTypes.SELECT }
        );
        return Number(rows[0]?.total ?? 0);
      }

      case 'count_referrals': {
        const rows = await sequelize.query<{ cnt: number }>(
          `SELECT COUNT(*) AS cnt FROM users WHERE sponsor_id = :userId`,
          { replacements: { userId }, type: QueryTypes.SELECT }
        );
        return Number(rows[0]?.cnt ?? 0);
      }

      case 'binary_balance': {
        // Both sides must have at least conditionValue users
        const leftRows = await sequelize.query<{ cnt: number }>(
          `SELECT COUNT(*) AS cnt FROM users WHERE sponsor_id = :userId AND position = 'left'`,
          { replacements: { userId }, type: QueryTypes.SELECT }
        );
        const rightRows = await sequelize.query<{ cnt: number }>(
          `SELECT COUNT(*) AS cnt FROM users WHERE sponsor_id = :userId AND position = 'right'`,
          { replacements: { userId }, type: QueryTypes.SELECT }
        );
        const leftCount = Number(leftRows[0]?.cnt ?? 0);
        const rightCount = Number(rightRows[0]?.cnt ?? 0);
        // Return the minimum of both sides — condition met when both sides >= conditionValue
        return Math.min(leftCount, rightCount);
      }

      case 'login_streak': {
        // login_streak logic not yet implemented; consistency_30 is coming_soon
        // This is a placeholder for future streak tracking
        const rows = await sequelize.query<{ loginStreak: number }>(
          `SELECT login_streak AS loginStreak FROM users WHERE id = :userId`,
          { replacements: { userId }, type: QueryTypes.SELECT }
        );
        return Number(rows[0]?.loginStreak ?? 0);
      }

      default:
        return 0;
    }
  }

  // ── Check & Unlock ─────────────────────────────────────────────────────────

  /**
   * Check all relevant achievements for a user based on a trigger event.
   * Unlocks any achievement whose condition is now met.
   * This method NEVER throws — errors are caught and logged internally.
   *
   * Verifica todos los logros relevantes para un usuario basado en un evento.
   * Desbloquea cualquier logro cuya condición esté cumplida.
   * Este método NUNCA lanza excepciones.
   *
   * @param userId - User UUID
   * @param trigger - The event that triggered this check
   */
  async checkAndUnlock(userId: string, trigger: AchievementTrigger): Promise<void> {
    try {
      const conditionTypes = TRIGGER_MAP[trigger];
      if (!conditionTypes || conditionTypes.length === 0) return;

      // Fetch all active achievements matching this trigger's conditionTypes
      // Also handle network_depth_5 (stored as sales_count) when trigger is referral_added
      const achievements = await Achievement.findAll({
        where: {
          status: 'active',
          conditionType: conditionTypes,
        },
      });

      // Additionally check network_depth_5 on referral_added trigger (tree grows on referral)
      if (trigger === 'referral_added' || trigger === 'binary_update') {
        const depthAchievement = await Achievement.findOne({
          where: { key: 'network_depth_5', status: 'active' },
        });
        if (depthAchievement && !achievements.find((a) => a.key === 'network_depth_5')) {
          achievements.push(depthAchievement);
        }
      }

      if (achievements.length === 0) return;

      // Get already-unlocked achievement IDs for this user (single query)
      const alreadyUnlocked = await UserAchievement.findAll({
        where: { userId },
        attributes: ['achievementId'],
      });
      const unlockedIds = new Set(alreadyUnlocked.map((ua) => ua.achievementId));

      for (const achievement of achievements) {
        // Skip if already unlocked
        if (unlockedIds.has(achievement.id)) continue;

        const progress = await this.getProgressForUser(userId, achievement);

        if (progress >= achievement.conditionValue) {
          const [, created] = await UserAchievement.findOrCreate({
            where: { userId, achievementId: achievement.id },
            defaults: {
              userId,
              achievementId: achievement.id,
              unlockedAt: new Date(),
              notified: false,
            },
          });

          if (created) {
            console.log(
              `[Achievements] 🏆 User ${userId} unlocked "${achievement.name}" (${achievement.key})`
            );
          }
        }
      }
    } catch (err) {
      console.error('[Achievements] checkAndUnlock error:', err);
      // Never propagate — fire-and-forget safety
    }
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  /**
   * Get all achievements with the user's unlock status and progress.
   * Returns every achievement (active + coming_soon), ordered by tier.
   *
   * Obtiene todos los logros con el estado de desbloqueo y progreso del usuario.
   *
   * @param userId - User UUID
   */
  async getUserAchievements(userId: string): Promise<AchievementWithProgress[]> {
    const achievements = await Achievement.findAll({
      where: { status: ['active', 'coming_soon'] },
      include: [
        { model: Badge, as: 'badge' },
        {
          model: UserAchievement,
          as: 'userAchievements',
          where: { userId },
          required: false,
        },
      ],
      order: [
        ['tier', 'ASC'],
        ['points', 'ASC'],
      ],
    });

    const results: AchievementWithProgress[] = [];

    for (const achievement of achievements) {
      const userAchievements = (achievement as any).userAchievements as UserAchievement[];
      const unlocked = userAchievements && userAchievements.length > 0 ? userAchievements[0] : null;

      let current = 0;
      if (achievement.status === 'active') {
        current = await this.getProgressForUser(userId, achievement);
      }

      results.push({
        achievement,
        badge: (achievement as any).badge ?? null,
        unlockedAt: unlocked?.unlockedAt ?? null,
        progress: {
          current,
          required: achievement.conditionValue,
        },
      });
    }

    return results;
  }

  /**
   * Get all active + coming_soon achievements (public listing).
   * Does not include user-specific progress.
   *
   * Obtiene todos los logros activos y próximamente (listado público).
   */
  async getAllAchievements(): Promise<Achievement[]> {
    return Achievement.findAll({
      where: { status: ['active', 'coming_soon'] },
      include: [{ model: Badge, as: 'badge' }],
      order: [
        ['tier', 'ASC'],
        ['points', 'ASC'],
      ],
    });
  }
}

export const achievementService = new AchievementService();
