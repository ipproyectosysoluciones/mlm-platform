import { Response } from 'express';
import { body } from 'express-validator';
import { userService, treeServiceInstance } from '../services/UserService';
import { QRService } from '../services/QRService';
import { hashPassword, verifyPassword } from '../services/AuthService';
import type { ApiResponse } from '../types';
import { LEVEL_NAMES } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const qrService = new QRService();

/**
 * Validation rules for profile update
 * Reglas de validación para actualización de perfil
 */
export const updateProfileValidation = [
  body('firstName').optional().isString().trim(),
  body('lastName').optional().isString().trim(),
  body('phone').optional().isString().trim(),
];

/**
 * Validation rules for password change
 * Reglas de validación para cambio de contraseña
 */
export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

/**
 * Validation rules for account deletion
 * Reglas de validación para eliminación de cuenta
 */
export const deleteAccountValidation = [
  body('password').notEmpty().withMessage('Password is required to delete account'),
];

/**
 * Get user profile
 * Obtiene perfil de usuario
 *
 * @param req - Authenticated request with user ID
 * @param res - Response with user profile data
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const fullUser = await userService.findById(userId);

  if (!fullUser) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const response: ApiResponse<{
    id: string;
    email: string;
    referralCode: string;
    level: number;
    levelName: string;
    status: string;
    currency: string;
    createdAt: Date;
  }> = {
    success: true,
    data: {
      id: fullUser.id,
      email: fullUser.email,
      referralCode: fullUser.referralCode,
      level: fullUser.level,
      levelName: LEVEL_NAMES[fullUser.level] || 'Starter',
      status: fullUser.status,
      currency: fullUser.currency,
      createdAt: fullUser.createdAt,
    },
  };

  res.json(response);
}

/**
 * Get user binary tree
 * Obtiene árbol binario de usuario
 *
 * @param req - Authenticated request with optional user ID and depth
 * @param res - Response with tree structure and stats
 */
export async function getTree(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const depth = req.query.depth ? parseInt(req.query.depth as string, 10) : undefined;

  const tree = await treeServiceInstance.getUserTree(userId, depth);
  if (!tree) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const stats = await treeServiceInstance.getLegCounts(userId);

  const response: ApiResponse<{
    tree: typeof tree;
    stats: typeof stats;
  }> = {
    success: true,
    data: { tree, stats },
  };

  res.json(response);
}

/**
 * Get user QR code as PNG image
 * Obtiene código QR como imagen PNG
 *
 * @param req - Authenticated request with optional user ID
 * @param res - PNG image response
 */
export async function getQR(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const user = await userService.findById(userId);

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const qrBuffer = await qrService.generateQRBuffer(user.referralCode);

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="qr-${user.referralCode}.png"`);
  res.send(qrBuffer);
}

/**
 * Get user QR code as data URL
 * Obtiene código QR como data URL
 *
 * @param req - Authenticated request with optional user ID
 * @param res - Response with QR data URL and referral link
 */
export async function getQRUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const user = await userService.findById(userId);

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const dataUrl = await qrService.generateQRDataUrl(user.referralCode);
  const referralLink = qrService.getReferralLink(user.referralCode);

  const response: ApiResponse<{
    dataUrl: string;
    referralLink: string;
    referralCode: string;
  }> = {
    success: true,
    data: {
      dataUrl,
      referralLink,
      referralCode: user.referralCode,
    },
  };

  res.json(response);
}

/**
 * Update user profile
 * Actualiza perfil de usuario
 *
 * @param req - Authenticated request with profile data
 * @param res - Response with updated user
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { firstName, lastName, phone } = req.body;

  const user = await userService.updateUser(userId, { firstName, lastName, phone });
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({ success: true, data: user });
}

/**
 * Change user password
 * Cambia contraseña de usuario
 *
 * @param req - Authenticated request with current and new password
 * @param res - Success response
 * @throws {AppError} 400 - If current password is incorrect
 */
export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  const user = await userService.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Current password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await userService.updatePassword(userId, newHash);

  res.json({ success: true, message: 'Password changed successfully' });
}

/**
 * Delete user account
 * Elimina cuenta de usuario
 *
 * @param req - Authenticated request with password confirmation
 * @param res - Success response
 * @throws {AppError} 400 - If password is incorrect
 */
export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { password } = req.body;

  const user = await userService.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  if (user.role === 'admin') {
    res.status(403).json({ success: false, error: 'Admin accounts cannot be deleted' });
    return;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Password is incorrect');
  }

  await userService.deleteUser(userId);
  res.json({ success: true, message: 'Account deleted successfully' });
}
