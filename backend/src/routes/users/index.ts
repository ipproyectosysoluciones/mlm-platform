/**
 * @fileoverview User Routes - User profile, tree, and QR API endpoints
 * @description Router for /api/users endpoints
 * @module routes/users
 */
import { Router, Router as ExpressRouter } from 'express';
import {
  getMe,
  getTree,
  getQR,
  getQRUrl,
  updateProfile,
  changePassword,
  deleteAccount,
  searchUsers,
  getUserDetails,
  updateProfileValidation,
  changePasswordValidation,
  deleteAccountValidation,
} from '../../controllers/users';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  enable2FA,
  verify2FA,
  disable2FA,
} from '../../controllers/NotificationController';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

const router: ExpressRouter = Router();

// Profile endpoints
router.get('/me', authenticateToken, asyncHandler(getMe));
router.patch(
  '/me',
  authenticateToken,
  validate(updateProfileValidation),
  asyncHandler(updateProfile)
);
router.post(
  '/me/change-password',
  authenticateToken,
  validate(changePasswordValidation),
  asyncHandler(changePassword)
);
router.post(
  '/me/delete',
  authenticateToken,
  validate(deleteAccountValidation),
  asyncHandler(deleteAccount)
);

// Tree endpoints (self)
router.get(
  '/me/tree',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    req.params.id = req.user!.id;
    return getTree(req, res);
  })
);

// QR endpoints (self)
router.get(
  '/me/qr',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    req.params.id = req.user!.id;
    return getQR(req, res);
  })
);
router.get(
  '/me/qr-url',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    req.params.id = req.user!.id;
    return getQRUrl(req, res);
  })
);

// Tree endpoints (other users)
router.get('/:id/tree', authenticateToken, asyncHandler(getTree));
router.get('/:id/qr', authenticateToken, asyncHandler(getQR));
router.get('/:id/qr-url', authenticateToken, asyncHandler(getQRUrl));

// Search and details
router.get('/search', authenticateToken, asyncHandler(searchUsers));
router.get('/:id/details', authenticateToken, asyncHandler(getUserDetails));

// Notification preferences
router.get('/me/notifications', authenticateToken, asyncHandler(getNotificationPreferences));
router.patch('/me/notifications', authenticateToken, asyncHandler(updateNotificationPreferences));

// 2FA
router.post('/me/2fa/enable', authenticateToken, asyncHandler(enable2FA));
router.post('/me/2fa/verify', authenticateToken, asyncHandler(verify2FA));
router.post('/me/2fa/disable', authenticateToken, asyncHandler(disable2FA));

export default router;
