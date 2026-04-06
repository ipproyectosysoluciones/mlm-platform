/**
 * @fileoverview TwoFactorSetupController - 2FA setup initiation
 * @description Endpoints for initiating 2FA setup (generating secret and QR)
 * @module controllers/twofactor/TwoFactorSetupController
 * @author MLM Development Team
 */

import { Response } from 'express';
import { User } from '../../models';
import { TwoFactorService } from '../../services/TwoFactorService';
import type { ApiResponse } from '../../types';
import { AppError } from '../../middleware/error.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

// ============================================
// CONSTANTS
// ============================================

const SETUP_EXPIRY_MINUTES = 10;

// ============================================
// IN-MEMORY STORES (for temporary data)
// ============================================

// Store pending 2FA setups (secret, not yet enabled)
const pendingSetups = new Map<string, { secret: string; expiresAt: Date }>();

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * Initiate 2FA setup - generates secret and QR code
 * Inicia configuración 2FA - genera secret y código QR
 *
 * @route POST /api/auth/2fa/setup
 * @access Authenticated
 */
export const setup2FA = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // Check if 2FA is already enabled
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (user.twoFactorEnabled) {
      throw new AppError(400, 'TWO_FA_ALREADY_ENABLED', '2FA is already enabled');
    }

    // Generate new secret
    const setup = await TwoFactorService.generateSecret(userEmail, 'Nexo Real');

    // Store pending setup with expiry
    const expiresAt = new Date(Date.now() + SETUP_EXPIRY_MINUTES * 60 * 1000);
    pendingSetups.set(userId, {
      secret: setup.secret,
      expiresAt,
    });

    const response: ApiResponse<{
      qrCodeUrl: string;
      secret: string;
      expiresIn: number;
    }> = {
      success: true,
      data: {
        qrCodeUrl: setup.qrCodeUrl,
        secret: setup.secret, // Show secret for manual entry fallback
        expiresIn: SETUP_EXPIRY_MINUTES * 60,
      },
    };

    res.json(response);
  }
);

// Export pendingSetups for use by verify controller
export const getPendingSetups = () => pendingSetups;

export default { setup2FA, getPendingSetups };
