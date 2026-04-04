/**
 * @fileoverview EmailCampaignService - Business logic for email campaign operations
 * @description Handles template validation, variable rendering, campaign CRUD, send/schedule/pause/retry flows.
 *              Uses SELECT FOR UPDATE locking for safe concurrent campaign sends and batch INSERT for performance.
 *              Gestiona validación de templates, renderizado de variables, CRUD de campañas, flujos de envío/programación/pausa/reintento.
 *              Usa bloqueo SELECT FOR UPDATE para envíos concurrentes seguros y INSERT por lotes para rendimiento.
 * @module services/EmailCampaignService
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Validate a template with variables
 * const result = await emailCampaignService.validateTemplate('<p>Hi {{firstName}}</p>', 'Hello {{firstName}}');
 *
 * // ES: Validar un template con variables
 * const result = await emailCampaignService.validateTemplate('<p>Hola {{firstName}}</p>', 'Hola {{firstName}}');
 *
 * @example
 * // EN: Send a campaign
 * await emailCampaignService.sendCampaign('campaign-uuid');
 *
 * // ES: Enviar una campaña
 * await emailCampaignService.sendCampaign('campaign-uuid');
 */

import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import {
  EmailTemplate,
  EmailCampaign,
  CampaignRecipient,
  EmailQueue,
  EmailCampaignLog,
  User,
} from '../models';
import { ALLOWED_TEMPLATE_VARIABLES, EMAIL_CAMPAIGN_STATUS, EMAIL_QUEUE_STATUS } from '../types';
import type { TemplateValidationResult, CreateCampaignDto, EmailCampaignStatus } from '../types';

// ============================================
// HTML Escape Utility — Utilidad de escape HTML
// ============================================

/**
 * Escape HTML special characters to prevent XSS injection
 * Escapar caracteres especiales HTML para prevenir inyección XSS
 *
 * @param str - Raw string to escape / String raw a escapar
 * @returns Escaped string / String escapado
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Regex to match template variables: {{variableName}}
 * Regex para encontrar variables de template: {{variableName}}
 */
const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

export class EmailCampaignService {
  // ============================================
  // TEMPLATE VALIDATION — Task 22-2
  // VALIDACIÓN DE TEMPLATE — Tarea 22-2
  // ============================================

  /**
   * Validate template HTML and subject line for allowed variables
   * Validar HTML y asunto del template por variables permitidas
   *
   * @param htmlContent - Template HTML content / Contenido HTML del template
   * @param subjectLine - Email subject line / Asunto del email
   * @returns Validation result with found variables / Resultado de validación con variables encontradas
   */
  async validateTemplate(
    htmlContent: string,
    subjectLine: string
  ): Promise<TemplateValidationResult> {
    const found = new Set<string>();
    const contentToCheck = `${subjectLine} ${htmlContent}`;
    let match: RegExpExecArray | null;

    // Reset regex lastIndex
    const regex = new RegExp(VARIABLE_REGEX.source, 'g');

    while ((match = regex.exec(contentToCheck)) !== null) {
      const varName = match[1];
      if (!(ALLOWED_TEMPLATE_VARIABLES as readonly string[]).includes(varName)) {
        return {
          valid: false,
          error: `Unknown variable: {{${varName}}}`,
          allowed: ALLOWED_TEMPLATE_VARIABLES,
        };
      }
      found.add(varName);
    }

    return { valid: true, variablesUsed: Array.from(found) };
  }

  // ============================================
  // TEMPLATE RENDERING — Task 22-2
  // RENDERIZADO DE TEMPLATE — Tarea 22-2
  // ============================================

  /**
   * Render template with variable substitution and HTML escaping
   * Renderizar template con sustitución de variables y escape HTML
   *
   * @param htmlContent - Template HTML with {{variables}} / HTML del template con {{variables}}
   * @param variables - Key-value pairs for replacement / Pares clave-valor para reemplazo
   * @returns Rendered HTML with variables replaced / HTML renderizado con variables reemplazadas
   */
  async renderTemplate(htmlContent: string, variables: Record<string, string>): Promise<string> {
    let rendered = htmlContent;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      if (rendered.includes(placeholder)) {
        // HTML-escape values to prevent injection
        const escaped = escapeHtml(String(value));
        rendered = rendered.split(placeholder).join(escaped);
      }
    }

