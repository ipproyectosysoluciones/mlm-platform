import { Response } from 'express';
import { userService, treeServiceInstance } from '../services/UserService';
import { CommissionService } from '../services/CommissionService';
import { QRService } from '../services/QRService';
import { User } from '../models';
import type { ApiResponse } from '../types';
import { LEVEL_NAMES } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

const commissionService = new CommissionService();
const qrService = new QRService();

/**
 * Get user dashboard with stats, referrals, and commissions
 * Obtiene dashboard de usuario con estadísticas, referidos y comisiones
 *
 * @param req - Authenticated request
 * @param res - Response with dashboard data
 */
export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const fullUser = await userService.findById(userId);

  if (!fullUser) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const [directReferrals, legCounts, commissionStats, referralLink] = await Promise.all([
    userService.getDirectReferrals(fullUser.id),
    treeServiceInstance.getLegCounts(fullUser.id),
    commissionService.getCommissionStats(fullUser.id),
    Promise.resolve(qrService.getReferralLink(fullUser.referralCode)),
  ]);

  const recentCommissions = await commissionService.getUserCommissions(fullUser.id, {
    limit: 5,
  });

  const recentReferrals = await User.findAll({
    where: { sponsorId: fullUser.id },
    limit: 5,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'email', 'position', 'created_at'],
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
    },
  };

  res.json(response);
}
