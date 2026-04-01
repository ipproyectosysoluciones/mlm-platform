/**
 * @fileoverview Admin Users Controller - User management endpoints
 * @description Handles admin-only user management operations
 * @module controllers/admin/users
 */
import { Response } from 'express';
import { Op } from 'sequelize';
import { User, Commission } from '../../models';
import { TreeService } from '../../services/TreeService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

const treeService = new TreeService();

/**
 * Get all users with pagination and filters
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
      where.email = { [Op.like]: `%${search}%` };
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
    // Invalid UUID format or other DB error - treat as not found
    res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }
}

/**
 * Update user status (active/inactive)
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
 * Promote user to admin
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
