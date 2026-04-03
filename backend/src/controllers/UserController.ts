/**
 * @fileoverview UserController - User profile, tree, and QR code endpoints
 * @description Handles user profile operations, binary tree visualization, and QR code generation.
 *              Gestiona operaciones de perfil de usuario, visualización de árbol binario y generación de códigos QR.
 * @module controllers/UserController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { body } from 'express-validator';
import { userService, treeServiceInstance } from '../services/UserService';
import { QRService } from '../services/QRService';
import { hashPassword, verifyPassword } from '../services/AuthService';
import type { ApiResponse } from '../types';
import { LEVEL_NAMES } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { ApiResponse } from '../utils/response.util';

const qrService = new QRService();

/**
 * Validation rules for profile update
 * Reglas de validación para actualización de perfil
 */
export const updateProfileValidation = [
  body('firstName').optional().isString().trim(),
  body('lastName').optional().isString().trim(),
  body('phone').optional().isString().trim(),
];

/**
 * Validation rules for password change
 * Reglas de validación para cambio de contraseña
 */
export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

/**
 * Validation rules for account deletion
 * Reglas de validación para eliminación de cuenta
 */
export const deleteAccountValidation = [
  body('password').notEmpty().withMessage('Password is required to delete account'),
];

/**
 * Get user profile
 * Obtiene perfil de usuario
 *
 * @param req - Authenticated request with user ID
 * @param res - Response with user profile data
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const fullUser = await userService.findById(userId);

  if (!fullUser) {
    res.status(404).json(ApiResponse.error('NOT_FOUND', 'User not found', 404));
    return;
  }

  const response: ApiResponse<{
    id: string;
    email: string;
    referralCode: string;
    level: number;
    levelName: string;
    status: string;
    currency: string;
    createdAt: Date;
  }> = {
    success: true,
    data: {
      id: fullUser.id,
      email: fullUser.email,
      referralCode: fullUser.referralCode,
      level: fullUser.level,
      levelName: LEVEL_NAMES[fullUser.level] || 'Starter',
      status: fullUser.status,
      currency: fullUser.currency,
      createdAt: fullUser.createdAt,
    },
  };

  res.json(response);
}

/**
 * Get user binary tree
 * Obtiene árbol binario de usuario
 *
 * @param req - Authenticated request with optional user ID and depth
 * @param res - Response with tree structure and stats
 */
/**
 * Get user binary tree
 * Obtiene árbol binario de usuario
 *
 * PHASE 3: Soporta paginación con query params ?depth=&page=&limit=
 * PHASE 3: Supports pagination with query params ?depth=&page=&limit=
 *
 * @param req - Authenticated request with optional user ID and pagination params
 * @param res - Response with tree structure, stats, and pagination metadata
 */
export async function getTree(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const depth = req.query.depth ? parseInt(req.query.depth as string, 10) : undefined;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  // Si se pide paginación, usa getSubtreePaginated
  // If pagination is requested, use getSubtreePaginated
  if (req.query.page || req.query.limit) {
    const result = await treeServiceInstance.getSubtreePaginated(userId, depth || 3, page, limit);

    if (!result.tree) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const stats = await treeServiceInstance.getLegCounts(userId);

    res.json({
      success: true,
      data: {
        tree: result.tree,
        pagination: result.pagination,
        stats,
      },
    });
    return;
  }

  // Comportamiento original para compatibilidad
  // Original behavior for backwards compatibility
  const tree = await treeServiceInstance.getUserTree(userId, depth);
  if (!tree) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const stats = await treeServiceInstance.getLegCounts(userId);

  res.json({
    success: true,
    data: { tree, stats },
  });
}

/**
 * Get user QR code as PNG image
 * Obtiene código QR como imagen PNG
 *
 * @param req - Authenticated request with optional user ID
 * @param res - PNG image response
 */
