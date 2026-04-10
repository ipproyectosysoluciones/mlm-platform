/**
 * @fileoverview Bot Routes - Internal API for WhatsApp bot integration
 * @description All routes require `x-bot-secret` header authentication.
 *              These endpoints are NOT exposed to regular users — only the bot service calls them.
 * @module routes/bot.routes
 */

import { Router } from 'express';
import { authenticateBot } from '../middleware/bot.middleware';
import {
  getUserByPhone,
  getWalletInfo,
  getNetworkSummary,
  getRecentCommissions,
  getBotProperties,
  getBotTours,
  getBotReservations,
  getBotHealth,
} from '../controllers/BotController';
import { asyncHandler } from '../middleware/asyncHandler';
import botLeadsRouter from './bot-leads.routes';

const router = Router();

// All bot routes require the shared secret
router.use(authenticateBot);

/**
 * @route   GET /api/bot/user-by-phone/:phone
 * @desc    Find user by WhatsApp phone number
 * @access  Bot-only (x-bot-secret)
 */
router.get('/user-by-phone/:phone', asyncHandler(getUserByPhone));

/**
 * @route   GET /api/bot/wallet/:userId
 * @desc    Get wallet balance, pending withdrawals, and total earned
 * @access  Bot-only (x-bot-secret)
 */
router.get('/wallet/:userId', asyncHandler(getWalletInfo));

/**
 * @route   GET /api/bot/network/:userId
 * @desc    Get binary network summary (referrals, legs, level)
 * @access  Bot-only (x-bot-secret)
 */
router.get('/network/:userId', asyncHandler(getNetworkSummary));

/**
 * @route   GET /api/bot/commissions/:userId
 * @desc    Get recent commissions (default: last 5, max: 10)
 * @access  Bot-only (x-bot-secret)
 * @query   limit - Number of results (default 5)
 */
router.get('/commissions/:userId', asyncHandler(getRecentCommissions));

/**
 * @route   GET /api/bot/properties
 * @desc    Get active property listings for bot catalog flow
 * @access  Bot-only (x-bot-secret)
 */
router.get('/properties', asyncHandler(getBotProperties));

/**
 * @route   GET /api/bot/tours
 * @desc    Get active tour packages for bot catalog flow
 * @access  Bot-only (x-bot-secret)
 */
router.get('/tours', asyncHandler(getBotTours));

/**
 * @route   GET /api/bot/reservations/:userId
 * @desc    Get recent reservations for a user (property + tour)
 *          Obtener reservas recientes de un usuario (propiedad + tour)
 * @access  Bot-only (x-bot-secret)
 * @query   limit (default 5, max 10), status, type
 */
router.get('/reservations/:userId', asyncHandler(getBotReservations));

/**
 * @route   GET /api/bot/health
 * @desc    Backend health check for the bot process.
 *          Returns status, timestamp, and basic config flags (openai key present, bot secret present).
 *          Health check del backend para el proceso bot.
 *          Devuelve estado, timestamp y flags de configuración básicos.
 * @access  Bot-only (x-bot-secret)
 */
router.get('/health', asyncHandler(getBotHealth));

/**
 * @route   POST /api/bot/leads
 * @desc    Persist a lead captured by the WhatsApp AI bot (Sophia / Max)
 *          Persistir un lead capturado por el bot de WhatsApp con IA (Sophia / Max)
 * @access  Bot-only (x-bot-secret)
 */
router.use('/leads', botLeadsRouter);

export default router;
