/**
 * @fileoverview ProfileController - User profile management
 * @description Controlador de gestión de perfil de usuario
 *              Handles user profile retrieval and management
 * @module controllers/auth/ProfileController
 * @author MLM Development Team
 * @version 3.0.0
 *
 * @example
 * // English: Import profile controller functions
 * import { me } from '../controllers/auth/ProfileController';
 *
 * // Español: Importar funciones del controlador de perfil
 * import { me } from '../controllers/auth/ProfileController';
 */
import { Response, RequestHandler } from 'express';
import { userService } from '../../services/UserService';
import type { ApiResponse } from '../../types';
import { AppError } from '../../middleware/error.middleware';
import { LEVEL_NAMES } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Get current authenticated user profile
 * Obtiene el perfil del usuario autenticado actual
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
      throw new AppError(404, 'NOT_FOUND', 'User not found');
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
