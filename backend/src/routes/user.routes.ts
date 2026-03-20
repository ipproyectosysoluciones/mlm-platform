import { Router, Router as ExpressRouter } from 'express';
import { 
  getMe, getTree, getQR, getQRUrl,
  updateProfile, changePassword, deleteAccount,
  updateProfileValidation, changePasswordValidation, deleteAccountValidation
} from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener perfil del usuario actual / Get current user profile
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario / User profile
 *       401:
 *         description: No autenticado / Not authenticated
 */
router.get('/me', authenticateToken, asyncHandler(getMe));

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Actualizar perfil / Update user profile
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado / Profile updated
 *       401:
 *         description: No autenticado / Not authenticated
 */
router.patch('/me', authenticateToken, validate(updateProfileValidation), asyncHandler(updateProfile));

/**
 * @swagger
 * /users/me/change-password:
 *   post:
 *     summary: Cambiar contraseña / Change password
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Contraseña actual / Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Nueva contraseña (min 8 chars, 1 número) / New password
 *     responses:
 *       200:
 *         description: Contraseña cambiada / Password changed
 *       400:
 *         description: Contraseña incorrecta / Incorrect password
 */
router.post('/me/change-password', authenticateToken, validate(changePasswordValidation), asyncHandler(changePassword));

/**
 * @swagger
 * /users/me/delete:
 *   post:
 *     summary: Eliminar cuenta / Delete account
 *     description: Elimina la cuenta del usuario actual. No se puede eliminar si es admin.
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cuenta eliminada / Account deleted
 *       400:
 *         description: Admin no puede eliminarse / Admin cannot delete themselves
 */
router.post('/me/delete', authenticateToken, validate(deleteAccountValidation), asyncHandler(deleteAccount));

/**
 * @swagger
 * /users/me/tree:
 *   get:
 *     summary: Obtener árbol binario del usuario / Get user's binary tree
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: depth
 *         schema:
 *           type: integer
 *         description: Profundidad máxima del árbol / Maximum tree depth
 *     responses:
 *       200:
 *         description: Estructura del árbol / Tree structure
 */
router.get('/me/tree', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  req.params.id = req.user!.id;
  return getTree(req, res);
}));

/**
 * @swagger
 * /users/me/qr:
 *   get:
 *     summary: Obtener QR del usuario / Get user QR code
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Imagen PNG del código QR
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/me/qr', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  req.params.id = req.user!.id;
  return getQR(req, res);
}));

/**
 * @swagger
 * /users/me/qr-url:
 *   get:
 *     summary: Obtener URL del QR / Get QR URL and link
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: URL del QR y link de referido / QR URL and referral link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dataUrl:
 *                   type: string
 *                   description: QR como data URL
 *                 referralLink:
 *                   type: string
 *                   description: Link de referido / Referral link
 *                 referralCode:
 *                   type: string
 */
router.get('/me/qr-url', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  req.params.id = req.user!.id;
  return getQRUrl(req, res);
}));

/**
 * @swagger
 * /users/{id}/tree:
 *   get:
 *     summary: Obtener árbol de otro usuario / Get other user's tree
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estructura del árbol / Tree structure
 */
router.get('/:id/tree', authenticateToken, asyncHandler(getTree));

/**
 * @swagger
 * /users/{id}/qr:
 *   get:
 *     summary: Obtener QR de otro usuario / Get other user's QR
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Imagen PNG del código QR
 */
router.get('/:id/qr', authenticateToken, asyncHandler(getQR));

/**
 * @swagger
 * /users/{id}/qr-url:
 *   get:
 *     summary: Obtener URL del QR de otro usuario / Get other user's QR URL
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL del QR y link de referido
 */
router.get('/:id/qr-url', authenticateToken, asyncHandler(getQRUrl));

export default router;
