/**
 * @fileoverview DashboardController - Main dashboard aggregator
 * @description Combines data from all sub-controllers for the complete dashboard view.
 * @module controllers/dashboard/DashboardController
 */
import { Response } from 'express';
import { Op } from 'sequelize';
import { userService, treeServiceInstance } from '../../services/UserService';
import { CommissionService } from '../../services/CommissionService';
import { QRService } from '../../services/QRService';
import { User, Commission } from '../../models';
import type { ApiResponse } from '../../types';
import { LEVEL_NAMES } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { ApiResponse } from '../../utils/response.util';

/**
 * Get user dashboard with stats, referrals, and commissions
 * Obtiene dashboard de usuario con estadísticas, referidos y comisiones
 *
 * @route GET /api/dashboard
 * @access Authenticated
 * @param {AuthenticatedRequest} req - Authenticated request with user token
 * @param {Response} res - Response with dashboard data
 * @returns {ApiResponse} Dashboard data including user info, stats, referrals, and recent commissions
 */
export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const fullUser = await userService.findById(userId);

  if (!fullUser) {
    res.status(404).json(ApiResponse.error('NOT_FOUND', 'User not found', 404));
    return;
  }

  const [directReferrals, legCounts, commissionStats, referralLink] = await Promise.all([
    userService.getDirectReferrals(fullUser.id),
    treeServiceInstance.getLegCounts(fullUser.id),
    new CommissionService().getCommissionStats(fullUser.id),
    Promise.resolve(new QRService().getReferralLink(fullUser.referralCode)),
  ]);

  const recentCommissions = await new CommissionService().getUserCommissions(fullUser.id, {
    limit: 5,
  });

  const recentReferrals = await User.findAll({
    where: { sponsorId: fullUser.id },
    limit: 5,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'email', 'position', 'created_at'],
  });

  // Get referrals by month for chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const referralsByMonth = await User.findAll({
    where: {
      sponsorId: fullUser.id,
      createdAt: { [Op.gte]: sixMonthsAgo },
    },
    attributes: ['createdAt'],
  });

  const referralsChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const count = referralsByMonth.filter((r) => {
      const created = new Date(r.createdAt);
      return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
    }).length;
    return { month, count };
  });

  // Get commissions by month for chart
  const commissionsByMonth = await Commission.findAll({
    where: {
      userId: fullUser.id,
      status: 'completed',
      createdAt: { [Op.gte]: sixMonthsAgo },
    },
    attributes: ['amount', 'createdAt'],
  });

  const commissionsChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const amount = commissionsByMonth
      .filter((c) => {
        const created = new Date(c.createdAt);
        return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
      })
      .reduce((sum, c) => sum + Number(c.amount), 0);
    return { month, amount };
  });

  const response: ApiResponse<{
    user: {
      id: string;
      email: string;
      referralCode: string;
      level: number;
      levelName: string;
    };
    stats: {
      totalReferrals: number;
      leftCount: number;
      rightCount: number;
      totalEarnings: number;
      pendingEarnings: number;
    };
    referralLink: string;
    recentCommissions: Array<{
      id: string;
      type: string;
      amount: number;
      currency: string;
      createdAt: Date;
    }>;
    recentReferrals: Array<{
      id: string;
      email: string;
      position: string;
      createdAt: Date;
    }>;
    referralsChart: Array<{ month: string; count: number }>;
    commissionsChart: Array<{ month: string; amount: number }>;
  }> = {
    success: true,
    data: {
      user: {
        id: fullUser.id,
        email: fullUser.email,
        referralCode: fullUser.referralCode,
        level: fullUser.level,
        levelName: LEVEL_NAMES[fullUser.level] || 'Starter',
      },
      stats: {
        totalReferrals: directReferrals.length,
        leftCount: legCounts.leftCount,
        rightCount: legCounts.rightCount,
        totalEarnings: commissionStats.totalEarned,
        pendingEarnings: commissionStats.pending,
      },
      referralLink,
      recentCommissions: recentCommissions.rows.map((c) => ({
        id: c.id,
        type: c.type,
        amount: Number(c.amount),
        currency: c.currency,
        createdAt: c.createdAt,
      })),
      recentReferrals: recentReferrals.map((r: User) => ({
        id: r.id,
        email: r.email,
        position: r.position || 'left',
        createdAt: r.createdAt,
      })),
      referralsChart,
      commissionsChart,
    },
  };

  res.json(response);
}