export async function getQR(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const user = await userService.findById(userId);

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const qrBuffer = await qrService.generateQRBuffer(user.referralCode);

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="qr-${user.referralCode}.png"`);
  res.send(qrBuffer);
}

/**
 * Get user QR code as data URL
 * Obtiene código QR como data URL
 *
 * @param req - Authenticated request with optional user ID
 * @param res - Response with QR data URL and referral link
 */
export async function getQRUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const user = await userService.findById(userId);

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const dataUrl = await qrService.generateQRDataUrl(user.referralCode);
  const referralLink = qrService.getReferralLink(user.referralCode);

  const response: ApiResponse<{
    dataUrl: string;
    referralLink: string;
    referralCode: string;
  }> = {
    success: true,
    data: {
      dataUrl,
      referralLink,
      referralCode: user.referralCode,
    },
  };

  res.json(response);
}

/**
 * Update user profile
 * Actualiza perfil de usuario
 *
 * @param req - Authenticated request with profile data
 * @param res - Response with updated user
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { firstName, lastName, phone } = req.body;

  const user = await userService.updateUser(userId, { firstName, lastName, phone });
  if (!user) {
    res.status(404).json(ApiResponse.error('NOT_FOUND', 'User not found', 404));
    return;
  }

  res.json({ success: true, data: user });
}

/**
 * Change user password
 * Cambia contraseña de usuario
 *
 * @param req - Authenticated request with current and new password
 * @param res - Success response
 * @throws {AppError} 400 - If current password is incorrect
 */
export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  const user = await userService.findById(userId);
  if (!user) {
    res.status(404).json(ApiResponse.error('NOT_FOUND', 'User not found', 404));
    return;
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Current password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await userService.updatePassword(userId, newHash);

  res.json({ success: true, message: 'Password changed successfully' });
}

/**
 * Delete user account
 * Elimina cuenta de usuario
 *
 * @param req - Authenticated request with password confirmation
 * @param res - Success response
 * @throws {AppError} 400 - If password is incorrect
 */
export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { password } = req.body;

  const user = await userService.findById(userId);
  if (!user) {
    res.status(404).json(ApiResponse.error('NOT_FOUND', 'User not found', 404));
    return;
  }

  if (user.role === 'admin') {
    res.status(403).json(ApiResponse.error('FORBIDDEN', 'Admin accounts cannot be deleted', 403));
    return;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Password is incorrect');
  }

  await userService.deleteUser(userId);
  res.json({ success: true, message: 'Account deleted successfully' });
}

// ============================================================
// PHASE 3: NEW ENDPOINTS FOR VISUAL TREE UI
// ============================================================

/**
 * Search users in subtree / Busca usuarios en el subtree
 *
 * PHASE 3: Endpoint para buscar usuarios en los downlines del árbol.
 * PHASE 3: Endpoint to search users in the tree downlines.
 *
 * Utiliza la closure table para eficiencia en la búsqueda de descendientes.
 * Uses the closure table for efficient descendant search.
 *
 * Búsqueda case-insensitive por email o código de referido.
 * Case-insensitive search by email or referral code.
 *
 * @param req - Authenticated request with query params:
 *               - q: Search term (min 2 chars) / Término de búsqueda (min 2 chars)
 *               - limit: Max results (default 20) / Máximo resultados (default 20)
 * @param res - Array of matching users with id, email, referralCode, level
 *
 * @example GET /api/users/search?q=john&limit=10
 * @example GET /api/users/search?q=REFCODE
 */
/**
 * Search users in subtree
 * Busca usuarios en el subárbol del usuario autenticado
 *
 * Phase 3: Visual Tree UI - Endpoint para búsqueda de usuarios en el árbol
 * Phase 3: Visual Tree UI - Endpoint for searching users in the authenticated user's tree
 *
 * @route GET /api/users/search
 * @access Authenticated
 * @param req.query.q - Search query (min 2 characters)
 * @param req.query.limit - Max results (default 20)
 * @returns UserSearchResult[] - Array of matching users
 *
 * @example GET /api/users/search?q=john&limit=10
 */
export async function searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { q } = req.query;
  const userId = req.user!.id;

  if (!q || typeof q !== 'string' || q.length < 2) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_QUERY', message: 'Query must be at least 2 characters' },
    });
    return;
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const results = await treeServiceInstance.searchInSubtree(userId, q, limit);

  res.json({
    success: true,
    data: results,
  });
}

/**
 * Get user details / Obtiene detalles de usuario
 *
 * PHASE 3: Endpoint para ver detalles extendidos de un usuario en el árbol.
 * PHASE 3: Endpoint to view extended details of a user in the tree.
 *
 * Verifica que el usuario solicitante sea ancestro del usuario consultado.
 * Verifies the requester is an ancestor of the requested user.
 *
 * Incluye estadísticas de pierna izquierda/derecha y total downline.
 * Includes left/right leg statistics and total downline.
 *
 * @param req - Authenticated request with:
 *              - params.id: User ID to view / ID del usuario a ver
 * @param res - Extended user details:
 *              - id, email, referralCode, position, level, status
 *              - stats: { leftCount, rightCount, totalDownline }
 *
 * @example GET /api/users/{userId}/details
 * @example GET /api/users/self/details (for own details)
 */
/**
 * Get user details by ID
 * Obtiene detalles de usuario por ID
 *
 * Phase 3: Visual Tree UI - Endpoint para ver detalles de usuario seleccionado
 * Phase 3: Visual Tree UI - Endpoint for viewing selected user details
 *
 * @route GET /api/users/:id/details
 * @access Authenticated (must be in user's network)
 * @param req.params.id - User ID to get details for
 * @returns UserDetails - Extended user details including tree stats
 *
 * @example GET /api/users/123e4567-e89b-12d3-a456-426614174000/details
 */
export async function getUserDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const requesterId = req.user!.id;

  if (!id) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'User ID is required' },
    });
    return;
  }

  const details = await treeServiceInstance.getUserDetails(id, requesterId);

  if (!details) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found or not in your network' },
    });
    return;
  }

  res.json({
    success: true,
    data: details,
  });
}
