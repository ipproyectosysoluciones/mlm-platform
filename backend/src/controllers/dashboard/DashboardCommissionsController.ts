/**
 * @fileoverview DashboardCommissionsController - Recent commissions on dashboard
 * @description Handles recent commissions retrieval for the user dashboard.
 * @module controllers/dashboard/DashboardCommissionsController
 */
import { Response } from 'express';
import { Op } from 'sequelize';
import { Commission } from '../../models';
import { CommissionService } from '../../services/CommissionService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import type { ApiResponse } from '../../types';

/**
 * Get recent commissions for dashboard
 * Obtiene comisiones recientes para el dashboard
 *
 * @route GET /api/dashboard/commissions
 * @access Authenticated
 */
export async function getDashboardCommissions(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.id;

  const recentCommissions = await new CommissionService().getUserCommissions(userId, {
    limit: 5,
  });

  // Get commissions by month for chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const commissionsByMonth = await Commission.findAll({
    where: {
      userId,
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
    recentCommissions: Array<{
      id: string;
      type: string;
      amount: number;
      currency: string;
      createdAt: Date;
    }>;
    commissionsChart: Array<{ month: string; amount: number }>;
  }> = {
    success: true,
    data: {
      recentCommissions: recentCommissions.rows.map((c) => ({
        id: c.id,
        type: c.type,
        amount: Number(c.amount),
        currency: c.currency,
        createdAt: c.createdAt,
      })),
      commissionsChart,
    },
  };

  res.json(response);
}
