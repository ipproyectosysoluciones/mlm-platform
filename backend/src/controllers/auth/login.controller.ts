/**
 * @fileoverview Login Controller - User login endpoint
 * @description Handles user authentication including 2FA verification
 * @module controllers/auth/login
 */
import { Response, RequestHandler } from 'express';
import { body } from 'express-validator';
import { userService } from '../../services/UserService';
import { verifyPassword, generateToken } from '../../services/AuthService';
import type { ApiResponse, UserAttributes } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

/**
 * Validation rules for user login
 * Reglas de validación para inicio de sesión
 */
export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

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
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
      return;
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
      return;
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
