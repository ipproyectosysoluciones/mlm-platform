/**
 * @fileoverview PublicController - Public endpoints for referral and registration
 * @description Handles public endpoints for viewing user profiles via referral code
 *              and registration with sponsor verification.
 *              Gestiona endpoints públicos para ver perfiles de usuarios vía código de referido
 *              y registro con verificación de patrocinador.
 * @module controllers/PublicController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { User } from '../models';
import { userService, treeServiceInstance } from '../services/UserService';
import type { ApiResponse } from '../types';
import { LEVEL_NAMES } from '../types';
import type { Request } from 'express';
import { ApiResponse as ResponseUtil } from '../utils/response.util';

/**
 * Get public user profile by referral code
 * Obtiene perfil público de usuario por código de referido
 *
 * @route GET /api/public/profile/:code
 * @access Public
 * @param req - Request with referral code
 * @param res - Response with public profile data
 */
export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  const { code } = req.params;

  if (!code) {
    res.status(400).json(ResponseUtil.error('INVALID_PARAMS', 'Referral code is required', 400));
    return;
  }

  const user = await User.findOne({
    where: { referralCode: code.toUpperCase() },
    attributes: [
      'id',
      'email',
      'referralCode',
      'level',
      'position',
      'status',
      'createdAt',
      'updatedAt',
    ],
  });

  if (!user) {
    res.status(404).json(ResponseUtil.error('NOT_FOUND', 'Profile not found', 404));
    return;
  }

  const legCounts = await treeServiceInstance.getLegCounts(user.id);
  const directReferrals = await userService.getDirectReferrals(user.id);

  const response: ApiResponse<{
    referralCode: string;
    fullName: string;
    email: string;
    phone: string | null;
    level: number;
    levelName: string;
    joinDate: Date;
    totalDownline: number;
    directReferrals: number;
    description: string | null;
    avatarUrl: string | null;
  }> = {
    success: true,
    data: {
      referralCode: user.referralCode,
      fullName: user.email.split('@')[0],
      email: user.email,
      phone: null,
      level: user.level,
      levelName: LEVEL_NAMES[user.level as keyof typeof LEVEL_NAMES] || 'Starter',
      joinDate: user.createdAt,
      totalDownline: legCounts.leftCount + legCounts.rightCount,
      directReferrals: directReferrals.length,
      description: null,
      avatarUrl: null,
    },
  };

  res.json(response);
}

/**
 * Get sitemap data for SEO
 * Obtiene datos del sitemap para SEO
 *
 * @param req - Request
 * @param res - Response with sitemap data
 */
export async function getSitemapUsers(req: Request, res: Response): Promise<void> {
  const users = await User.findAll({
    attributes: ['referralCode', 'updatedAt'],
    where: { status: 'active' },
    limit: 1000,
    order: [['updatedAt', 'DESC']],
  });

  const response: ApiResponse<
    Array<{
      referralCode: string;
      updatedAt: Date;
    }>
  > = {
    success: true,
    data: users.map((user) => ({
      referralCode: user.referralCode,
      updatedAt: user.updatedAt,
    })),
  };

  res.json(response);
}
