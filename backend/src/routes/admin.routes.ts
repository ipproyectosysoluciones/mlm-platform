import { Router, Router as ExpressRouter } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getGlobalStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getCommissionsReport,
  promoteToAdmin,
} from '../controllers/admin';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

router.use(authenticate);
router.use(requireRole('admin'));

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Obtener estadísticas globales / Get global statistics
 *     description: Retorna estadísticas de la plataforma incluyendo usuarios, ventas y comisiones.
 *     tags: [admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas globales / Global statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 activeUsers:
 *                   type: integer
 *                 inactiveUsers:
 *                   type: integer
 *                 totalReferrals:
 *                   type: integer
 *                 leftReferrals:
 *                   type: integer
 *                 rightReferrals:
 *                   type: integer
 *                 totalSales:
 *                   type: number
 *                 totalCommissions:
 *                   type: number
 *                 recentUsers:
 *                   type: array
 *       403:
 *         description: Acceso denegado / Access denied
 */
router.get('/stats', asyncHandler(getGlobalStats));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Obtener lista de usuarios / Get users list
 *     tags: [admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de usuarios / Users list
 */
router.get('/users', asyncHandler(getAllUsers));

/**
 * @swagger
 * /admin/users/{userId}:
 *   get:
 *     summary: Obtener usuario por ID / Get user by ID
 *     tags: [admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del usuario / User data
 *       404:
 *         description: Usuario no encontrado / User not found
 */
router.get('/users/:userId', asyncHandler(getUserById));

/**
 * @swagger
 * /admin/users/{userId}/status:
 *   patch:
 *     summary: Actualizar estado del usuario / Update user status
 *     tags: [admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Estado actualizado / Status updated
 *       404:
 *         description: Usuario no encontrado / User not found
 */
router.patch('/users/:userId/status', asyncHandler(updateUserStatus));

/**
 * @swagger
 * /admin/users/{userId}/promote:
 *   patch:
 *     summary: Promover usuario a admin / Promote user to admin
 *     tags: [admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario promovido / User promoted
 *       404:
 *         description: Usuario no encontrado / User not found
 */
router.patch('/users/:userId/promote', asyncHandler(promoteToAdmin));

/**
 * @swagger
 * /admin/reports/commissions:
 *   get:
 *     summary: Obtener reporte de comisiones / Get commissions report
 *     tags: [admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reporte de comisiones / Commissions report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCommissions:
 *                   type: number
 *                 byStatus:
 *                   type: object
 *                 byType:
 *                   type: object
 *                 topEarners:
 *                   type: array
 */
router.get('/reports/commissions', asyncHandler(getCommissionsReport));

export default router;
