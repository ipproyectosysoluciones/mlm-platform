/**
 * @fileoverview TwoFactorStatusController - 2FA status management
 * @description Endpoints for retrieving 2FA status
 * @module controllers/twofactor/TwoFactorStatusController
 * @author MLM Development Team
 */

import { Response } from 'express';
import { User } from '../../models';
import type { ApiResponse } from '../../types';
import { AppError } from '../../middleware/error.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * Get 2FA status for current user
 * Obtiene el estado de 2FA del usuario actual
 *
 * @route GET /api/auth/2fa/status
 * @access Authenticated
 */
export const get2FAStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const response: ApiResponse<{
      enabled: boolean;
      enabledAt: Date | null;
      method: string;
    }> = {
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false,
        enabledAt: user.twoFactorEnabledAt || null,
        method: 'totp', // Currently only TOTP is supported
      },
    };

    res.json(response);
  }
);

export default { get2FAStatus };
