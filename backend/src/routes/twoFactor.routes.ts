/**
 * @fileoverview TwoFactor Routes - Two-Factor Authentication routes
 * @description API routes for 2FA setup, verification, and management
 *             Rutas API para configuración 2FA, verificación y gestión
 * @module routes/twoFactor.routes
 *
 * @example
 * // English: Add 2FA routes to auth router
 * import twoFactorRoutes from './routes/twoFactor.routes';
 * app.use('/api/auth/2fa', twoFactorRoutes);
 *
 * // Español: Añadir rutas 2FA al router de auth
 * import twoFactorRoutes from './routes/twoFactor.routes';
 * app.use('/api/auth/2fa', twoFactorRoutes);
 */

import { Router, Router as ExpressRouter } from 'express';
import {
  get2FAStatus,
  setup2FA,
  verifySetup,
  verify2FA,
  disable2FA,
} from '../controllers/TwoFactorController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router: ExpressRouter = Router();

/**
 * @swagger
 * /2fa/status:
 *   get:
 *     summary: Obtener estado de 2FA / Get 2FA status
 *     description: Retorna si 2FA está habilitado para el usuario actual.
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de 2FA
 */
router.get('/status', authenticateToken, get2FAStatus);

/**
 * @swagger
 * /2fa/setup:
 *   post:
 *     summary: Iniciar configuración 2FA / Initiate 2FA setup
 *     description: Genera un nuevo secret TOTP y código QR para configurar autenticación de dos factores.
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Secret y QR generados
 *       400:
 *         description: 2FA ya está habilitado
 */
router.post('/setup', authenticateToken, setup2FA);

/**
 * @swagger
 * /2fa/verify-setup:
 *   post:
 *     summary: Verificar y habilitar 2FA / Verify and enable 2FA
 *     description: Verifica el código TOTP y habilita 2FA para el usuario.
 *     tags: [2FA]
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
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: Código de 6 dígitos del authenticator
 *     responses:
 *       200:
 *         description: 2FA habilitado exitosamente
 *       400:
 *         description: Código inválido o expirado
 */
router.post('/verify-setup', authenticateToken, verifySetup);

/**
 * @swagger
 * /2fa/verify:
 *   post:
 *     summary: Verificar código 2FA / Verify 2FA code
 *     description: Verifica el código TOTP durante el proceso de login.
 *     tags: [2FA]
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
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Código verificado
 *       400:
 *         description: Código inválido
 *       429:
 *         description: Demasiados intentos fallidos
 */
router.post('/verify', authenticateToken, verify2FA);

/**
 * @swagger
 * /2fa/disable:
 *   post:
 *     summary: Deshabilitar 2FA / Disable 2FA
 *     description: Deshabilita 2FA. Requiere código TOTP o código de recuperación.
 *     tags: [2FA]
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
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código TOTP o de recuperación
 *     responses:
 *       200:
 *         description: 2FA deshabilitado
 *       400:
 *         description: Código inválido
 */
router.post('/disable', authenticateToken, disable2FA);

export default router;
