import { Router, Router as ExpressRouter } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getGlobalStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getCommissionsReport,
  promoteToAdmin,
  updateUserRole,
} from '../controllers/AdminController';
import { asyncHandler } from '../middleware/asyncHandler';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { USER_ROLES, ADMIN_ROLES } from '../types';

const router: ExpressRouter = Router();

router.use(authenticate);
router.use(requireRole(...(ADMIN_ROLES as import('../types').UserRole[])));

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
 * /admin/users/{userId}/role:
 *   patch:
 *     summary: Actualizar rol del usuario / Update user role
 *     description: |
 *       Actualiza el rol de un usuario con validación RBAC completa.
 *       Reglas: super_admin no puede asignarse por API, no podés cambiar tu propio rol,
 *       no podés degradar a un super_admin. Cuando guest es promovido a user|vendor|advisor,
 *       el Lead CRM asociado se marca como 'won'.
 *
 *       Updates a user's role with full RBAC validation.
 *       Rules: super_admin cannot be assigned via API, cannot change own role,
 *       cannot demote a super_admin. When guest is promoted to user|vendor|advisor,
 *       the associated CRM Lead is marked as 'won'.
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, finance, sales, advisor, vendor, user, guest, bot]
 *     responses:
 *       200:
 *         description: Rol actualizado / Role updated
 *       400:
 *         description: Rol inválido o cambio propio / Invalid role or self-change
 *       403:
 *         description: No se puede cambiar super_admin / Cannot change super_admin
 *       404:
 *         description: Usuario no encontrado / User not found
 */
const updateRoleValidation = [body('role').isString().notEmpty().withMessage('Role is required')];
router.patch('/users/:userId/role', validate(updateRoleValidation), asyncHandler(updateUserRole));

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
