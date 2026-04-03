/**
 * @fileoverview DashboardUserController - User info on dashboard
 * @description Handles user information retrieval for the dashboard.
 * @module controllers/dashboard/DashboardUserController
 */
import { Response } from 'express';
import { userService } from '../../services/UserService';
import { LEVEL_NAMES } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import type { ApiResponse } from '../../types';
import { ApiResponse } from '../../utils/response.util';

/**
 * Get user info for dashboard
 * Obtiene información del usuario para el dashboard
 *
 * @route GET /api/dashboard/user
 * @access Authenticated
 */
export async function getDashboardUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const fullUser = await userService.findById(userId);

  if (!fullUser) {
    res.status(404).json(ApiResponse.error('NOT_FOUND', 'User not found', 404));
    return;
  }

  const response: ApiResponse<{
    id: string;
    email: string;
    referralCode: string;
    level: number;
    levelName: string;
  }> = {
    success: true,
    data: {
      id: fullUser.id,
      email: fullUser.email,
      referralCode: fullUser.referralCode,
      level: fullUser.level,
      levelName: LEVEL_NAMES[fullUser.level] || 'Starter',
    },
  };

  res.json(response);
}
