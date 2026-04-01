/**
 * @fileoverview Auth Routes - Authentication API endpoints
 * @description Router for /api/auth endpoints
 * @module routes/auth
 */
import { Router, Router as ExpressRouter } from 'express';
import { register, login, me, registerValidation, loginValidation } from '../../controllers/auth';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const router: ExpressRouter = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar nuevo usuario / Register new user
 *     description: Crea una cuenta de usuario con código de referido único. Creates a user account with unique referral code.
 *     tags: [auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario / User email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Contraseña (mín 8 chars, 1 número) / Password (min 8 chars, 1 number)
 *               sponsor_code:
 *                 type: string
 *                 description: Código de referido opcional / Optional referral code
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente / User created successfully
 *       400:
 *         description: Email ya registrado o validación fallida / Email already registered or validation failed
 */
router.post('/register', validate(registerValidation), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión / Login user
 *     description: Autentica usuario y retorna JWT token. Authenticates user and returns JWT token.
 *     tags: [auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso / Successful login
 *       401:
 *         description: Credenciales inválidas / Invalid credentials
 *       429:
 *         description: Rate limit excedido / Rate limit exceeded
 */
router.post('/login', validate(loginValidation), login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener usuario actual / Get current user
 *     description: Retorna información del usuario autenticado. Returns authenticated user info.
 *     tags: [auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario actual / Current user
 *       401:
 *         description: Token requerido o inválido / Token required or invalid
 */
router.get('/me', authenticateToken, me);

export default router;
