/**
 * @fileoverview TwoFactorVerificationController - 2FA verification
 * @description Endpoints for verifying 2FA codes (setup verification and login)
 * @module controllers/twofactor/TwoFactorVerificationController
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
import { getPendingSetups } from './TwoFactorSetupController';

// ============================================
// CONSTANTS
// ============================================

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// ============================================
// VALIDATION RULES
// ============================================

export const verifySetupValidation: (typeof verifySetup)[] = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits').isNumeric(),
];

export const verify2FAValidation: (typeof verify2FA)[] = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits').isNumeric(),
];

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * Verify setup code and enable 2FA
 * Verifica código de configuración y habilita 2FA
 *
 * @route POST /api/auth/2fa/verify-setup
 * @access Authenticated
 */
export const verifySetup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!code) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Code is required');
    }

    // Get pending setup
    const pendingSetups = getPendingSetups();
    const pendingSetup = pendingSetups.get(userId);

    if (!pendingSetup) {
      throw new AppError(
        400,
        'TWO_FA_SETUP_NOT_FOUND',
        'No pending 2FA setup found. Please start setup again.'
      );
    }

    // Check expiry
    if (new Date() > pendingSetup.expiresAt) {
      pendingSetups.delete(userId);
      throw new AppError(400, 'TWO_FA_SETUP_EXPIRED', 'Setup expired. Please start again.');
    }

    // Verify the code
    const encryptedSecret = TwoFactorService.encryptSecretForStorage(pendingSetup.secret);
    const result = TwoFactorService.verifyCode(code, encryptedSecret);

    if (!result.valid) {
      throw new AppError(400, 'TWO_FA_INVALID_CODE', 'Invalid verification code');
    }

    // Generate recovery codes
    const recoveryCodes = TwoFactorService.generateRecoveryCodes();
    const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

    // Enable 2FA for user
    await User.update(
      {
        twoFactorEnabled: true,
        twoFactorSecretEncrypted: encryptedSecret,
        twoFactorRecoveryCodesHash: hashedCodes,
        twoFactorEnabledAt: new Date(),
        twoFactorFailedAttempts: 0,
        twoFactorLockedUntil: null,
      },
      { where: { id: userId } }
    );

    // Remove pending setup
    pendingSetups.delete(userId);

    const response: ApiResponse<{
      success: boolean;
      recoveryCodes: string[];
      message: string;
    }> = {
      success: true,
      data: {
        success: true,
        recoveryCodes,
        message: '2FA has been enabled successfully. Save these recovery codes in a safe place.',
      },
    };

    res.json(response);
  }
);

/**
 * Verify 2FA code (used during login)
 * Verifica código 2FA (usado durante login)
 *
 * @route POST /api/auth/2fa/verify
 * @access Public (with temp token or userId)
 */
export const verify2FA = asyncHandler(
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

    // Check if locked out
    if (user.twoFactorLockedUntil && new Date() < user.twoFactorLockedUntil) {
      const remainingMinutes = Math.ceil(
        (user.twoFactorLockedUntil.getTime() - Date.now()) / 60000
      );
      throw new AppError(
        429,
        'TWO_FA_LOCKED',
        `Too many failed attempts. Try again in ${remainingMinutes} minutes.`
      );
    }

    // Verify the code
    const result = TwoFactorService.verifyCode(code, user.twoFactorSecretEncrypted);

    if (result.valid) {
      // Reset failed attempts on success
      await User.update(
        {
          twoFactorFailedAttempts: 0,
          twoFactorLockedUntil: null,
        },
        { where: { id: userId } }
      );

      const response: ApiResponse<{ verified: boolean }> = {
        success: true,
        data: { verified: true },
      };

      res.json(response);
    } else {
      // Increment failed attempts
      const newAttempts = (user.twoFactorFailedAttempts || 0) + 1;
      const updates: Partial<User> = { twoFactorFailedAttempts: newAttempts };

      // Lock account if too many failed attempts
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        updates.twoFactorLockedUntil = lockoutUntil;

        await User.update(updates, { where: { id: userId } });

        throw new AppError(
          429,
          'TWO_FA_LOCKED',
          `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`
        );
      }

      await User.update(updates, { where: { id: userId } });

      const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
      throw new AppError(
        400,
        'TWO_FA_INVALID_CODE',
        `Invalid verification code. ${remaining} attempts remaining.`
      );
    }
  }
);

export default { verifySetup, verify2FA, verifySetupValidation, verify2FAValidation };
