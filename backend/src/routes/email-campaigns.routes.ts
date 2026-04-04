/**
 * @fileoverview Email Campaign Routes - API endpoints for email campaigns & templates
 * @description Endpoints for email template CRUD, campaign CRUD, preview, send, schedule, pause, retry, and logs
 *              Rutas API para CRUD de templates de email, CRUD de campañas, preview, envío, programación, pausa, reintento y logs
 * @module routes/email-campaigns.routes
 * @author MLM Development Team
 */
import { Router, Router as ExpressRouter } from 'express';
import { body, param, query } from 'express-validator';
import {
  createTemplate,
  listTemplates,
  getTemplate,
  deleteTemplate,
  createCampaign,
  listCampaigns,
  getCampaign,
  previewCampaign,
  sendCampaign,
  scheduleCampaign,
  pauseCampaign,
  retryFailedEmails,
  getCampaignLogs,
} from '../controllers/EmailCampaignController';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

// ============================================
// TEMPLATE ROUTES — Rutas de Templates
// ============================================

const templateRouter: ExpressRouter = Router();

// All template routes require authentication
templateRouter.use(authenticateToken);

/**
 * @swagger
 * /email-templates:
 *   post:
 *     summary: Create a new email template / Crear un nuevo template de email
 *     description: Creates an email template with variable validation. Admin only.
 *     tags: [email-templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subjectLine
 *               - htmlContent
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               subjectLine:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *               htmlContent:
 *                 type: string
 *                 minLength: 1
 *               wysiwygState:
 *                 type: object
 *                 description: Optional WYSIWYG editor state / Estado opcional del editor WYSIWYG
 *     responses:
 *       201:
 *         description: Template created / Template creado
 *       400:
 *         description: Validation error / Error de validación
 *       401:
 *         description: Not authenticated / No autenticado
 *       403:
 *         description: Not authorized / No autorizado
 */
templateRouter.post(
  '/',
  requireAdmin,
  validate([
    body('name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Name is required and must be 1-255 characters'),
    body('subjectLine')
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Subject line is required and must be 1-500 characters'),
    body('htmlContent').isString().isLength({ min: 1 }).withMessage('HTML content is required'),
    body('wysiwygState').optional().isObject().withMessage('WYSIWYG state must be an object'),
  ]),
  asyncHandler(createTemplate)
);

/**
 * @swagger
 * /email-templates:
 *   get:
 *     summary: List email templates / Listar templates de email
 *     description: Returns paginated list of email templates. Admin only.
 *     tags: [email-templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Templates retrieved / Templates obtenidos
 */
templateRouter.get(
  '/',
  requireAdmin,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ]),
  asyncHandler(listTemplates)
);

/**
 * @swagger
 * /email-templates/{id}:
 *   get:
 *     summary: Get email template by ID / Obtener template por ID
 *     tags: [email-templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Template details / Detalles del template
 *       404:
 *         description: Template not found / Template no encontrado
 */
templateRouter.get(
  '/:id',
  requireAdmin,
  validate([param('id').isUUID().withMessage('Invalid template ID')]),
  asyncHandler(getTemplate)
);

/**
 * @swagger
 * /email-templates/{id}:
 *   delete:
 *     summary: Soft delete email template / Borrado suave de template
 *     tags: [email-templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Template deleted / Template eliminado
 *       404:
 *         description: Template not found / Template no encontrado
 */
templateRouter.delete(
  '/:id',
  requireAdmin,
  validate([param('id').isUUID().withMessage('Invalid template ID')]),
  asyncHandler(deleteTemplate)
);

// ============================================
// CAMPAIGN ROUTES — Rutas de Campañas
// ============================================

const campaignRouter: ExpressRouter = Router();

// All campaign routes require authentication
campaignRouter.use(authenticateToken);

/**
 * @swagger
 * /email-campaigns:
 *   post:
 *     summary: Create a new email campaign / Crear una nueva campaña de email
 *     description: Creates a campaign linked to an email template. Admin only.
 *     tags: [email-campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - emailTemplateId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               emailTemplateId:
 *                 type: string
 *                 format: uuid
 *               recipientSegment:
 *                 type: object
 *                 description: Optional recipient filter / Filtro opcional de destinatarios
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 description: Optional schedule date / Fecha opcional de programación
 *     responses:
 *       201:
 *         description: Campaign created / Campaña creada
 *       400:
 *         description: Validation error / Error de validación
 *       404:
 *         description: Template not found / Template no encontrado
 */
campaignRouter.post(
  '/',
  requireAdmin,
  validate([
    body('name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Name is required and must be 1-255 characters'),
    body('emailTemplateId').isUUID().withMessage('Valid email template ID is required'),
    body('recipientSegment')
      .optional()
      .isObject()
      .withMessage('Recipient segment must be an object'),
    body('scheduledFor')
      .optional()
      .isISO8601()
      .withMessage('Scheduled date must be a valid ISO 8601 date'),
  ]),
  asyncHandler(createCampaign)
);

