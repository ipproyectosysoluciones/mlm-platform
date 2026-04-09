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
  getBotHealth,
} from '../controllers/BotController';
import { asyncHandler } from '../middleware/asyncHandler';

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
 * @desc    Search available properties (simplified format for AI prompt)
 *          Buscar propiedades disponibles (formato simplificado para prompt IA)
 * @access  Bot-only (x-bot-secret)
 * @query   city, type, maxPrice, limit
 */
router.get('/properties', asyncHandler(getBotProperties));

/**
 * @route   GET /api/bot/tours
 * @desc    Search active tour packages (simplified format for AI prompt)
 *          Buscar paquetes turísticos activos (formato simplificado para prompt IA)
 * @access  Bot-only (x-bot-secret)
 * @query   destination, type, maxPrice, limit
 */
router.get('/tours', asyncHandler(getBotTours));

/**
 * @route   GET /api/bot/health
 * @desc    Backend health check for the bot process.
 *          Returns status, timestamp, and basic config flags (openai key present, bot secret present).
 *          Health check del backend para el proceso bot.
 *          Devuelve estado, timestamp y flags de configuración básicos.
 * @access  Bot-only (x-bot-secret)
 */
router.get('/health', asyncHandler(getBotHealth));

export default router;
