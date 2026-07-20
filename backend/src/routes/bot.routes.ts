/**
 * @fileoverview Bot Routes - Internal API for WhatsApp bot integration
 * @description All routes require `x-bot-secret` header authentication.
 *              These endpoints are NOT exposed to regular users — only the bot service calls them.
 * @module routes/bot.routes
 */

import { Router } from 'express';
import { authenticateBot } from '../middleware/bot.middleware.js';
import {
  getUserByPhone,
  getWalletInfo,
  getNetworkSummary,
  getRecentCommissions,
  getBotProperties,
  getBotTours,
  getBotReservations,
  getBotHealth,
} from '../controllers/BotController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import botLeadsRouter from './bot-leads.routes.js';

const router = Router();

// All bot routes require the shared secret
router.use(authenticateBot);

/**
 * @swagger
 * /bot/user-by-phone/{phone}:
 *   get:
 *     summary: Find user by phone number / Buscar usuario por número de teléfono
 *     description: Looks up a user by their WhatsApp phone number (twoFactorPhone field)
 *     tags: [Bot]
 *     security:
 *       - botSecret: []
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: WhatsApp phone number (digits only, e.g. 5491122334455) / Número de WhatsApp
 *     responses:
 *       200:
 *         description: User found or null if not found / Usuario encontrado o null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                     level:
 *                       type: integer
 *                     status:
 *                       type: string
 *       400:
 *         description: Phone parameter required / Parámetro phone requerido
 *       401:
 *         description: Missing or invalid bot secret / Bot secret ausente o inválido
 */
router.get('/user-by-phone/:phone', asyncHandler(getUserByPhone));

/**
 * @swagger
 * /bot/wallet/{userId}:
 *   get:
 *     summary: Get wallet info / Obtener info del wallet
 *     description: Returns wallet balance, pending withdrawals, and total earned for a user
 *     tags: [Bot]
 *     security:
 *       - botSecret: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID / ID del usuario
 *     responses:
 *       200:
 *         description: Wallet info retrieved / Info del wallet obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 wallet:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     balance:
 *                       type: number
 *                     pendingWithdrawals:
 *                       type: number
 *                     totalEarned:
 *                       type: number
 *                     currency:
 *                       type: string
 *       401:
 *         description: Missing or invalid bot secret / Bot secret ausente o inválido
 */
router.get('/wallet/:userId', asyncHandler(getWalletInfo));

/**
 * @swagger
 * /bot/network/{userId}:
 *   get:
 *     summary: Get network summary / Obtener resumen de red
 *     description: Returns the user's binary tree network summary (referrals, legs, level)
 *     tags: [Bot]
 *     security:
 *       - botSecret: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID / ID del usuario
 *     responses:
 *       200:
 *         description: Network summary retrieved / Resumen de red obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 network:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     totalReferrals:
 *                       type: integer
 *                     activeReferrals:
 *                       type: integer
 *                     leftLeg:
 *                       type: integer
 *                     rightLeg:
 *                       type: integer
 *                     level:
 *                       type: integer
 *       401:
 *         description: Missing or invalid bot secret / Bot secret ausente o inválido
 */
router.get('/network/:userId', asyncHandler(getNetworkSummary));

/**
 * @swagger
 * /bot/commissions/{userId}:
 *   get:
 *     summary: Get recent commissions / Obtener comisiones recientes
 *     description: Returns the most recent commissions for a user (default 5, max 10)
 *     tags: [Bot]
 *     security:
 *       - botSecret: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID / ID del usuario
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 10
 *         description: Number of results (max 10) / Cantidad de resultados (máx 10)
 *     responses:
 *       200:
 *         description: Commissions retrieved / Comisiones obtenidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 commissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       currency:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Missing or invalid bot secret / Bot secret ausente o inválido
 */
router.get('/commissions/:userId', asyncHandler(getRecentCommissions));

/**
 * @swagger
 * /bot/properties:
 *   get:
 *     summary: Get active property listings / Obtener listado de propiedades activas
 *     description: Returns a simplified list of available properties optimized for bot prompts
 *     tags: [Bot]
 *     security:
 *       - botSecret: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city / Filtrar por ciudad
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rental, sale, management]
 *         description: Filter by property type / Filtrar por tipo de propiedad
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter / Filtro de precio máximo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 10
 *         description: Max results (default 5, cap 10) / Máximo resultados (default 5, máx 10)
 *     responses:
 *       200:
 *         description: Properties retrieved / Propiedades obtenidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 properties:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *       401:
 *         description: Missing or invalid bot secret / Bot secret ausente o inválido
 *       500:
 *         description: Internal error / Error interno
 */
