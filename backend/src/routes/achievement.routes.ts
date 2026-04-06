/**
 * @fileoverview AchievementRoutes - Route definitions for the Achievements feature
 * @description Registers achievement API routes with JWT authentication.
 *             Registra las rutas de logros con autenticación JWT.
 * @module routes/achievement.routes
 * @author MLM Development Team
 *
 * @example
 * // GET /api/achievements       — all achievements with user progress
 * // GET /api/achievements/me    — only user's unlocked achievements
 * // GET /api/achievements/me/summary — aggregate stats
 */
import { Router, Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.middleware';
import { achievementController } from '../controllers/AchievementController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// Rate limiting — guards the auth middleware against brute-force / enumeration
const achievementLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'test' ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' },
  },
});

router.use(achievementLimiter);

// All achievement routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /achievements:
 *   get:
 *     summary: All achievements with user progress / Todos los logros con progreso del usuario
 *     description: Returns all achievements (active + coming_soon) with unlock status and current progress for the authenticated user.
 *     tags: [achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievement list with progress
 *       401:
 *         description: Not authenticated
 */
router.get('/', asyncHandler(achievementController.getAll));

/**
 * @swagger
 * /achievements/me/summary:
 *   get:
 *     summary: User achievement summary / Resumen de logros del usuario
 *     description: Returns aggregate stats — total unlocked, points, tier breakdown, recent unlocks.
 *     tags: [achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievement summary
 *       401:
 *         description: Not authenticated
 */
// NOTE: /me/summary MUST be registered before /me to avoid Express treating 'summary' as a param
router.get('/me/summary', asyncHandler(achievementController.getMySummary));

/**
 * @swagger
 * /achievements/me:
 *   get:
 *     summary: User's unlocked achievements / Logros desbloqueados del usuario
 *     description: Returns only the achievements the authenticated user has unlocked with unlock dates.
 *     tags: [achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unlocked achievements list
 *       401:
 *         description: Not authenticated
 */
router.get('/me', asyncHandler(achievementController.getMy));

export default router;
