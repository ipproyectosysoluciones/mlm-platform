/**
 * @fileoverview TwoFactorDisableController - 2FA disable management
 * @description Endpoints for disabling 2FA
 * @module controllers/twofactor/TwoFactorDisableController
 * @author MLM Development Team
 */

import { Response } from 'express';
import { body } from 'express-validator';
import { User } from '../../models';
import { TwoFactorService } from '../../services/TwoFactorService';
import type { ApiResponse } from '../../types';
import { AppError } from '../../middleware/error.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

// ============================================
// VALIDATION RULES
// ============================================

export const disable2FAValidation: (typeof disable2FA)[] = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits').isNumeric(),
];

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * Disable 2FA (requires current 2FA code)
 * Deshabilita 2FA (requiere código 2FA actual)
 *
 * @route POST /api/auth/2fa/disable
 * @access Authenticated
 */
export const disable2FA = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!code) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Code is required');
    }

    // Get user
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecretEncrypted) {
      throw new AppError(400, 'TWO_FA_NOT_ENABLED', '2FA is not enabled for this user');
    }

    // First try TOTP code
    const totpValid = TwoFactorService.verifyCode(code, user.twoFactorSecretEncrypted);

    if (totpValid.valid) {
      // Disable 2FA
      await User.update(
        {
          twoFactorEnabled: false,
          twoFactorSecretEncrypted: null,
          twoFactorRecoveryCodesHash: null,
          twoFactorEnabledAt: null,
          twoFactorFailedAttempts: 0,
          twoFactorLockedUntil: null,
        },
        { where: { id: userId } }
      );

      const response: ApiResponse<{ success: boolean; message: string }> = {
        success: true,
        data: {
          success: true,
          message: '2FA has been disabled successfully.',
        },
      };

      res.json(response);
      return;
    }

    // Try recovery code
    if (user.twoFactorRecoveryCodesHash) {
      const recoveryResult = await TwoFactorService.verifyRecoveryCode(
        code,
        user.twoFactorRecoveryCodesHash
      );

      if (recoveryResult.valid) {
        // Disable 2FA and update remaining recovery codes
        await User.update(
          {
            twoFactorEnabled: false,
            twoFactorSecretEncrypted: null,
            twoFactorRecoveryCodesHash: JSON.stringify(recoveryResult.remainingCodes),
            twoFactorEnabledAt: null,
            twoFactorFailedAttempts: 0,
            twoFactorLockedUntil: null,
          },
          { where: { id: userId } }
        );

        const response: ApiResponse<{ success: boolean; message: string }> = {
          success: true,
          data: {
            success: true,
            message: '2FA has been disabled using a recovery code.',
          },
        };

        res.json(response);
        return;
      }
    }

    // Both failed
    throw new AppError(400, 'TWO_FA_INVALID_CODE', 'Invalid verification or recovery code');
  }
);

export default { disable2FA, disable2FAValidation };
