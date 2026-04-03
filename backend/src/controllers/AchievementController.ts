/**
 * @fileoverview AchievementController - REST endpoints for the Achievements feature
 * @description Handles GET /api/achievements and GET /api/achievements/me endpoints.
 *             Gestiona los endpoints de logros del usuario y listado público.
 * @module controllers/AchievementController
 * @author MLM Development Team
 *
 * @example
 * // English: Get all achievements with user progress
 * GET /api/achievements
 *
 * // Español: Obtener todos los logros con progreso del usuario
 * GET /api/achievements
 */
import { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { achievementService, AchievementWithProgress } from '../services/AchievementService';

export class AchievementController {
  /**
   * GET /api/achievements
   * Returns all achievements (active + coming_soon) with the authenticated user's
   * unlock status and current progress for each.
   *
   * Devuelve todos los logros con el estado de desbloqueo y progreso del usuario autenticado.
   */
  getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const data = await achievementService.getUserAchievements(userId);

    res.json({
      success: true,
      data: data.map((item: AchievementWithProgress) => ({
        id: item.achievement.id,
        key: item.achievement.key,
        name: item.achievement.name,
        description: item.achievement.description,
        icon: item.achievement.icon,
        conditionType: item.achievement.conditionType,
        conditionValue: item.achievement.conditionValue,
        tier: item.achievement.tier,
        points: item.achievement.points,
        status: item.achievement.status,
        badge: item.badge
          ? {
              id: item.badge.id,
              imageUrl: item.badge.imageUrl,
              description: item.badge.description,
            }
          : null,
        unlockedAt: item.unlockedAt ?? null,
        progress: Math.round((item.progress.current / item.progress.required) * 100),
        currentValue: item.progress.current,
        targetValue: item.progress.required,
      })),
    });
  };

  /**
   * GET /api/achievements/me
   * Returns only the achievements this user has already unlocked,
   * including unlock dates.
   *
   * Devuelve solo los logros que el usuario ya desbloqueó, con sus fechas de desbloqueo.
   */
  getMy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const all = await achievementService.getUserAchievements(userId);

    const unlocked = all.filter((item: AchievementWithProgress) => item.unlockedAt !== null);

    res.json({
      success: true,
      data: unlocked.map((item: AchievementWithProgress) => ({
        id: item.achievement.id,
        key: item.achievement.key,
        name: item.achievement.name,
        description: item.achievement.description,
        icon: item.achievement.icon,
        conditionType: item.achievement.conditionType,
        conditionValue: item.achievement.conditionValue,
        tier: item.achievement.tier,
        points: item.achievement.points,
        status: item.achievement.status,
        badge: item.badge
          ? {
              id: item.badge.id,
              imageUrl: item.badge.imageUrl,
              description: item.badge.description,
            }
          : null,
        unlockedAt: item.unlockedAt,
        progress: Math.round((item.progress.current / item.progress.required) * 100),
        currentValue: item.progress.current,
        targetValue: item.progress.required,
      })),
    });
  };

  /**
   * GET /api/achievements/me/summary
   * Returns aggregate stats: total unlocked, total points earned,
   * counts per tier, and the 3 most recently unlocked achievements.
   *
   * Devuelve estadísticas agregadas: total desbloqueados, puntos totales,
   * conteo por tier y los 3 logros desbloqueados más recientes.
   */
  getMySummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const all = await achievementService.getUserAchievements(userId);

    const unlocked = all.filter((item: AchievementWithProgress) => item.unlockedAt !== null);

    const totalPoints = unlocked.reduce(
      (sum: number, item: AchievementWithProgress) => sum + item.achievement.points,
      0
    );

    const tierCounts = unlocked.reduce(
      (acc: Record<string, number>, item: AchievementWithProgress) => {
        const tier = item.achievement.tier;
        acc[tier] = (acc[tier] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const recent = unlocked
      .sort((a: AchievementWithProgress, b: AchievementWithProgress) => {
        const aDate = a.unlockedAt!.getTime();
        const bDate = b.unlockedAt!.getTime();
        return bDate - aDate;
      })
      .slice(0, 3)
      .map((item: AchievementWithProgress) => ({
        key: item.achievement.key,
        name: item.achievement.name,
        icon: item.achievement.icon,
        tier: item.achievement.tier,
        points: item.achievement.points,
        unlockedAt: item.unlockedAt,
      }));

    res.json({
      success: true,
      data: {
        unlocked: unlocked.length,
        total: all.length,
        totalPoints,
        recent,
      },
    });
  };
}

export const achievementController = new AchievementController();
