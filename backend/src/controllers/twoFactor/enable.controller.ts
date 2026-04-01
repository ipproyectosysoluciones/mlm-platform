/**
 * @fileoverview TwoFactor Enable Controller - 2FA setup and management endpoints
 * @description Handles 2FA enabling, setup, and status
 * @module controllers/twoFactor/enable
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
const SETUP_EXPIRY_MINUTES = 10;

const pendingSetups = new Map<string, { secret: string; expiresAt: Date }>();

export const setup2FAValidation: any[] = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits').isNumeric(),
];

/**
 * Get 2FA status for current user
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
        method: 'totp',
      },
    };

    res.json(response);
  }
);

/**
 * Initiate 2FA setup - generates secret and QR code
 */
export const setup2FA = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (user.twoFactorEnabled) {
      throw new AppError(400, 'TWO_FA_ALREADY_ENABLED', '2FA is already enabled');
    }

    const setup = await TwoFactorService.generateSecret(userEmail, 'MLM Platform');

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
        secret: setup.secret,
        expiresIn: SETUP_EXPIRY_MINUTES * 60,
      },
    };

    res.json(response);
  }
);

/**
 * Verify setup code and enable 2FA
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

    const pendingSetup = pendingSetups.get(userId);

    if (!pendingSetup) {
      throw new AppError(
        400,
        'TWO_FA_SETUP_NOT_FOUND',
        'No pending 2FA setup found. Please start setup again.'
      );
    }

    if (new Date() > pendingSetup.expiresAt) {
      pendingSetups.delete(userId);
      throw new AppError(400, 'TWO_FA_SETUP_EXPIRED', 'Setup expired. Please start again.');
    }

    const encryptedSecret = TwoFactorService.encryptSecretForStorage(pendingSetup.secret);
    const result = TwoFactorService.verifyCode(code, encryptedSecret);

    if (!result.valid) {
      throw new AppError(400, 'TWO_FA_INVALID_CODE', 'Invalid verification code');
    }

    const recoveryCodes = TwoFactorService.generateRecoveryCodes();
    const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

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
