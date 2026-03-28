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
} from '../controllers/UserController';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  enable2FA,
  verify2FA,
  disable2FA,
} from '../controllers/NotificationController';
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
router.patch(
  '/me',
  authenticateToken,
  validate(updateProfileValidation),
  asyncHandler(updateProfile)
);

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
router.post(
  '/me/change-password',
  authenticateToken,
  validate(changePasswordValidation),
  asyncHandler(changePassword)
);

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
router.post(
  '/me/delete',
  authenticateToken,
  validate(deleteAccountValidation),
  asyncHandler(deleteAccount)
);

/**
 * @swagger
 * /users/me/tree:
 *   get:
 *     summary: Obtener árbol binario del usuario / Get user's binary tree
 *     description: Retorna la estructura del árbol binario del usuario con stats y opcionalmente paginación.
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: depth
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 3
 *         description: Profundidad máxima del árbol / Maximum tree depth
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página (Phase 3) / Page number (Phase 3)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Límite de nodos por página (Phase 3) / Nodes per page limit (Phase 3)
 *     responses:
 *       200:
 *         description: Estructura del árbol / Tree structure
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tree:
 *                           $ref: '#/components/schemas/TreeNode'
 *                         stats:
 *                           $ref: '#/components/schemas/TreeResponse/properties/stats'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *                           description: Incluido si se usan page/limit / Included if page/limit are used
 *       401:
 *         description: No autenticado / Not authenticated
 */
router.get(
  '/me/tree',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    req.params.id = req.user!.id;
    return getTree(req, res);
  })
);

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
router.get(
  '/me/qr',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    req.params.id = req.user!.id;
    return getQR(req, res);
  })
);

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
router.get(
  '/me/qr-url',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    req.params.id = req.user!.id;
    return getQRUrl(req, res);
  })
);

/**
 * @swagger
 * /users/{id}/tree:
 *   get:
 *     summary: Obtener árbol de otro usuario / Get other user's tree
 *     description: Retorna el árbol binario de otro usuario (debe ser ancestro del solicitante).
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario / User ID
 *       - in: query
 *         name: depth
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 3
 *         description: Profundidad máxima / Maximum depth
 *     responses:
 *       200:
 *         description: Estructura del árbol / Tree structure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TreeResponse'
 *       401:
 *         description: No autenticado / Not authenticated
 *       404:
 *         description: Usuario no encontrado / User not found
 */
router.get('/:id/tree', authenticateToken, asyncHandler(getTree));

/**
 * @swagger
 * /users/{id}/qr:
 *   get:
 *     summary: Obtener QR de otro usuario / Get other user's QR
 *     description: Genera código QR con el referral code del usuario.
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario / User ID
 *     responses:
 *       200:
 *         description: Imagen PNG del código QR
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Usuario no encontrado / User not found
 */
router.get('/:id/qr', authenticateToken, asyncHandler(getQR));

/**
 * @swagger
 * /users/{id}/qr-url:
 *   get:
 *     summary: Obtener URL del QR de otro usuario / Get other user's QR URL
 *     description: Retorna la URL del código QR y el link de referido.
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario / User ID
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
 *       404:
 *         description: Usuario no encontrado / User not found
 */
router.get('/:id/qr-url', authenticateToken, asyncHandler(getQRUrl));

// ============================================================
// PHASE 3: NEW ROUTES FOR VISUAL TREE UI
// ============================================================

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Buscar usuarios en mi red / Search users in my network
 *     description: Busca por email o referral code en los downlines del usuario autenticado
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Término de búsqueda (min 2 caracteres) / Search term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Límite de resultados / Results limit
 *     responses:
 *       200:
 *         description: Array de usuarios coincidentes / Array of matching users
 *       400:
 *         description: Query muy corta / Query too short
 */
router.get('/search', authenticateToken, asyncHandler(searchUsers));

/**
 * @swagger
 * /users/{id}/details:
 *   get:
 *     summary: Obtener detalles de un usuario / Get user details
 *     description: Devuelve información extendida del usuario incluyendo stats del árbol
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario / User ID
 *     responses:
 *       200:
 *         description: Detalles del usuario / User details
 *       404:
 *         description: Usuario no encontrado o no está en tu red / User not found or not in your network
 */
router.get('/:id/details', authenticateToken, asyncHandler(getUserDetails));

// ============================================================
// PHASE 2: NOTIFICATION ROUTES
// ============================================================

/**
 * @swagger
 * /users/me/notifications:
 *   get:
 *     summary: Obtener preferencias de notificación / Get notification preferences
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferencias de notificación / Notification preferences
 */
router.get('/me/notifications', authenticateToken, asyncHandler(getNotificationPreferences));

/**
 * @swagger
 * /users/me/notifications:
 *   patch:
 *     summary: Actualizar preferencias de notificación / Update notification preferences
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               smsNotifications:
 *                 type: boolean
 *               weeklyDigest:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferencias actualizadas / Preferences updated
 */
router.patch('/me/notifications', authenticateToken, asyncHandler(updateNotificationPreferences));

/**
 * @swagger
 * /users/me/2fa/enable:
 *   post:
 *     summary: Habilitar 2FA / Enable 2FA
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
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Teléfono en formato E.164
 *     responses:
 *       200:
 *         description: Código de verificación enviado / Verification code sent
 */
router.post('/me/2fa/enable', authenticateToken, asyncHandler(enable2FA));

/**
 * @swagger
 * /users/me/2fa/verify:
 *   post:
 *     summary: Verificar código 2FA / Verify 2FA code
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
 *               - code
 *               - phone
 *             properties:
 *               code:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA habilitado / 2FA enabled
 */
router.post('/me/2fa/verify', authenticateToken, asyncHandler(verify2FA));

/**
 * @swagger
 * /users/me/2fa/disable:
 *   post:
 *     summary: Deshabilitar 2FA / Disable 2FA
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA deshabilitado / 2FA disabled
 */
router.post('/me/2fa/disable', authenticateToken, asyncHandler(disable2FA));

export default router;
