import { Router, Router as ExpressRouter } from 'express';
import { getDashboard } from '../controllers/dashboard';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { cacheMiddleware, CACHE_KEYS, CACHE_TTL } from '../middleware/cache.middleware';

const router: ExpressRouter = Router();

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Obtener dashboard del usuario / Get user dashboard
 *     description: Retorna estadísticas del usuario incluyendo árbol binario, referidos directos y comisiones.
 *     tags: [dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del dashboard / Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     referralCode:
 *                       type: string
 *                     level:
 *                       type: integer
 *                     leftReferrals:
 *                       type: integer
 *                     rightReferrals:
 *                       type: integer
 *                     totalTeam:
 *                       type: integer
 *                 recentCommissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 directReferrals:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: No autenticado / Not authenticated
 */
router.get(
  '/',
  authenticateToken,
  cacheMiddleware({
    key: (req: any) => CACHE_KEYS.dashboard(req.user!.id),
    ttl: CACHE_TTL.short,
  }),
  asyncHandler(getDashboard)
);

export default router;