router.get('/properties', asyncHandler(getBotProperties));

/**
 * @swagger
 * /bot/tours:
 *   get:
 *     summary: Get active tour packages / Obtener paquetes turísticos activos
 *     description: Returns a simplified list of active tour packages optimized for bot prompts
 *     tags: [Bot]
 *     security:
 *       - botSecret: []
 *     parameters:
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Filter by destination / Filtrar por destino
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by tour type / Filtrar por tipo de tour
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter / Filtro de precio máximo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 10
 *         description: Max results (default 5, cap 10) / Máximo resultados (default 5, máx 10)
 *     responses:
 *       200:
 *         description: Tour packages retrieved / Paquetes turísticos obtenidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tours:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *       401:
 *         description: Missing or invalid bot secret / Bot secret ausente o inválido
 *       500:
 *         description: Internal error / Error interno
 */
router.get('/tours', asyncHandler(getBotTours));

/**
 * @swagger
 * /bot/reservations/{userId}:
 *   get:
 *     summary: Get recent reservations / Obtener reservas recientes
 *     description: Returns recent reservations (property + tour) for a user
 *     tags: [Bot]
 *     security:
 *       - botSecret: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID / ID del usuario
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 10
 *         description: Max results (default 5, cap 10) / Máximo resultados (default 5, máx 10)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by reservation status / Filtrar por estado de reserva
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [property, tour]
 *         description: Filter by type (property | tour) / Filtrar por tipo
 *     responses:
 *       200:
 *         description: Reservations retrieved / Reservas obtenidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reservations:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *       401:
 *         description: Missing or invalid bot secret / Bot secret ausente o inválido
 */
router.get('/reservations/:userId', asyncHandler(getBotReservations));

/**
 * @swagger
 * /bot/health:
 *   get:
 *     summary: Backend health check for bot / Health check del backend para el bot
 *     description: |
 *       Returns service status, uptime, timestamp, and config flags (openai key, bot secret).
 *       Provides DB connectivity and recent-activity counts for demo readiness.
 *     tags: [Bot]
 *     security:
 *       - botSecret: []
 *     responses:
 *       200:
 *         description: Health status retrieved / Estado de salud obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [ok, degraded]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     service:
 *                       type: string
 *                     uptimeSeconds:
 *                       type: integer
 *                     config:
 *                       type: object
 *                       properties:
 *                         openai:
 *                           type: boolean
 *                         botSecret:
 *                           type: boolean
 *                         n8n:
 *                           type: boolean
 *                     db:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         activeUsers:
 *                           type: integer
 *                         reservationsLast24h:
 *                           type: integer
 *       401:
 *         description: Missing or invalid bot secret / Bot secret ausente o inválido
 */
router.get('/health', asyncHandler(getBotHealth));

/**
 * @swagger
 * /bot/leads:
 *   post:
 *     summary: Persist a bot lead / Persistir un lead del bot
 *     description: |
 *       Persists a lead captured by the WhatsApp AI bot (Sophia / Max).
 *       Deduplicates by phone number (ON CONFLICT DO NOTHING).
 *     tags: [Bot]
 *     security:
 *       - botSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - agentName
 *               - language
 *               - source
 *             properties:
 *               name:
 *                 type: string
 *                 description: Lead name / Nombre del lead
 *               phone:
 *                 type: string
 *                 description: WhatsApp phone number / Número de WhatsApp
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Lead email (optional) / Email del lead (opcional)
 *               areaOfInterest:
 *                 type: string
 *                 description: Area of interest / Área de interés
 *               agentName:
 *                 type: string
 *                 description: Bot agent name (Sophia or Max) / Nombre del agente bot
 *               language:
 *                 type: string
 *                 description: User language / Idioma del usuario
 *               source:
 *                 type: string
 *                 enum: [whatsapp_bot]
 *                 description: Lead source (must be whatsapp_bot) / Fuente del lead
 *     responses:
 *       201:
 *         description: Lead created / Lead creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 leadId:
 *                   type: string
 *                 created:
 *                   type: boolean
 *       200:
 *         description: Lead already exists (duplicate phone) / Lead ya existe (teléfono duplicado)
 *       400:
 *         description: Missing or invalid required fields / Campos requeridos faltantes o inválidos
 *       401:
 *         description: Missing or invalid bot secret / Bot secret ausente o inválido
 */
router.use('/leads', botLeadsRouter);

export default router;
