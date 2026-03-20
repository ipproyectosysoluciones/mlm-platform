import { Response } from 'express';
import { User } from '../models';
import { treeServiceInstance } from '../services/UserService';
import type { ApiResponse } from '../types';
import { LEVEL_NAMES } from '../types';
import type { Request } from 'express';

/**
 * Get public user profile by referral code
 * Obtiene perfil público de usuario por código de referido
 *
 * @param req - Request with referral code
 * @param res - Response with public profile data
 */
export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  const { code } = req.params;

  if (!code) {
    res.status(400).json({ success: false, error: 'Referral code is required' });
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
      'firstName',
      'lastName',
      'phone',
      'createdAt',
      'updatedAt',
    ],
  });

  if (!user) {
    res.status(404).json({ success: false, error: 'Profile not found' });
    return;
  }

  const legCounts = await treeServiceInstance.getLegCounts(user.id);
  const directReferrals = await treeServiceInstance.getDirectReferrals(user.id);

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
      fullName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0],
      email: user.email,
      phone: user.phone,
      level: user.level,
      levelName: LEVEL_NAMES[user.level as keyof typeof LEVEL_NAMES] || 'Starter',
      joinDate: user.createdAt,
      totalDownline: legCounts.left + legCounts.right,
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
    where: { isActive: true },
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
