/**
 * @fileoverview Bot Middleware - Authentication for WhatsApp bot internal API
 * @description Validates x-bot-secret header for bot-to-backend communication.
 *              No JWT needed — the bot is a trusted internal service.
 * @module middleware/bot.middleware
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to authenticate requests coming from the WhatsApp bot.
 * The bot sends the shared secret via the `x-bot-secret` header.
 */
export function authenticateBot(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-bot-secret'];
  const expected = process.env.BOT_SECRET;

  if (!expected) {
    // BOT_SECRET not configured — block all bot requests in this case
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Bot integration not configured' },
    });
    return;
  }

  if (!secret || secret !== expected) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid bot secret' },
    });
    return;
  }

  next();
}
