/**
 * @fileoverview DashboardReferralsController - Referrals and referral link on dashboard
 * @description Handles recent referrals and referral link retrieval for the user dashboard.
 * @module controllers/dashboard/DashboardReferralsController
 */
import { Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../../models';
import { userService } from '../../services/UserService';
import { QRService } from '../../services/QRService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import type { ApiResponse } from '../../types';
import { ResponseUtil } from '../../utils/response.util';

/**
 * Get recent referrals and referral link for dashboard
 * Obtiene referidos recientes y enlace de referido para el dashboard
 *
 * @route GET /api/dashboard/referrals
 * @access Authenticated
 */
export async function getDashboardReferrals(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.id;
  const fullUser = await userService.findById(userId);

  if (!fullUser) {
    res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
    return;
  }

  const qrService = new QRService();
  const referralLink = qrService.getReferralLink(fullUser.referralCode);

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

  const response: ApiResponse<{
    referralLink: string;
    recentReferrals: Array<{
      id: string;
      email: string;
      position: string;
      createdAt: Date;
    }>;
    referralsChart: Array<{ month: string; count: number }>;
  }> = {
    success: true,
    data: {
      referralLink,
      recentReferrals: recentReferrals.map((r: User) => ({
        id: r.id,
        email: r.email,
        position: r.position || 'left',
        createdAt: r.createdAt,
      })),
      referralsChart,
    },
  };

  res.json(response);
}
