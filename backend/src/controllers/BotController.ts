/**
 * @fileoverview Bot Controller - Internal API endpoints for WhatsApp bot
 * @description Provides user lookup, wallet info, network summary, commission data,
 *              property listings, and tour package listings for the WhatsApp bot.
 *              All endpoints are protected by x-bot-secret header (see bot.middleware.ts).
 *              Provee búsqueda de usuarios, info de wallet, resumen de red, comisiones,
 *              propiedades y tours para el bot de WhatsApp.
 * @module controllers/BotController
 */

import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { User, Wallet, Commission, WithdrawalRequest } from '../models';
import { propertyService } from '../services/PropertyService';
import { tourPackageService } from '../services/TourPackageService';
import { Property } from '../models/Property';
import { TourPackage } from '../models/TourPackage';

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

// ── GET /api/bot/properties ───────────────────────────────────────────────────

/**
 * @swagger
 * /bot/properties:
 *   get:
 *     summary: Search available properties (Bot API)
 *     description: |
 *       Returns a simplified list of available properties optimized for WhatsApp bot prompts.
 *       Requires `X-Bot-Secret` header with the value of `BOT_SECRET` env variable.
 *
 *       Retorna una lista simplificada de propiedades disponibles optimizada para prompts del bot de WhatsApp.
 *       Requiere el header `X-Bot-Secret` con el valor de la variable de entorno `BOT_SECRET`.
 *     tags: [bot]
 *     security:
 *       - botSecret: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         description: Filter by city / Filtrar por ciudad
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rental, sale, management]
 *         description: Filter by property type / Filtrar por tipo de propiedad
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *         description: Maximum price filter / Filtro de precio máximo
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5, maximum: 10 }
 *         description: Max results (default 5, cap 10) / Máximo resultados (default 5, cap 10)
 *     responses:
 *       200:
 *         description: List of available properties / Lista de propiedades disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 properties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BotProperty'
 *                 total:
 *                   type: integer
 *                   description: Number of results returned / Número de resultados retornados
 *       401:
 *         description: Missing or invalid BOT_SECRET / BOT_SECRET ausente o inválido
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * Search available properties and return a simplified format optimized for bot prompts.
 * Busca propiedades disponibles y retorna un formato simplificado para prompts del bot.
 *
 * @param req  - Express request with optional query params: city, type, maxPrice, limit
 * @param res  - Express response — returns { properties, total }
 * @param next - Express next function for error forwarding
 *
 * @query city     - Filter by city / Filtrar por ciudad
 * @query type     - Filter by property type / Filtrar por tipo de propiedad
 * @query maxPrice - Maximum price filter / Filtro de precio máximo
 * @query limit    - Max results (default 5, cap 10) / Máximo resultados (default 5, cap 10)
 */
export const getBotProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { city, type, maxPrice, limit = '5' } = req.query as Record<string, string>;

    const filters: Record<string, unknown> = {
      limit: Math.min(parseInt(limit, 10) || 5, 10),
      page: 1,
      status: 'available',
    };
    if (city) filters.city = city;
    if (type) filters.type = type;
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);

    const { rows } = await propertyService.findAll(
      filters as Parameters<typeof propertyService.findAll>[0]
    );

    // Return simplified format optimized for bot prompts
    // Retorna formato simplificado optimizado para prompts del bot
    const simplified = rows.map((p: Property) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      price: p.price,
      currency: p.currency,
      city: p.city,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaM2: p.areaM2,
    }));

    res.json({ properties: simplified, total: simplified.length });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/bot/tours ────────────────────────────────────────────────────────

/**
 * @swagger
 * /bot/tours:
 *   get:
 *     summary: Search active tour packages (Bot API)
 *     description: |
 *       Returns a simplified list of active tour packages optimized for WhatsApp bot prompts.
 *       Requires `X-Bot-Secret` header with the value of `BOT_SECRET` env variable.
 *
 *       Retorna una lista simplificada de paquetes turísticos activos optimizada para prompts del bot de WhatsApp.
 *       Requiere el header `X-Bot-Secret` con el valor de la variable de entorno `BOT_SECRET`.
 *     tags: [bot]
 *     security:
 *       - botSecret: []
 *     parameters:
 *       - in: query
 *         name: destination
 *         schema: { type: string }
 *         description: Filter by destination / Filtrar por destino
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *         description: Filter by tour type / Filtrar por tipo de tour
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *         description: Maximum price filter / Filtro de precio máximo
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5, maximum: 10 }
 *         description: Max results (default 5, cap 10) / Máximo resultados (default 5, cap 10)
 *     responses:
 *       200:
 *         description: List of active tour packages / Lista de paquetes turísticos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tours:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BotTour'
 *                 total:
 *                   type: integer
 *                   description: Number of results returned / Número de resultados retornados
 *       401:
 *         description: Missing or invalid BOT_SECRET / BOT_SECRET ausente o inválido
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * Search active tour packages and return a simplified format optimized for bot prompts.
 * Busca paquetes turísticos activos y retorna un formato simplificado para prompts del bot.
 *
 * @param req  - Express request with optional query params: destination, type, maxPrice, limit
 * @param res  - Express response — returns { tours, total }
 * @param next - Express next function for error forwarding
 *
 * @query destination - Filter by destination / Filtrar por destino
 * @query type        - Filter by tour type / Filtrar por tipo de tour
 * @query maxPrice    - Maximum price filter / Filtro de precio máximo
 * @query limit       - Max results (default 5, cap 10) / Máximo resultados (default 5, cap 10)
 */
export const getBotTours = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { destination, type, maxPrice, limit = '5' } = req.query as Record<string, string>;

    const filters: Record<string, unknown> = {
      limit: Math.min(parseInt(limit, 10) || 5, 10),
      page: 1,
      status: 'active',
    };
    if (destination) filters.destination = destination;
    if (type) filters.type = type;
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);

    const { rows } = await tourPackageService.findAll(
      filters as Parameters<typeof tourPackageService.findAll>[0]
    );

    // Return simplified format optimized for bot prompts
    // Retorna formato simplificado optimizado para prompts del bot
    const simplified = rows.map((t: TourPackage) => ({
      id: t.id,
      type: t.type,
      title: t.title,
      destination: t.destination,
      price: t.price,
      currency: t.currency,
      durationDays: t.durationDays,
      maxCapacity: t.maxCapacity,
    }));

    res.json({ tours: simplified, total: simplified.length });
  } catch (error) {
    next(error);
  }
};
