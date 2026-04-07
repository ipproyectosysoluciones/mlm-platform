/**
 * @fileoverview Bot Controller - Internal API endpoints for WhatsApp bot
 * @description Provides user lookup, wallet info, network summary, and
 *              commission data for the WhatsApp bot. All endpoints are
 *              protected by x-bot-secret header (see bot.middleware.ts).
 * @module controllers/BotController
 */

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User, Wallet, Commission, WithdrawalRequest } from '../models';

// ── GET /api/bot/user-by-phone/:phone ─────────────────────────────────────────

/**
 * Look up a user by their phone number.
 * We match against `twoFactorPhone` — the only phone field on the User model.
 * The bot sends the raw WhatsApp number (e.g. "5491122334455").
 * We strip the country code prefix and try multiple formats.
 */
export async function getUserByPhone(req: Request, res: Response): Promise<void> {
  const { phone } = req.params;

  if (!phone) {
    res
      .status(400)
      .json({ success: false, error: { code: 'BAD_REQUEST', message: 'Phone required' } });
    return;
  }

  // Normalize: strip leading + or zeros, keep digits only
  const digits = phone.replace(/\D/g, '');

  // Try to find by twoFactorPhone — users register their WhatsApp number here
  const user = await User.findOne({
    where: {
      twoFactorPhone: {
        [Op.or]: [
          digits,
          `+${digits}`,
          // Argentinian numbers: 549XXXXXXXXXX → +54 9 XX XXXX-XXXX
          digits.length === 13 && digits.startsWith('549') ? digits.slice(2) : null,
        ].filter(Boolean),
      },
    },
    attributes: ['id', 'email', 'referralCode', 'twoFactorPhone', 'status', 'role', 'level'],
  });

  if (!user) {
    res.json({ success: true, user: null });
    return;
  }

  // Return a safe subset — never expose passwordHash or secrets
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      // username derived from email prefix (no separate username field)
      username: user.email.split('@')[0],
      firstName: user.email.split('@')[0], // fallback — no firstName in model
      lastName: '',
      phone: user.twoFactorPhone,
      role: user.role,
      level: user.level,
      status: user.status,
    },
  });
}

// ── GET /api/bot/wallet/:userId ───────────────────────────────────────────────

/**
 * Returns wallet balance + pending withdrawals + total earned (from paid commissions).
 */
export async function getWalletInfo(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;

  const [wallet, pendingWithdrawals, totalEarnedResult] = await Promise.all([
    Wallet.findOne({ where: { userId } }),
    WithdrawalRequest.findAll({
      where: { userId, status: 'pending' },
      attributes: ['amount'],
    }),
    Commission.sum('amount', {
      where: { userId, status: 'paid' },
    }),
  ]);

  if (!wallet) {
    res.json({ success: true, wallet: null });
    return;
  }

  const pendingTotal = pendingWithdrawals.reduce(
    (sum: number, w: WithdrawalRequest) => sum + Number((w as any).amount),
    0
  );

  res.json({
    success: true,
    wallet: {
      balance: Number(wallet.balance),
      pendingWithdrawals: pendingTotal,
      totalEarned: Number(totalEarnedResult ?? 0),
      currency: wallet.currency ?? 'USD',
    },
  });
}

// ── GET /api/bot/network/:userId ──────────────────────────────────────────────

/**
 * Returns the user's binary tree network summary.
 */
export async function getNetworkSummary(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;

  const user = await User.findByPk(userId, {
    attributes: ['id', 'level'],
  });

  if (!user) {
    res.json({ success: true, network: null });
    return;
  }

  // Count direct referrals
  const [totalReferrals, leftLeg, rightLeg, activeReferrals] = await Promise.all([
    User.count({ where: { sponsorId: userId } }),
    User.count({ where: { sponsorId: userId, position: 'left' } }),
    User.count({ where: { sponsorId: userId, position: 'right' } }),
    User.count({ where: { sponsorId: userId, status: 'active' } }),
  ]);

  res.json({
    success: true,
    network: {
      totalReferrals,
      activeReferrals,
      leftLeg,
      rightLeg,
      level: user.level,
    },
  });
}

// ── GET /api/bot/commissions/:userId ─────────────────────────────────────────

/**
 * Returns the last N commissions for a user.
 * Query param: ?limit=5 (default 5, max 10)
 */
export async function getRecentCommissions(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 5), 10);

  const commissions = await Commission.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    attributes: ['id', 'amount', 'type', 'description', 'status', 'currency', 'createdAt'],
  });

  res.json({
    success: true,
    commissions: commissions.map((c: Commission) => ({
      amount: Number(c.amount),
      type: c.type,
      description: c.description ?? c.type,
      status: c.status,
      currency: c.currency,
      createdAt: c.createdAt,
    })),
  });
}
