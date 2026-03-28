/**
 * @fileoverview Wallet Routes - API endpoints for digital wallet operations
 * @description Endpoints for balance, transactions, and withdrawal requests
 *              Rutas API para operaciones de wallet: balance, transacciones y retiros
 * @module routes/wallet.routes
 * @author MLM Development Team
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
} from '../controllers/WalletController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// All wallet routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /wallet:
 *   get:
 *     summary: Get wallet balance / Obtener balance del wallet
 *     description: Returns the current user's wallet balance and details
 *     tags: [wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     balance:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 *       401:
 *         description: Not authenticated
 */
router.get('/', asyncHandler(getBalance));

/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: Get wallet transactions / Obtener transacciones del wallet
 *     description: Returns paginated list of wallet transactions with optional filters
 *     tags: [wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [commission, withdrawal, refund]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
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
      .isIn(['commission', 'withdrawal', 'refund'])
      .withMessage('Invalid transaction type'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  ]),
  asyncHandler(getTransactions)
);

/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Create withdrawal request / Crear solicitud de retiro
 *     description: Creates a new withdrawal request from the wallet balance
 *     tags: [wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 20
 *                 description: Amount to withdraw (minimum $20 USD)
 *     responses:
 *       201:
 *         description: Withdrawal request created successfully
 *       400:
 *         description: Invalid amount or insufficient balance
 */
router.post(
  '/withdraw',
  validate([
    body('amount').isFloat({ min: 20 }).withMessage('Minimum withdrawal amount is $20 USD'),
  ]),
  asyncHandler(createWithdrawal)
);

/**
 * @swagger
 * /wallet/withdrawals/:id:
 *   get:
 *     summary: Get withdrawal status / Obtener estado del retiro
 *     description: Returns the status of a specific withdrawal request
 *     tags: [wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Withdrawal request ID
 *     responses:
 *       200:
 *         description: Withdrawal status retrieved successfully
 *       404:
 *         description: Withdrawal request not found
 */
router.get(
  '/withdrawals/:id',
  validate([param('id').isUUID().withMessage('Invalid withdrawal ID')]),
  asyncHandler(getWithdrawalStatus)
);

/**
 * @swagger
 * /wallet/withdrawals/:id:
 *   delete:
 *     summary: Cancel withdrawal request / Cancelar solicitud de retiro
 *     description: Cancels a pending withdrawal request
 *     tags: [wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Withdrawal request ID
 *     responses:
 *       200:
 *         description: Withdrawal cancelled successfully
 *       400:
 *         description: Cannot cancel - withdrawal already processed or not owned
 */
router.delete(
  '/withdrawals/:id',
  validate([param('id').isUUID().withMessage('Invalid withdrawal ID')]),
  asyncHandler(cancelWithdrawal)
);

// ============================================
// Public routes - Rutas públicas
// ============================================

/**
 * @swagger
 * /api/wallets/prices:
 *   get:
 *     summary: Get current cryptocurrency prices
 *     description: Returns real-time prices from CoinGecko API (BTC, ETH, USDT)
 *     tags: [wallet]
 *     responses:
 *       200:
 *         description: Current crypto prices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bitcoin:
 *                       type: object
 *                       properties:
 *                         usd:
 *                           type: number
 *                         usd_24h_change:
 *                           type: number
 *                     ethereum:
 *                       type: object
 *                     tether:
 *                       type: object
 *                     lastUpdated:
 *                       type: string
 *       500:
 *         description: Error fetching prices
 */
router.get('/prices', asyncHandler(getCryptoPrices));

export default router;
