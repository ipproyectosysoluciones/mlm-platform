/**
 * @fileoverview Profile Controller - User profile management endpoints
 * @description Handles user profile operations
 * @module controllers/users/profile
 */
import { Response } from 'express';
import { body } from 'express-validator';
import { userService } from '../../services/UserService';
import { hashPassword, verifyPassword } from '../../services/AuthService';
import type { ApiResponse } from '../../types';
import { LEVEL_NAMES } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

/**
 * Validation rules for profile update
 */
export const updateProfileValidation = [
  body('firstName').optional().isString().trim(),
  body('lastName').optional().isString().trim(),
  body('phone').optional().isString().trim(),
];

/**
 * Validation rules for password change
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
 */
export const deleteAccountValidation = [
  body('password').notEmpty().withMessage('Password is required to delete account'),
];

/**
 * Get user profile
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
 * Update user profile
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
