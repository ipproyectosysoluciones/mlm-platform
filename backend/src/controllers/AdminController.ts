/**
 * @fileoverview AdminController - Administrative operations and platform statistics
 * @description Handles admin-only operations including global statistics, user management,
 *              and platform-wide commission/purchase tracking.
 *              Gestiona operaciones solo de administrador incluyendo estadísticas globales,
 *              gestión de usuarios y seguimiento de comisiones/compras de toda la plataforma.
 * @module controllers/AdminController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { User, Commission, Purchase } from '../models';
import { UserService } from '../services/UserService';
import { TreeService } from '../services/TreeService';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types';

const userService = new UserService();
const treeService = new TreeService();

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
 * Get all users with pagination and filters
 * Obtiene todos los usuarios con paginación y filtros
 *
 * @param req - Query params: page, limit, status, search
 * @param res - Response with paginated users
 */
export async function getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status && ['active', 'inactive'].includes(status)) {
      where.status = status;
    }
    if (search) {
      where.email = { $like: `%${search}%` };
    }

    const { rows: users, count } = await User.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'email',
        'level',
        'status',
        'role',
        'position',
        'referralCode',
        'created_at',
      ],
    });

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          level: u.level,
          status: u.status,
          role: u.role,
          position: u.position,
          referralCode: u.referralCode,
          createdAt: u.createdAt,
        })),
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching users',
    });
  }
}

/**
 * Get user details by ID
 * Obtiene detalles de usuario por ID
 *
 * @param req - Path params: userId
 * @param res - Response with user details and stats
 */
export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: [
        'id',
        'email',
        'level',
        'status',
        'role',
        'position',
        'referralCode',
        'sponsorId',
        'currency',
        'created_at',
      ],
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const [referrals, legCounts, commissions] = await Promise.all([
      User.count({ where: { sponsorId: user.id } }),
      treeService.getLegCounts(user.id),
      Commission.sum('amount', { where: { userId: user.id } }),
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          level: user.level,
          status: user.status,
          role: user.role,
          position: user.position,
          referralCode: user.referralCode,
          sponsorId: user.sponsorId,
          currency: user.currency,
          createdAt: user.createdAt,
        },
        stats: {
          directReferrals: referrals,
          leftCount: legCounts.leftCount,
          rightCount: legCounts.rightCount,
          totalEarnings: Number(commissions) || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching user',
    });
  }
}

/**
 * Update user status (active/inactive)
 * Actualiza estado del usuario
 *
 * @param req - Path: userId, Body: status
 * @param res - Success response
 */
export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    await user.update({ status });

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { id: user.id, status: user.status },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating user',
    });
  }
}

/**
 * Get commissions report
 * Obtiene reporte de comisiones
 *
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
      if (startDate) where.created_at.$gte = new Date(startDate as string);
      if (endDate) where.created_at.$lte = new Date(endDate as string);
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

/**
 * Promote user to admin
 * Promueve usuario a admin
 *
 * @param req - Path: userId
 * @param res - Success response
 */
export async function promoteToAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const currentUser = req.user!;

    if (currentUser.id === userId) {
      res.status(400).json({
        success: false,
        error: 'Cannot change your own role',
      });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    await user.update({ role: 'admin' });

    res.json({
      success: true,
      message: 'User promoted to admin',
      data: { id: user.id, role: user.role },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error promoting user',
    });
  }
}
