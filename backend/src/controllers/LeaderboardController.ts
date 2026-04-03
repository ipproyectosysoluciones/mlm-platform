/**
 * @fileoverview LeaderboardController - Leaderboard API endpoints
 * @description Handles top sellers, top referrers, and current user rank endpoints.
 *             Gestiona los endpoints de ranking de vendedores, referidores y posición del usuario.
 * @module controllers/LeaderboardController
 * @author MLM Development Team
 */
import { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { leaderboardService, Period } from '../services/LeaderboardService';

const VALID_PERIODS: Period[] = ['weekly', 'monthly', 'all-time'];

function validatePeriod(raw: unknown): Period | null {
  if (typeof raw === 'string' && (VALID_PERIODS as string[]).includes(raw)) {
    return raw as Period;
  }
  return null;
}

export class LeaderboardController {
  /**
   * GET /api/leaderboard/sellers?period=weekly&limit=10
   * Returns top sellers ranked by total completed order revenue.
   */
  getTopSellers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const period = validatePeriod(req.query.period ?? 'weekly');
    if (!period) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERIOD',
          message: `period must be one of: ${VALID_PERIODS.join(', ')}`,
        },
      });
      return;
    }

    const rawLimit = parseInt(String(req.query.limit ?? '10'), 10);
    const limit = Math.min(isNaN(rawLimit) || rawLimit < 1 ? 10 : rawLimit, 50);

    const data = await leaderboardService.getTopSellers(period, limit);

    res.json({
      success: true,
      data,
      period,
      generatedAt: new Date().toISOString(),
    });
  };

  /**
   * GET /api/leaderboard/referrers?period=weekly&limit=10
   * Returns top referrers ranked by direct referral count.
   */
  getTopReferrers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const period = validatePeriod(req.query.period ?? 'weekly');
    if (!period) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERIOD',
          message: `period must be one of: ${VALID_PERIODS.join(', ')}`,
        },
      });
      return;
    }

    const rawLimit = parseInt(String(req.query.limit ?? '10'), 10);
    const limit = Math.min(isNaN(rawLimit) || rawLimit < 1 ? 10 : rawLimit, 50);

    const data = await leaderboardService.getTopReferrers(period, limit);

    res.json({
      success: true,
      data,
      period,
      generatedAt: new Date().toISOString(),
    });
  };

  /**
   * GET /api/leaderboard/me?period=weekly
   * Returns the authenticated user's rank in both sellers and referrers leaderboards.
   */
  getMyRank = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const period = validatePeriod(req.query.period ?? 'weekly');
    if (!period) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERIOD',
          message: `period must be one of: ${VALID_PERIODS.join(', ')}`,
        },
      });
      return;
    }

    const userId = req.user!.id;
    const category = (req.query.category as 'sellers' | 'referrers') ?? 'sellers';

    const data = await leaderboardService.getMyRank(userId, category, period);

    res.json({
      success: true,
      data,
      period,
      generatedAt: new Date().toISOString(),
    });
  };
}

export const leaderboardController = new LeaderboardController();
