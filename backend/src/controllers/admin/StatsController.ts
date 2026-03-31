/**
 * @fileoverview StatsController - Platform statistics endpoints
 * @description Controlador de estadísticas globales de la plataforma
 * @module controllers/admin/StatsController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { Op } from 'sequelize';
import { User, Commission, Purchase } from '../../models';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import type { ApiResponse } from '../../types';

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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching global stats',
    });
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

    const where: any = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate as string);
      if (endDate) where.created_at[Op.lte] = new Date(endDate as string);
    }
    if (type && ['direct', 'level_1', 'level_2', 'level_3', 'level_4'].includes(type as string)) {
      where.type = type;
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
          userEmail: (c as any).user?.email,
          fromUserEmail: (c as any).fromUser?.email,
          createdAt: c.createdAt,
        })),
        byType: byType.map((b: any) => ({
          type: b.type,
          total: Number(b.total),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error generating commissions report',
    });
  }
}
