/**
 * @fileoverview TwoFactor Verify Controller - 2FA verification endpoints
 * @description Handles 2FA code verification and disabling
 * @module controllers/twoFactor/verify
 */
import { Response } from 'express';
import { body } from 'express-validator';
import { User } from '../../models';
import { TwoFactorService } from '../../services/TwoFactorService';
import type { ApiResponse } from '../../types';
import { AppError } from '../../middleware/error.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export const verify2FAValidation: any[] = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits').isNumeric(),
];

export const disable2FAValidation: any[] = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits').isNumeric(),
];

/**
 * Verify 2FA code (used during login)
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

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecretEncrypted) {
      throw new AppError(400, 'TWO_FA_NOT_ENABLED', '2FA is not enabled for this user');
    }

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

    const result = TwoFactorService.verifyCode(code, user.twoFactorSecretEncrypted);

    if (result.valid) {
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
      const newAttempts = (user.twoFactorFailedAttempts || 0) + 1;
      const updates: Partial<User> = { twoFactorFailedAttempts: newAttempts };

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

/**
 * Disable 2FA (requires current 2FA code)
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

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecretEncrypted) {
      throw new AppError(400, 'TWO_FA_NOT_ENABLED', '2FA is not enabled for this user');
    }

    const totpValid = TwoFactorService.verifyCode(code, user.twoFactorSecretEncrypted);

    if (totpValid.valid) {
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

    if (user.twoFactorRecoveryCodesHash) {
      const recoveryResult = await TwoFactorService.verifyRecoveryCode(
        code,
        user.twoFactorRecoveryCodesHash
      );

      if (recoveryResult.valid) {
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

    throw new AppError(400, 'TWO_FA_INVALID_CODE', 'Invalid verification or recovery code');
  }
);
