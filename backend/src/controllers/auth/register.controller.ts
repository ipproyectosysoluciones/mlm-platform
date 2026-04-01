/**
 * @fileoverview Register Controller - User registration endpoint
 * @description Handles new user registration with sponsor code validation
 * @module controllers/auth/register
 */
import { Response, RequestHandler } from 'express';
import { body } from 'express-validator';
import { userService } from '../../services/UserService';
import { hashPassword, generateToken } from '../../services/AuthService';
import { emailService } from '../../services/EmailService';
import { config } from '../../config/env';
import type { ApiResponse, UserAttributes } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

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
      throw new Error('Email already registered');
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
    const referralLink = `${config.app.frontendUrl || 'https://mlm-platform.com'}/register?ref=${user.referralCode}`;
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
