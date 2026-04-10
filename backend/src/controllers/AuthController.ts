/**
 * @fileoverview AuthController - Authentication controller for Nexo Real binary affiliations
 * @description Controlador de autenticación para afiliaciones binarias de Nexo Real
 *              Handles user registration, login, and profile management
 *              Gestiona registro de usuarios, inicio de sesión y gestión de perfil
 * @module controllers/AuthController
 * @author Nexo Real Development Team
 * @version 3.0.0
 *
 * @example
 * // English: Import auth controller functions
 * import { register, login, me } from '../controllers/AuthController';
 *
 * // Español: Importar funciones del controlador de auth
 * import { register, login, me } from '../controllers/AuthController';
 *
 * @example
 * // English: Add auth routes
 * router.post('/auth/register', registerValidation, register);
 * router.post('/auth/login', loginValidation, login);
 * router.get('/auth/me', authenticateToken, me);
 *
 * // Español: Añadir rutas de auth
 * router.post('/auth/register', registerValidation, register);
 * router.post('/auth/login', loginValidation, login);
 * router.get('/auth/me', authenticateToken, me);
 */
import { randomBytes } from 'crypto';
import { Response, RequestHandler } from 'express';
import { body } from 'express-validator';
import { userService } from '../services/UserService';
import { hashPassword, verifyPassword, generateToken } from '../services/AuthService';
import { emailService } from '../services/EmailService';
import { achievementService } from '../services/AchievementService';
import { config } from '../config/env';
import type { ApiResponse, UserAttributes } from '../types';
import { AppError } from '../middleware/error.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { Lead } from '../models/Lead';

// Re-export profile controller (maintains backward compatibility)
export { me } from './auth/ProfileController';

/**
 * Validation rules for user registration
 * Reglas de validación para registro de usuario
 */
export const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('sponsor_code').optional().isString().withMessage('Sponsor code must be a string'),
];

/**
 * Validation rules for user login
 * Reglas de validación para inicio de sesión
 */
export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Validation rules for guest registration
 * Reglas de validación para registro de invitado
 *
 * @description Minimal registration: only name, email, and optional phone/sponsor.
 *              No password required — guest accounts cannot log in until role is promoted.
 *              Registro mínimo: solo nombre, email, y teléfono/sponsor opcionales.
 *              No requiere contraseña — los guests no pueden iniciar sesión hasta que se promueva el rol.
 */
export const registerGuestValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('sponsor_code').optional().isString().withMessage('Sponsor code must be a string'),
];

/**
 * Register new user
 * Registra un nuevo usuario
 *
 * @param req - Express request with email, password, and optional sponsor_code
 * @param res - Express response with user data and JWT token
 * @throws {AppError} 400 - If email already exists
 */
export const register: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { email, password, sponsor_code } = req.body;

    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email already registered');
    }

    const passwordHash = await hashPassword(password);

    const user = await userService.createUser({
      email,
      passwordHash,
      sponsorCode: sponsor_code,
      currency: 'USD',
    });

    const token = generateToken(user);

    // Send welcome email / Enviar email de bienvenida
    const referralLink = `${config.app.frontendUrl || 'https://nexoreal.xyz'}/register?ref=${user.referralCode}`; // TODO: domain pending
    const firstName = user.email.split('@')[0];

    // Fire and forget - don't block registration response
    // Enviar y olvidar - no bloquear la respuesta de registro
    emailService
      .sendWelcome({
        email: user.email,
        firstName,
        referralCode: user.referralCode,
        referralLink,
      })
      .catch((err) => console.error('Welcome email failed:', err));

    // If user has sponsor, notify sponsor about new downline
    // Si el usuario tiene patrocinador, notificar al patrocinador sobre nuevo downline
    if (user.sponsorId) {
      const sponsor = await userService.findById(user.sponsorId);
      if (sponsor && (sponsor as any).emailNotifications) {
        emailService
          .sendDownline({
            email: sponsor.email,
            firstName: sponsor.email.split('@')[0],
            newUserEmail: user.email,
            position: user.position || 'unknown',
          })
          .catch((err) => console.error('Downline email failed:', err));
      }
    }

    const response: ApiResponse<{
      user: Partial<UserAttributes>;
      token: string;
    }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          referralCode: user.referralCode,
          level: user.level,
          currency: user.currency,
          role: user.role,
        },
        token,
      },
    };

    res.status(201).json(response);
  }
);

