/**
 * @fileoverview UsersAdminController - User management endpoints for admins
 * @description Controlador de gestión de usuarios para administradores
 * @module controllers/admin/UsersAdminController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { User, Commission } from '../../models';
import type { UserAttributes, UserRole, USER_ROLES } from '../../types';

// Type for User where clauses
type UserWhereClause = WhereOptions<UserAttributes>;
import { TreeService } from '../../services/TreeService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { ResponseUtil } from '../../utils/response.util';
import { Lead } from '../../models/Lead';
import { ADMIN_ROLES } from '../../types';

// All roles assignable via API — super_admin is excluded for security
// Todos los roles asignables por API — super_admin se excluye por seguridad
const ASSIGNABLE_ROLES: readonly UserRole[] = [
  'admin',
  'finance',
  'sales',
  'advisor',
  'vendor',
  'user',
  'guest',
  'bot',
] as const;

const treeService = new TreeService();

/**
 * Get all users with pagination and filters
 * Obtiene todos los usuarios con paginación y filtros
 *
 * @route GET /api/admin/users
 * @access Admin only
 * @param req - Query params: page, limit, status, search
 * @param res - Response with paginated users
 */
export async function getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: UserWhereClause = {};
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
  } catch {
    res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Error fetching users', 500));
  }
}

/**
 * Get user details by ID
 * Obtiene detalles de usuario por ID
 *
 * @route GET /api/admin/users/:userId
 * @access Admin only
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
      res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
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
  } catch {
    // Invalid UUID format or other DB error - treat as not found
    res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
  }
}

/**
 * Update user status (active/inactive)
 * Actualiza estado del usuario
 *
 * @route PATCH /api/admin/users/:userId/status
 * @access Admin only
 * @param req - Path: userId, Body: status
 * @param res - Success response
 */
export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      res.status(400).json(ResponseUtil.error('INVALID_PARAMS', 'Invalid status', 400));
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
      return;
    }

    await user.update({ status });

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { id: user.id, status: user.status },
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Error updating user',
    });
  }
}

/**
 * Promote user to admin
 * Promueve usuario a admin
 *
 * @route POST /api/admin/users/:userId/promote
 * @access Admin only
 * @param req - Path: userId
 * @param res - Success response
 */
export async function promoteToAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const currentUser = req.user!;

    if (currentUser.id === userId) {
      res
        .status(400)
        .json(ResponseUtil.error('INVALID_PARAMS', 'Cannot change your own role', 400));
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
      return;
    }

    await user.update({ role: 'admin' });

    res.json({
      success: true,
      message: 'User promoted to admin',
      data: { id: user.id, role: user.role },
    });
  } catch {
    res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Error promoting user', 500));
  }
}

/**
 * Update user role with full RBAC business rules
 * Actualiza el rol del usuario con reglas de negocio RBAC completas
 *
 * @route PATCH /api/admin/users/:userId/role
 * @access Admin only (super_admin | admin)
 *
 * Business rules / Reglas de negocio:
 * - super_admin cannot be assigned via API (manual DB only)
 * - Cannot demote an existing super_admin
 * - Cannot change your own role
 * - When guest → user|vendor|advisor: update associated Lead to status='won'
 *
 * @param req - Path: userId, Body: role (new role)
 * @param res - Success response with updated user
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { role: newRole } = req.body as { role: UserRole };
    const requester = req.user!;

    // Validate role is provided and assignable
    if (!newRole || !ASSIGNABLE_ROLES.includes(newRole)) {
      res
        .status(400)
        .json(
          ResponseUtil.error(
            'INVALID_PARAMS',
            `Invalid role. Assignable roles: ${ASSIGNABLE_ROLES.join(', ')}`,
            400
          )
        );
      return;
    }

    // Cannot change your own role
    if (requester.id === userId) {
      res
        .status(400)
        .json(ResponseUtil.error('INVALID_PARAMS', 'Cannot change your own role', 400));
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
      return;
    }

    // Cannot demote a super_admin
    if (user.role === 'super_admin') {
      res
        .status(403)
        .json(ResponseUtil.error('FORBIDDEN', 'Cannot change role of a super_admin', 403));
      return;
    }

    const previousRole = user.role;
    await user.update({ role: newRole });

    // When guest is promoted to an active role, update their CRM lead to 'won'
    // Cuando un guest es promovido a un rol activo, actualizar su Lead en CRM a 'won'
    const activeRoles: readonly UserRole[] = ['user', 'vendor', 'advisor', 'sales', 'finance'];
    if (previousRole === 'guest' && activeRoles.includes(newRole)) {
      await Lead.update(
        { status: 'won' },
        {
          where: {
            metadata: { guestUserId: userId } as unknown as Record<string, unknown>,
            status: { [Op.ne]: 'won' } as WhereOptions,
          } as WhereOptions,
        }
      );
    }

    res.json({
      success: true,
      message: `User role updated from '${previousRole}' to '${newRole}'`,
      data: { id: user.id, role: user.role },
    });
  } catch {
    res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Error updating user role', 500));
  }
}
