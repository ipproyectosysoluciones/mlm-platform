/**
 * @fileoverview DashboardStatsController - Stats on dashboard
 * @description Handles statistics retrieval for the user dashboard.
 * @module controllers/dashboard/DashboardStatsController
 */
import { Response } from 'express';
import { userService, treeServiceInstance } from '../../services/UserService';
import { CommissionService } from '../../services/CommissionService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import type { ApiResponse } from '../../types';

/**
 * Get user stats for dashboard
 * Obtiene estadísticas del usuario para el dashboard
 *
 * @route GET /api/dashboard/stats
 * @access Authenticated
 */
export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const fullUser = await userService.findById(userId);

  if (!fullUser) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const [directReferrals, legCounts, commissionStats] = await Promise.all([
    userService.getDirectReferrals(fullUser.id),
    treeServiceInstance.getLegCounts(fullUser.id),
    new CommissionService().getCommissionStats(fullUser.id),
  ]);

  const response: ApiResponse<{
    totalReferrals: number;
    leftCount: number;
    rightCount: number;
    totalEarnings: number;
    pendingEarnings: number;
  }> = {
    success: true,
    data: {
      totalReferrals: directReferrals.length,
      leftCount: legCounts.leftCount,
      rightCount: legCounts.rightCount,
      totalEarnings: commissionStats.totalEarned,
      pendingEarnings: commissionStats.pending,
    },
  };

  res.json(response);
}
