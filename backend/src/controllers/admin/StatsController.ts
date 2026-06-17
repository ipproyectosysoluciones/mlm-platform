/**
 * @fileoverview StatsController - Platform statistics endpoints
 * @description Controlador de estadísticas globales de la plataforma
 * @module controllers/admin/StatsController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { User, Commission, Purchase } from '../../models';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import type { ApiResponse } from '../../types';
import { ResponseUtil } from '../../utils/response.util';
import type { CommissionAttributes } from '../../types';

// Type for Commission where clauses
type CommissionWhereClause = WhereOptions<CommissionAttributes>;

/**
 * Get global platform statistics
 * Obtiene estadísticas globales de la plataforma
 *
 * @route GET /api/admin/stats
 * @access Admin only
 * @param req - Authenticated admin request
 * @param res - Response with stats: users, commissions, purchases
 */
export async function getGlobalStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      leftCount,
      rightCount,
      totalCommissions,
      totalPurchases,
      recentUsers,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      User.count({ where: { status: 'inactive' } }),
      User.count({ where: { position: 'left' } }),
      User.count({ where: { position: 'right' } }),
      Commission.sum('amount'),
      Purchase.sum('amount'),
      User.findAll({
        limit: 10,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'email', 'level', 'status', 'created_at'],
      }),
    ]);

    const response: ApiResponse<{
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      leftCount: number;
      rightCount: number;
      rightPercentage: number;
      leftPercentage: number;
      totalCommissions: number;
      totalPurchases: number;
      recentUsers: Array<{
        id: string;
        email: string;
        level: number;
        status: string;
        createdAt: Date;
      }>;
    }> = {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        leftCount,
        rightCount,
        leftPercentage: totalUsers > 0 ? Math.round((leftCount / totalUsers) * 100) : 0,
        rightPercentage: totalUsers > 0 ? Math.round((rightCount / totalUsers) * 100) : 0,
        totalCommissions: Number(totalCommissions) || 0,
        totalPurchases: Number(totalPurchases) || 0,
        recentUsers: recentUsers.map((u) => ({
          id: u.id,
          email: u.email,
          level: u.level,
          status: u.status,
          createdAt: u.createdAt,
        })),
      },
    };

    res.json(response);
  } catch {
    res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Error fetching global stats', 500));
  }
}

/**
 * Get commissions report
 * Obtiene reporte de comisiones
 *
 * @route GET /api/admin/commissions-report
 * @access Admin only
 * @param req - Query: startDate, endDate, type
 * @param res - Response with commissions breakdown
 */
export async function getCommissionsReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { startDate, endDate, type } = req.query;

    const where: CommissionWhereClause = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate as string);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate as string);
    }
    if (type && ['direct', 'level_1', 'level_2', 'level_3', 'level_4'].includes(type as string)) {
      where.type = type as CommissionAttributes['type'];
    }

    const commissions = await Commission.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['email', 'referralCode'] },
        { model: User, as: 'fromUser', attributes: ['email', 'referralCode'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    const byType = await Commission.findAll({
      where,
      attributes: ['type', [User.sequelize!.fn('SUM', User.sequelize!.col('amount')), 'total']],
      group: ['type'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        commissions: commissions.map((c) => ({
          id: c.id,
          type: c.type,
          amount: Number(c.amount),
          status: c.status,
          userEmail: c.user?.email,
          fromUserEmail: c.fromUser?.email,
          createdAt: c.createdAt,
        })),
        byType: byType.map((b: { type: string; total: string | number }) => ({
          type: b.type,
          total: Number(b.total),
        })),
      },
    });
  } catch {
    res
      .status(500)
      .json(ResponseUtil.error('INTERNAL_ERROR', 'Error generating commissions report', 500));
  }
}
