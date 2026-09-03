/**
 * @fileoverview Admin Wallet Routes — Admin endpoints for withdrawal management
 * @description Routes for listing, approving, and rejecting withdrawal requests
 *
 * @module routes/admin-wallet.routes
 */

import { Router, Router as ExpressRouter } from 'express';
import { body, param, query } from 'express-validator';
import {
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from '../controllers/AdminWalletController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { featureGuard } from '../middleware/featureGuard.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router: ExpressRouter = Router();

// All admin wallet routes require authentication + feature flag
router.use(authenticateToken);
router.use(featureGuard('cryptoWallet'));

/**
 * @swagger
 * /admin/wallet/withdrawals:
 *   get:
 *     summary: List withdrawal requests (admin)
 *     tags: [admin-wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, paid, failed] }
 *       - in: query
 *         name: gateway
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of withdrawals
 */
router.get(
  '/withdrawals',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'paid', 'failed']),
  ]),
  asyncHandler(listWithdrawals)
);

/**
 * @swagger
 * /admin/wallet/withdrawals/{id}/approve:
 *   post:
 *     summary: Approve a withdrawal request
 *     tags: [admin-wallet]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/withdrawals/:id/approve',
  validate([param('id').isUUID().withMessage('Invalid withdrawal ID')]),
  asyncHandler(approveWithdrawal)
);

/**
 * @swagger
 * /admin/wallet/withdrawals/{id}/reject:
 *   post:
 *     summary: Reject a withdrawal request
 *     tags: [admin-wallet]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/withdrawals/:id/reject',
  validate([
    param('id').isUUID().withMessage('Invalid withdrawal ID'),
    body('rejectionReason').isString().notEmpty().withMessage('Rejection reason is required'),
  ]),
  asyncHandler(rejectWithdrawal)
);

export default router;
