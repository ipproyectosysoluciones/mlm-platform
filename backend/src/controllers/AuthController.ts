import { Response, RequestHandler } from 'express';
import { body } from 'express-validator';
import { userService } from '../services/UserService';
import { hashPassword, verifyPassword, generateToken } from '../services/AuthService';
import type { ApiResponse, UserAttributes } from '../types';
import { AppError } from '../middleware/error.middleware';
import { LEVEL_NAMES } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

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

    const token = generateToken(user);

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
 * Get current authenticated user
 * Obtiene el usuario autenticado actual
 *
 * @param req - Express request with authenticated user
 * @param res - Express response with user profile
 * @throws {AppError} 404 - If user not found
 */
export const me: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const fullUser = await userService.findById(userId);

    if (!fullUser) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    let sponsor = null;
    if (fullUser.sponsorId) {
      const sponsorUser = await userService.findById(fullUser.sponsorId);
      sponsor = sponsorUser ? { id: sponsorUser.id, referralCode: sponsorUser.referralCode } : null;
    }

    const response: ApiResponse<{
      id: string;
      email: string;
      referralCode: string;
      level: number;
      levelName: string;
      currency: string;
      role: string;
      sponsor?: typeof sponsor;
    }> = {
      success: true,
      data: {
        id: fullUser.id,
        email: fullUser.email,
        referralCode: fullUser.referralCode,
        level: fullUser.level,
        levelName: LEVEL_NAMES[fullUser.level] || 'Starter',
        currency: fullUser.currency,
        role: fullUser.role,
        sponsor,
      },
    };

    res.json(response);
  }
);
