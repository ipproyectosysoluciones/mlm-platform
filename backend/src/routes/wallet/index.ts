/**
 * @fileoverview Wallet Routes - Digital wallet API endpoints
 * @description Router for /api/wallet endpoints
 * @module routes/wallet
 */
import { Router, Router as ExpressRouter } from 'express';
import { body, param, query } from 'express-validator';
import {
  getBalance,
  getTransactions,
  createWithdrawal,
  getWithdrawalStatus,
  cancelWithdrawal,
  getCryptoPrices,
} from '../../controllers/wallet';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

const router: ExpressRouter = Router();

// All wallet routes require authentication
router.use(authenticateToken);

// Balance
router.get('/', asyncHandler(getBalance));
router.get('/:userId', asyncHandler(getBalance));

// Transactions
router.get(
  '/transactions',
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn(['commission', 'commission_earned', 'withdrawal', 'refund', 'fee', 'adjustment'])
      .withMessage('Invalid transaction type'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  ]),
  asyncHandler(getTransactions)
);
router.get(
  '/:userId/transactions',
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn(['commission', 'commission_earned', 'withdrawal', 'refund', 'fee', 'adjustment'])
      .withMessage('Invalid transaction type'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  ]),
  asyncHandler(getTransactions)
);

// Withdrawals
router.post(
  '/withdraw',
  validate([
    body('amount').isFloat({ min: 20 }).withMessage('Minimum withdrawal amount is $20 USD'),
  ]),
  asyncHandler(createWithdrawal)
);

router.get(
  '/withdrawals/:id',
  validate([
    param('id')
      .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      .withMessage('Invalid withdrawal ID'),
  ]),
  asyncHandler(getWithdrawalStatus)
);

router.delete(
  '/withdrawals/:id',
  validate([param('id').isUUID().withMessage('Invalid withdrawal ID')]),
  asyncHandler(cancelWithdrawal)
);

// Public routes
router.get('/prices', asyncHandler(getCryptoPrices));

export default router;