/**
 * Login user
 * Inicia sesión de usuario
 *
 * @param req - Express request with email and password
 * @param res - Express response with user data and JWT token
 * @throws {AppError} 401 - If credentials are invalid
 */
export const login: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const user = await userService.findByEmail(email);
    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      // Generate a limited token for 2FA verification
      const tempToken = generateToken(user);

      const response: ApiResponse<{
        requires2FA: boolean;
        tempToken: string;
        userId: string;
      }> = {
        success: true,
        data: {
          requires2FA: true,
          tempToken,
          userId: user.id,
        },
      };

      res.json(response);
      return;
    }

    // Normal login without 2FA
    const token = generateToken(user);

    // Fire-and-forget: check login achievements (future-ready for consistency_30)
    achievementService
      .checkAndUnlock(user.id, 'login')
      .catch((err) => console.error('[Achievements]', err));

    const response: ApiResponse<{
      user: Partial<UserAttributes>;
      token: string;
    }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          referralCode: user.referralCode,
          level: user.level,
          currency: user.currency,
          role: user.role,
        },
        token,
      },
    };

    res.json(response);
  }
);

/**
 * Register a guest user (no password required)
 * Registra un usuario invitado (sin contraseña)
 *
 * @description Creates a User with role='guest' and automatically creates a Lead in the CRM.
 *              The guest cannot log in — they must be promoted (PATCH /admin/users/:id/role)
 *              to user|vendor|advisor before they receive full access.
 *
 *              Crea un User con role='guest' y automáticamente crea un Lead en el CRM.
 *              El guest no puede iniciar sesión — debe ser promovido (PATCH /admin/users/:id/role)
 *              a user|vendor|advisor para recibir acceso completo.
 *
 * @param req - Express request with name, email, and optional phone/sponsor_code
 * @param res - Express response with created user data (no token)
 * @throws {AppError} 400 - If email already registered
 *
 * @example
 * // English: Register a guest from landing page contact form
 * POST /auth/register/guest
 * { "name": "Juan Pérez", "email": "juan@example.com", "phone": "+54911234567" }
 *
 * // Español: Registrar un invitado desde formulario de contacto
 * POST /auth/register/guest
 * { "name": "Juan Pérez", "email": "juan@example.com", "phone": "+54911234567" }
 */
export const registerGuest: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, email, phone, sponsor_code } = req.body;

    // Check for existing user / Verificar usuario existente
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email already registered');
    }

    // Guests get a cryptographically secure random placeholder password — they cannot log in
    // Los guests reciben una contraseña aleatoria segura — no pueden iniciar sesión
    const placeholderPassword = `guest_${Date.now()}_${randomBytes(16).toString('hex')}`;
    const passwordHash = await hashPassword(placeholderPassword);

    const user = await userService.createUser({
      email,
      passwordHash,
      sponsorCode: sponsor_code,
      currency: 'USD',
      role: 'guest',
    });

    // Auto-create a Lead in the CRM for this guest
    // Crear automáticamente un Lead en el CRM para este invitado
    await Lead.create({
      userId: user.sponsorId || user.id, // Assign to sponsor if exists, otherwise self
      contactName: name,
      contactEmail: email,
      contactPhone: phone || null,
      status: 'new',
      source: 'website',
      value: 0,
      currency: 'USD',
      referredBy: user.sponsorId || null,
      metadata: {
        guestUserId: user.id,
        registeredAt: new Date().toISOString(),
      },
    });

    const response: ApiResponse<{ user: Partial<UserAttributes> }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          referralCode: user.referralCode,
          role: user.role,
        },
      },
    };

    res.status(201).json(response);
  }
);
