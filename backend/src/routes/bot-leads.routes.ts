/**
 * @fileoverview Bot Leads Routes — Internal API
 * @description POST /api/bot/leads — persists leads captured by the WhatsApp bot.
 *              Requires x-bot-secret header authentication (same as all bot routes).
 *              POST /api/bot/leads — persiste leads capturados por el bot de WhatsApp.
 *              Requiere autenticación por header x-bot-secret (igual que todas las rutas bot).
 * @module routes/bot-leads.routes
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sequelize } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /bot/leads:
 *   post:
 *     summary: Create bot lead / Crear lead del bot
 *     description: Persists a lead captured by the WhatsApp AI bot (Sophia / Max). Deduplicates by phone.
 *     tags: [Bot Leads]
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
 *                 description: Phone number / Número de teléfono
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (optional, auto-generated if missing) / Correo electrónico (opcional)
 *               areaOfInterest:
 *                 type: string
 *                 description: Area of interest / Área de interés
 *               agentName:
 *                 type: string
 *                 description: Bot agent name (Sophia or Max) / Nombre del agente bot
 *               language:
 *                 type: string
 *                 description: Conversation language / Idioma de la conversación
 *               source:
 *                 type: string
 *                 enum:
 *                   - whatsapp_bot
 *                 description: Lead source / Fuente del lead
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
 *                   format: uuid
 *                 created:
 *                   type: boolean
 *                   description: true if newly created / true si fue creado
 *       200:
 *         description: Lead already exists (duplicate phone) / Lead ya existe (teléfono duplicado)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 created:
 *                   type: boolean
 *                   description: false — duplicate / false — duplicado
 *       400:
 *         description: Missing or invalid required fields / Campos requeridos faltantes o inválidos
 *       500:
 *         description: Server misconfiguration or internal error / Error de configuración o interno
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, email, areaOfInterest, agentName, language, source } = req.body as {
      name: string;
      phone: string;
      email?: string;
      areaOfInterest?: string;
      agentName: string;
      language: string;
      source: string;
    };

    // Validate required fields
    // Validar campos requeridos
    if (!name || !phone || !agentName || !language || source !== 'whatsapp_bot') {
      res.status(400).json({
        success: false,
        message: 'Missing or invalid required fields: name, phone, agentName, language, source',
      });
      return;
    }

    const systemUserId = process.env.BOT_SYSTEM_USER_ID;
    if (!systemUserId) {
      logger.error(
        { component: 'BotLeads' },
        'BOT_SYSTEM_USER_ID is not set — cannot persist lead'
      );
      res.status(500).json({ success: false, message: 'Server misconfiguration' });
      return;
    }

    // Use email if provided, otherwise generate a placeholder (contact_email is NOT NULL)
    // Usar email si se proveyó, sino generar un placeholder (contact_email es NOT NULL)
    const contactEmail = email ?? `bot-${phone}@nexoreal.bot`;

    // Build notes with conversation context
    // Construir notas con contexto de la conversación
    const notes = [
      `Capturado por bot WhatsApp — agente: ${agentName}`,
      `Idioma: ${language}`,
      areaOfInterest ? `Área de interés: ${areaOfInterest}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    // Insert lead into database — ON CONFLICT DO NOTHING deduplicates by phone
    // Insertar lead en la base de datos — ON CONFLICT DO NOTHING deduplica por teléfono
    const [result] = await sequelize.query(
      `INSERT INTO leads (
        id, user_id, contact_name, contact_phone, contact_email,
        source, status, notes, metadata, created_at, updated_at
      ) VALUES (
        :id, :userId, :name, :phone, :email,
        'whatsapp_bot', 'new', :notes, :metadata,
        NOW(), NOW()
      )
      ON CONFLICT DO NOTHING
      RETURNING id`,
      {
        replacements: {
          id: uuidv4(),
          userId: systemUserId,
          name,
          phone,
          email: contactEmail,
          notes,
          metadata: JSON.stringify({
            agentName,
            language,
            areaOfInterest: areaOfInterest ?? null,
            capturedAt: new Date().toISOString(),
          }),
        },
      }
    );

    const rows = result as { id: string }[];

    if (rows.length === 0) {
      // Duplicate phone — already exists, not an error
      // Teléfono duplicado — ya existe, no es un error
      res.status(200).json({ success: true, message: 'Lead already exists', created: false });
      return;
    }

    res.status(201).json({ success: true, leadId: rows[0].id, created: true });
  })
);

export default router;
