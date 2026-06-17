/**
 * @fileoverview Notification Controller - User notification preferences and 2FA
 * @description REST API endpoints for managing notification preferences and 2FA
 * @module controllers/NotificationController
 *
 * @example
 * // ES: Endpoints disponibles
 * GET    /api/users/me/notifications  - Obtener preferencias
 * PATCH  /api/users/me/notifications  - Actualizar preferencias
 * POST   /api/users/me/2fa/enable    - Habilitar 2FA
 * POST   /api/users/me/2fa/verify    - Verificar código 2FA
 * POST   /api/users/me/2fa/disable   - Deshabilitar 2FA
 *
 * // EN: Available endpoints
 * GET    /api/users/me/notifications  - Get preferences
 * PATCH  /api/users/me/notifications  - Update preferences
 * POST   /api/users/me/2fa/enable    - Enable 2FA
 * POST   /api/users/me/2fa/verify    - Verify 2FA code
 * POST   /api/users/me/2fa/disable   - Disable 2FA
 */
import { Response } from 'express';
import { User } from '../models/User';
import { smsService } from '../services/SMSService';
import { ResponseUtil } from '../utils/response.util';
import { logger } from '../utils/logger';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

// In-memory store for 2FA codes (use Redis in production)
// Almacenamiento en memoria para códigos 2FA (usar Redis en producción)
const twoFactorCodes = new Map<string, { code: string; expiry: Date }>();

/**
 * Get user notification preferences
 * Obtener preferencias de notificación del usuario
 *
 * @route GET /api/users/me/notifications
 *
 * @returns {object} Notification preferences object
 */
export async function getNotificationPreferences(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json(ResponseUtil.error('UNAUTHORIZED', 'Unauthorized', 401));
      return;
    }

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
      return;
    }

    res.json({
      success: true,
      data: {
        emailNotifications: user.emailNotifications,
        smsNotifications: user.smsNotifications,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorPhone: user.twoFactorPhone,
        weeklyDigest: user.weeklyDigest,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting notification preferences');
    res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Internal server error', 500));
  }
}

/**
 * Update user notification preferences
 * Actualizar preferencias de notificación del usuario
 *
 * @route PATCH /api/users/me/notifications
 *
 * @param {object} body - Preferences to update
 */
export async function updateNotificationPreferences(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { emailNotifications, smsNotifications, weeklyDigest } = req.body;

    if (!userId) {
      res.status(401).json(ResponseUtil.error('UNAUTHORIZED', 'Unauthorized', 401));
      return;
    }

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
      return;
    }

    // Update only provided fields
    if (typeof emailNotifications === 'boolean') {
      user.emailNotifications = emailNotifications;
    }
    if (typeof smsNotifications === 'boolean') {
      user.smsNotifications = smsNotifications;
    }
    if (typeof weeklyDigest === 'boolean') {
      user.weeklyDigest = weeklyDigest;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        emailNotifications: user.emailNotifications,
        smsNotifications: user.smsNotifications,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorPhone: user.twoFactorPhone,
        weeklyDigest: user.weeklyDigest,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating notification preferences');
    res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Internal server error', 500));
  }
}

/**
 * Enable 2FA for user
 * Habilitar 2FA para el usuario
 *
 * @route POST /api/users/me/2fa/enable
 *
 * @param {string} body.phone - Phone number in E.164 format
 */
export async function enable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { phone } = req.body;

    if (!userId) {
      res.status(401).json(ResponseUtil.error('UNAUTHORIZED', 'Unauthorized', 401));
      return;
    }

    if (!phone) {
      res.status(400).json(ResponseUtil.error('INVALID_PARAMS', 'Phone number is required', 400));
      return;
    }

    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phone)) {
      res
        .status(400)
        .json(
          ResponseUtil.error(
            'INVALID_FORMAT',
            'Invalid phone number format. Use E.164 format (+1234567890)',
            400
          )
        );
      return;
    }

    // Send verification code
    const result = await smsService.sendVerificationCode(phone);

    if (!result.success) {
      res
        .status(500)
        .json(
          ResponseUtil.error('SEND_FAILED', result.error || 'Failed to send verification code', 500)
        );
      return;
    }

    // Store code with 10-minute expiry
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    twoFactorCodes.set(`${userId}-${phone}`, { code, expiry });

    // Mask phone for display
    const maskedPhone = phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);

    res.json({
      success: true,
      message: 'Verification code sent',
      maskedPhone,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enabling 2FA');
    res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Internal server error', 500));
  }
}

/**
 * Verify 2FA code and enable 2FA
 * Verificar código 2FA y habilitar 2FA
 *
 * @route POST /api/users/me/2fa/verify
 *
 * @param {string} body.code - 6-digit verification code
 */
export async function verify2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { code, phone } = req.body;

    if (!userId) {
      res.status(401).json(ResponseUtil.error('UNAUTHORIZED', 'Unauthorized', 401));
      return;
    }

    if (!code || !phone) {
      res
        .status(400)
        .json(ResponseUtil.error('INVALID_PARAMS', 'Code and phone are required', 400));
      return;
    }

    const stored = twoFactorCodes.get(`${userId}-${phone}`);

    if (!stored) {
      res
        .status(400)
        .json(
          ResponseUtil.error(
            'NOT_FOUND',
            'No verification code found. Request a new code first.',
            400
          )
        );
      return;
    }

    // Verify code
    const result = smsService.verifyCode(code, stored.code, stored.expiry);

    if (!result.valid) {
      res
        .status(400)
        .json(ResponseUtil.error('INVALID_CODE', result.error || 'Invalid verification code', 400));
      return;
    }

    // Enable 2FA for user
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
      return;
    }

    user.twoFactorEnabled = true;
    user.twoFactorPhone = phone;
    await user.save();

    // Clear used code
    twoFactorCodes.delete(`${userId}-${phone}`);

    res.json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    logger.error({ err: error }, 'Error verifying 2FA');
    res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Internal server error', 500));
  }
}

/**
 * Disable 2FA for user
 * Deshabilitar 2FA para el usuario
 *
 * @route POST /api/users/me/2fa/disable
 *
 * @param {string} body.code - 6-digit verification code (optional for disable)
 */
export async function disable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json(ResponseUtil.error('UNAUTHORIZED', 'Unauthorized', 401));
      return;
    }

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json(ResponseUtil.error('NOT_FOUND', 'User not found', 404));
      return;
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorPhone = null;
    await user.save();

    res.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    logger.error({ err: error }, 'Error disabling 2FA');
    res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Internal server error', 500));
  }
}