/**
 * @swagger
 * /email-campaigns:
 *   get:
 *     summary: List email campaigns (admin only) / Listar campañas de email (solo admin)
 *     tags: [email-campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, sending, paused, completed, cancelled]
 *     responses:
 *       200:
 *         description: Campaigns retrieved / Campañas obtenidas
 */
campaignRouter.get(
  '/',
  requireAdmin,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled'])
      .withMessage('Invalid campaign status filter'),
  ]),
  asyncHandler(listCampaigns)
);

/**
 * @swagger
 * /email-campaigns/{id}:
 *   get:
 *     summary: Get campaign details with stats / Obtener detalles de campaña con estadísticas
 *     tags: [email-campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Campaign details / Detalles de la campaña
 *       404:
 *         description: Campaign not found / Campaña no encontrada
 */
campaignRouter.get(
  '/:id',
  requireAdmin,
  validate([param('id').isUUID().withMessage('Invalid campaign ID')]),
  asyncHandler(getCampaign)
);

/**
 * @swagger
 * /email-campaigns/{id}/preview:
 *   get:
 *     summary: Preview rendered email for a user / Previsualizar email renderizado para un usuario
 *     tags: [email-campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Rendered preview / Preview renderizado
 *       404:
 *         description: Campaign or template not found / Campaña o template no encontrado
 */
campaignRouter.get(
  '/:id/preview',
  requireAdmin,
  validate([
    param('id').isUUID().withMessage('Invalid campaign ID'),
    query('userId').isUUID().withMessage('Valid userId query parameter is required'),
  ]),
  asyncHandler(previewCampaign)
);

/**
 * @swagger
 * /email-campaigns/{id}/send:
 *   post:
 *     summary: Send a campaign immediately / Enviar una campaña inmediatamente
 *     tags: [email-campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Campaign queued for delivery / Campaña en cola para envío
 *       400:
 *         description: Campaign cannot be sent / Campaña no puede ser enviada
 *       409:
 *         description: Campaign already sending / Campaña ya en envío
 */
campaignRouter.post(
  '/:id/send',
  requireAdmin,
  validate([param('id').isUUID().withMessage('Invalid campaign ID')]),
  asyncHandler(sendCampaign)
);

/**
 * @swagger
 * /email-campaigns/{id}/schedule:
 *   post:
 *     summary: Schedule a campaign for future delivery / Programar campaña para envío futuro
 *     tags: [email-campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledFor
 *             properties:
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Campaign scheduled / Campaña programada
 *       400:
 *         description: Invalid schedule date / Fecha de programación inválida
 *       404:
 *         description: Campaign not found / Campaña no encontrada
 */
campaignRouter.post(
  '/:id/schedule',
  requireAdmin,
  validate([
    param('id').isUUID().withMessage('Invalid campaign ID'),
    body('scheduledFor')
      .isISO8601()
      .withMessage('scheduledFor must be a valid ISO 8601 date')
      .custom((value: string) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Scheduled date must be in the future');
        }
        return true;
      }),
  ]),
  asyncHandler(scheduleCampaign)
);

/**
 * @swagger
 * /email-campaigns/{id}/pause:
 *   post:
 *     summary: Pause a sending campaign / Pausar una campaña en envío
 *     tags: [email-campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Campaign paused / Campaña pausada
 *       400:
 *         description: Campaign is not in sending status / Campaña no está en estado de envío
 *       404:
 *         description: Campaign not found / Campaña no encontrada
 */
campaignRouter.post(
  '/:id/pause',
  requireAdmin,
  validate([param('id').isUUID().withMessage('Invalid campaign ID')]),
  asyncHandler(pauseCampaign)
);

/**
 * @swagger
 * /email-campaigns/{id}/retry-failed:
 *   post:
 *     summary: Retry failed emails (admin only) / Reintentar emails fallidos (solo admin)
 *     tags: [email-campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Failed emails queued for retry / Emails fallidos en cola para reintento
 *       404:
 *         description: Campaign not found / Campaña no encontrada
 */
campaignRouter.post(
  '/:id/retry-failed',
  requireAdmin,
  validate([param('id').isUUID().withMessage('Invalid campaign ID')]),
  asyncHandler(retryFailedEmails)
);

/**
 * @swagger
 * /email-campaigns/{id}/logs:
 *   get:
 *     summary: Get campaign delivery logs (admin only) / Obtener logs de entrega (solo admin)
 *     tags: [email-campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Campaign logs retrieved / Logs de campaña obtenidos
 */
campaignRouter.get(
  '/:id/logs',
  requireAdmin,
  validate([
    param('id').isUUID().withMessage('Invalid campaign ID'),
    query('eventType').optional().isString().withMessage('Event type must be a string'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 200 })
      .withMessage('Limit must be between 1 and 200'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
  ]),
  asyncHandler(getCampaignLogs)
);

export { templateRouter, campaignRouter };