    return rendered;
  }

  // ============================================
  // TEMPLATE CRUD — Task 22-2
  // CRUD DE TEMPLATES — Tarea 22-2
  // ============================================

  /**
   * Create a new email template with validation
   * Crear un nuevo template de email con validación
   *
   * @param userId - Creator user ID / ID del usuario creador
   * @param name - Template name / Nombre del template
   * @param subjectLine - Email subject line / Asunto del email
   * @param htmlContent - Template HTML / HTML del template
   * @param wysiwygState - Optional WYSIWYG builder state / Estado opcional del builder WYSIWYG
   * @returns Created template / Template creado
   */
  async createTemplate(
    userId: string,
    name: string,
    subjectLine: string,
    htmlContent: string,
    wysiwygState?: Record<string, unknown>
  ): Promise<EmailTemplate> {
    // Validate template variables
    const validation = await this.validateTemplate(htmlContent, subjectLine);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid template');
    }

    return EmailTemplate.create({
      createdByUserId: userId,
      name,
      subjectLine,
      htmlContent,
      wysiwygState: wysiwygState || {},
      variablesUsed: validation.variablesUsed || [],
    });
  }

  /**
   * Get a template by ID (excludes soft-deleted)
   * Obtener un template por ID (excluye borrados suavemente)
   *
   * @param templateId - Template UUID / UUID del template
   * @returns Template or null / Template o null
   */
  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    return EmailTemplate.findOne({
      where: { id: templateId, deletedAt: null },
      include: [{ model: User, as: 'createdByUser', attributes: ['id', 'email'] }],
    });
  }

  /**
   * List templates with optional filters (excludes soft-deleted)
   * Listar templates con filtros opcionales (excluye borrados suavemente)
   *
   * @param filters - Optional filters / Filtros opcionales
   * @returns Paginated templates / Templates paginados
   */
  async listTemplates(filters?: {
    page?: number;
    limit?: number;
    createdByUserId?: string;
  }): Promise<{ rows: EmailTemplate[]; count: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (filters?.createdByUserId) where.createdByUserId = filters.createdByUserId;

    return EmailTemplate.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'createdByUser', attributes: ['id', 'email'] }],
    });
  }

  /**
   * Soft delete a template
   * Borrado suave de un template
   *
   * @param templateId - Template UUID / UUID del template
   * @returns True if deleted, false if not found / True si se borró, false si no se encontró
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    const [affectedCount] = await EmailTemplate.update(
      { deletedAt: new Date() },
      { where: { id: templateId, deletedAt: null } }
    );
    return affectedCount > 0;
  }

  // ============================================
  // CAMPAIGN CRUD — Task 22-2
  // CRUD DE CAMPAÑAS — Tarea 22-2
  // ============================================

  /**
   * Create a new email campaign in draft status
   * Crear una nueva campaña de email en estado borrador
   *
   * @param params - Campaign creation params / Parámetros de creación de campaña
   * @returns Created campaign / Campaña creada
   */
  async createCampaign(params: CreateCampaignDto): Promise<EmailCampaign> {
    // Validate template exists
    const template = await this.getTemplate(params.emailTemplateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return EmailCampaign.create({
      createdByUserId: params.createdByUserId,
      emailTemplateId: params.emailTemplateId,
      name: params.name,
      status: EMAIL_CAMPAIGN_STATUS.DRAFT,
      recipientSegment: params.recipientSegment || null,
      scheduledFor: params.scheduledFor || null,
    });
  }

  /**
   * Get a campaign by ID with template info
   * Obtener una campaña por ID con info del template
   *
   * @param campaignId - Campaign UUID / UUID de la campaña
   * @returns Campaign or null / Campaña o null
   */
  async getCampaign(campaignId: string): Promise<EmailCampaign | null> {
    return EmailCampaign.findByPk(campaignId, {
      include: [
        { model: User, as: 'createdByUser', attributes: ['id', 'email'] },
        { model: EmailTemplate, as: 'emailTemplate' },
      ],
    });
  }

  /**
   * List campaigns with optional filters
   * Listar campañas con filtros opcionales
   *
   * @param filters - Optional filters / Filtros opcionales
   * @returns Paginated campaigns / Campañas paginadas
   */
  async listCampaigns(filters?: {
    page?: number;
    limit?: number;
    status?: EmailCampaignStatus;
    createdByUserId?: string;
  }): Promise<{ rows: EmailCampaign[]; count: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.createdByUserId) where.createdByUserId = filters.createdByUserId;

    return EmailCampaign.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'createdByUser', attributes: ['id', 'email'] },
        { model: EmailTemplate, as: 'emailTemplate', attributes: ['id', 'name', 'subjectLine'] },
      ],
    });
  }

  // ============================================
  // CAMPAIGN SEND & SCHEDULING — Task 22-3
  // ENVÍO Y PROGRAMACIÓN DE CAMPAÑAS — Tarea 22-3
  // ============================================

  /**
   * Send a campaign: lock with SELECT FOR UPDATE, validate status, batch-insert queue items
   * Enviar una campaña: bloquear con SELECT FOR UPDATE, validar estado, insert por lotes en cola
   *
   * @param campaignId - Campaign UUID / UUID de la campaña
   * @throws Error if campaign is already sending (409) or invalid state (400)
   */
  async sendCampaign(campaignId: string): Promise<void> {
    await sequelize.transaction(async (t) => {
      // CRITICAL: Pessimistic lock — SELECT ... FOR UPDATE to prevent concurrent sends
      const campaign = await EmailCampaign.findByPk(campaignId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status === EMAIL_CAMPAIGN_STATUS.SENDING) {
        const error = new Error('Campaign is already sending');
        (error as Error & { statusCode: number }).statusCode = 409;
        throw error;
      }

      const validStartStatuses: EmailCampaignStatus[] = [
        EMAIL_CAMPAIGN_STATUS.DRAFT,
        EMAIL_CAMPAIGN_STATUS.SCHEDULED,
      ];
      if (!validStartStatuses.includes(campaign.status)) {
        const error = new Error(
          `Cannot send campaign in '${campaign.status}' status. Must be 'draft' or 'scheduled'.`
        );
        (error as Error & { statusCode: number }).statusCode = 400;
        throw error;
      }

      // Get the template for rendering
      const template = await EmailTemplate.findByPk(campaign.emailTemplateId, {
        transaction: t,
      });
      if (!template) {
        throw new Error('Campaign template not found');
      }

      // Get recipients by segment (simplified: all active users for now)
      const recipients = await this.getRecipientsBySegment(campaign.recipientSegment, t);

      // Batch create campaign_recipients
      const recipientRecords = await CampaignRecipient.bulkCreate(
        recipients.map((r) => ({
          campaignId: campaign.id,
          userId: r.id,
          emailAddress: r.email,
          status: 'pending' as const,
        })),
        { transaction: t }
      );

      // Batch create email_queue items with rendered content
      const queueItems = [];
      for (let i = 0; i < recipientRecords.length; i++) {
        const recipient = recipients[i];
        const recipientRecord = recipientRecords[i];

        const renderedHtml = await this.renderTemplate(template.htmlContent, {
          firstName: recipient.email.split('@')[0], // Simplified — real impl uses user profile
          lastName: '',
          email: recipient.email,
          referralCode: recipient.referralCode || '',
          discountCode: '',
          expiresAt: '',
        });

        const renderedSubject = await this.renderTemplate(template.subjectLine, {
          firstName: recipient.email.split('@')[0],
          lastName: '',
          email: recipient.email,
          referralCode: recipient.referralCode || '',
          discountCode: '',
          expiresAt: '',
        });

        queueItems.push({
          campaignId: campaign.id,
          campaignRecipientId: recipientRecord.id,
          userId: recipient.id,
          emailAddress: recipient.email,
          subjectLine: renderedSubject,
          htmlContent: renderedHtml,
          status: 'pending' as const,
        });
      }

      if (queueItems.length > 0) {
        await EmailQueue.bulkCreate(queueItems, { transaction: t });
      }

      // Update campaign status to sending
      await campaign.update(
        {
          status: EMAIL_CAMPAIGN_STATUS.SENDING,
          startedAt: new Date(),
          recipientCount: recipientRecords.length,
        },
        { transaction: t }
      );

      // Log the send event
      await EmailCampaignLog.create(
        {
          campaignId: campaign.id,
          eventType: 'sending_started',
          eventTimestamp: new Date(),
          details: { recipientCount: recipientRecords.length },
        },
        { transaction: t }
      );
    });
  }

  /**
   * Schedule a campaign for future delivery
   * Programar una campaña para envío futuro
   *
   * @param campaignId - Campaign UUID / UUID de la campaña
   * @param scheduledFor - When to send / Cuándo enviar
   */
  async scheduleCampaign(campaignId: string, scheduledFor: Date): Promise<void> {
    if (scheduledFor <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== EMAIL_CAMPAIGN_STATUS.DRAFT) {
      throw new Error(`Cannot schedule campaign in '${campaign.status}' status. Must be 'draft'.`);
    }

    await campaign.update({
      status: EMAIL_CAMPAIGN_STATUS.SCHEDULED,
      scheduledFor,
    });

    await EmailCampaignLog.create({
      campaignId: campaign.id,
      eventType: 'scheduled',
      eventTimestamp: new Date(),
      details: { scheduledFor: scheduledFor.toISOString() },
    });
  }

  /**
   * Pause a sending campaign (stops new emails from being processed)
   * Pausar una campaña en envío (detiene el procesamiento de nuevos emails)
   *
   * @param campaignId - Campaign UUID / UUID de la campaña
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== EMAIL_CAMPAIGN_STATUS.SENDING) {
      throw new Error(`Cannot pause campaign in '${campaign.status}' status. Must be 'sending'.`);
    }

    await campaign.update({
      status: EMAIL_CAMPAIGN_STATUS.PAUSED,
    });

    await EmailCampaignLog.create({
      campaignId: campaign.id,
      eventType: 'paused',
      eventTimestamp: new Date(),
      details: {},
    });
  }

  /**
   * Retry failed emails for a campaign — reset and re-queue
   * Reintentar emails fallidos de una campaña — resetear y re-encolar
   *
   * @param campaignId - Campaign UUID / UUID de la campaña
   * @returns Number of emails re-queued / Número de emails re-encolados
   */
  async retryFailedEmails(campaignId: string): Promise<number> {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Find failed queue items
    const [affectedCount] = await EmailQueue.update(
      {
        status: EMAIL_QUEUE_STATUS.PENDING,
        retryCount: 0,
        nextRetryAt: null,
        lastError: null,
      },
      {
        where: {
          campaignId,
          status: EMAIL_QUEUE_STATUS.FAILED,
        },
      }
    );

    if (affectedCount > 0) {
      // Log the retry event
      await EmailCampaignLog.create({
        campaignId,
        eventType: 'retry_failed',
        eventTimestamp: new Date(),
        details: { retriedCount: affectedCount },
      });

      // If campaign was completed or paused, set back to sending
      if (
        campaign.status === EMAIL_CAMPAIGN_STATUS.COMPLETED ||
        campaign.status === EMAIL_CAMPAIGN_STATUS.PAUSED
      ) {
        await campaign.update({ status: EMAIL_CAMPAIGN_STATUS.SENDING });
      }
    }

    return affectedCount;
  }

  // ============================================
  // INTERNAL HELPERS — HELPERS INTERNOS
  // ============================================

  /**
   * Get recipients by segment filter (simplified: returns active users)
   * Obtener destinatarios por filtro de segmento (simplificado: retorna usuarios activos)
   *
   * @param segment - Segment filter / Filtro de segmento
   * @param transaction - Optional Sequelize transaction / Transacción Sequelize opcional
   * @returns Array of users matching segment / Array de usuarios que coinciden con el segmento
   */
  private async getRecipientsBySegment(
    segment: Record<string, unknown> | null,
    transaction?: import('sequelize').Transaction
  ): Promise<User[]> {
    // Simplified implementation: all active users
    // In production, this would parse segment filters
    const where: Record<string, unknown> = { status: 'active' };

    return User.findAll({
      where,
      attributes: ['id', 'email', 'referralCode'],
      ...(transaction ? { transaction } : {}),
    });
  }
}

// Export singleton instance
export const emailCampaignService = new EmailCampaignService();
