/**
 * @fileoverview Profile Controller - Current user profile endpoint
 * @description Handles getting the authenticated user's profile
 * @module controllers/auth/profile
 */
import { Response, RequestHandler } from 'express';
import { userService } from '../../services/UserService';
import type { ApiResponse } from '../../types';
import { LEVEL_NAMES } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Get current authenticated user
 * Obtiene el usuario autenticado actual
 *
 * @param req - Express request with authenticated user
 * @param res - Express response with user profile
 * @throws {AppError} 404 - If user not found
 */
export const me: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const fullUser = await userService.findById(userId);

    if (!fullUser) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    let sponsor = null;
    if (fullUser.sponsorId) {
      const sponsorUser = await userService.findById(fullUser.sponsorId);
      sponsor = sponsorUser ? { id: sponsorUser.id, referralCode: sponsorUser.referralCode } : null;
    }

    const response: ApiResponse<{
      id: string;
      email: string;
      referralCode: string;
      level: number;
      levelName: string;
      currency: string;
      role: string;
      sponsor?: typeof sponsor;
    }> = {
      success: true,
      data: {
        id: fullUser.id,
        email: fullUser.email,
        referralCode: fullUser.referralCode,
        level: fullUser.level,
        levelName: LEVEL_NAMES[fullUser.level] || 'Starter',
        currency: fullUser.currency,
        role: fullUser.role,
        sponsor,
      },
    };

    res.json(response);
  }
);
