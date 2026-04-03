/**
 * @fileoverview LeaderboardRoutes - Leaderboard route definitions
 * @description Registers leaderboard API routes with JWT authentication.
 *             Registra las rutas del leaderboard con autenticación JWT.
 * @module routes/leaderboard.routes
 * @author MLM Development Team
 */
import { Router, Router as ExpressRouter } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { leaderboardController } from '../controllers/LeaderboardController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// All leaderboard routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /leaderboard/sellers:
 *   get:
 *     summary: Top sellers by revenue / Top vendedores por ingresos
 *     tags: [leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, all-time]
 *           default: weekly
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Top sellers list
 *       400:
 *         description: Invalid period
 *       401:
 *         description: Not authenticated
 */
router.get('/sellers', asyncHandler(leaderboardController.getTopSellers));

/**
 * @swagger
 * /leaderboard/referrers:
 *   get:
 *     summary: Top referrers by count / Top referidores por cantidad
 *     tags: [leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, all-time]
 *           default: weekly
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Top referrers list
 *       400:
 *         description: Invalid period
 *       401:
 *         description: Not authenticated
 */
router.get('/referrers', asyncHandler(leaderboardController.getTopReferrers));

/**
 * @swagger
 * /leaderboard/me:
 *   get:
 *     summary: Current user rank / Posición del usuario actual
 *     tags: [leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, all-time]
 *           default: weekly
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [sellers, referrers]
 *           default: sellers
 *     responses:
 *       200:
 *         description: User rank info
 *       400:
 *         description: Invalid period
 *       401:
 *         description: Not authenticated
 */
router.get('/me', asyncHandler(leaderboardController.getMyRank));

export default router;
