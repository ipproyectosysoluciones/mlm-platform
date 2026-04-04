/**
 * @fileoverview EmailCampaignController - Endpoints for email campaign & template operations
 * @description Handles template CRUD, campaign CRUD, preview, send, schedule, pause, retry, and logs.
 *              Gestiona CRUD de templates, CRUD de campañas, preview, envío, programación, pausa, reintento y logs.
 * @module controllers/EmailCampaignController
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Create a template
 * POST /api/v1/email-templates { name, subjectLine, htmlContent }
 *
 * // ES: Crear un template
 * POST /api/v1/email-templates { name, subjectLine, htmlContent }
 */
import { Response } from 'express';
import { emailCampaignService } from '../services/EmailCampaignService';
import { EmailCampaignLog } from '../models';
import type { ApiResponse } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

// ============================================
// TEMPLATE ENDPOINTS — Endpoints de Templates
// ============================================

/**
 * Create a new email template
 * Crear un nuevo template de email
 *
 * @param req - Body: name, subjectLine, htmlContent, wysiwygState (optional)
 * @param res - Response with created template
 */
export async function createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { name, subjectLine, htmlContent, wysiwygState } = req.body;

  try {
    const template = await emailCampaignService.createTemplate(
      userId,
      name,
      subjectLine,
      htmlContent,
      wysiwygState
    );

    const response: ApiResponse<{
      id: string;
      name: string;
      subjectLine: string;
      variablesUsed: string[];
      createdAt: Date | undefined;
    }> = {
      success: true,
      data: {
        id: template.id,
        name: template.name,
        subjectLine: template.subjectLine,
        variablesUsed: template.variablesUsed || [],
        createdAt: template.createdAt,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isValidation = errorMessage.includes('Unknown variable');
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: isValidation ? 'TEMPLATE_VALIDATION_ERROR' : 'TEMPLATE_CREATE_ERROR',
        message: errorMessage,
      },
    };
    res.status(400).json(response);
  }
}

/**
 * List email templates with pagination
 * Listar templates de email con paginación
 *
 * @param req - Query: page, limit
 * @param res - Response with paginated templates
 */
export async function listTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  try {
    const { rows, count } = await emailCampaignService.listTemplates({ page, limit });

    const data = rows.map((t) => ({
      id: t.id,
      name: t.name,
      subjectLine: t.subjectLine,
      variablesUsed: t.variablesUsed || [],
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: { code: 'TEMPLATE_LIST_ERROR', message: errorMessage },
    };
    res.status(500).json(response);
  }
}

/**
 * Get a single email template by ID
 * Obtener un template de email por ID
 *
 * @param req - Params: id (UUID)
 * @param res - Response with template details
 */
export async function getTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const template = await emailCampaignService.getTemplate(id);

    if (!template) {
      const response: ApiResponse<never> = {
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'Email template not found' },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof template> = {
      success: true,
      data: template,
    };
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: { code: 'TEMPLATE_GET_ERROR', message: errorMessage },
    };
    res.status(500).json(response);
  }
}

/**
 * Soft delete an email template
 * Borrado suave de un template de email
 *
 * @param req - Params: id (UUID)
 * @param res - Response with success confirmation
 */
export async function deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const deleted = await emailCampaignService.deleteTemplate(id);

    if (!deleted) {
      const response: ApiResponse<never> = {
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'Email template not found' },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Template deleted successfully' },
    };
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: { code: 'TEMPLATE_DELETE_ERROR', message: errorMessage },
    };
    res.status(500).json(response);
  }
}

// ============================================
// CAMPAIGN ENDPOINTS — Endpoints de Campañas
// ============================================

/**
 * Create a new email campaign
 * Crear una nueva campaña de email
 *
 * @param req - Body: name, emailTemplateId, recipientSegment (optional), scheduledFor (optional)
 * @param res - Response with created campaign
 */
export async function createCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { name, emailTemplateId, recipientSegment, scheduledFor } = req.body;

  try {
    const campaign = await emailCampaignService.createCampaign({
      createdByUserId: userId,
      emailTemplateId,
      name,
      recipientSegment: recipientSegment || null,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    });

    const response: ApiResponse<{
      id: string;
      name: string;
      status: string;
      createdAt: Date | undefined;
    }> = {
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNotFound = errorMessage.includes('not found');
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: isNotFound ? 'TEMPLATE_NOT_FOUND' : 'CAMPAIGN_CREATE_ERROR',
        message: errorMessage,
      },
    };
    res.status(isNotFound ? 404 : 400).json(response);
  }
}

/**
 * List email campaigns with pagination and optional filters
 * Listar campañas de email con paginación y filtros opcionales
 *
 * @param req - Query: page, limit, status
 * @param res - Response with paginated campaigns
 */
export async function listCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const status = req.query.status as string | undefined;

  try {
    const filters: Parameters<typeof emailCampaignService.listCampaigns>[0] = {
      page,
      limit,
    };
    if (status) {
      filters.status = status as import('../types').EmailCampaignStatus;
    }

    const { rows, count } = await emailCampaignService.listCampaigns(filters);

    const data = rows.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      recipientCount: c.recipientCount,
      sentCount: c.sentCount,
      failedCount: c.failedCount,
      deferredCount: c.deferredCount,
      scheduledFor: c.scheduledFor,
      startedAt: c.startedAt,
      completedAt: c.completedAt,
      createdAt: c.createdAt,
    }));

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: { code: 'CAMPAIGN_LIST_ERROR', message: errorMessage },
    };
    res.status(500).json(response);
  }
}

/**
 * Get campaign details with stats
 * Obtener detalles de campaña con estadísticas
 *
 * @param req - Params: id (UUID)
 * @param res - Response with campaign + stats
 */
export async function getCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const campaign = await emailCampaignService.getCampaign(id);

    if (!campaign) {
      const response: ApiResponse<never> = {
        success: false,
        error: { code: 'CAMPAIGN_NOT_FOUND', message: 'Email campaign not found' },
      };
      res.status(404).json(response);
      return;
    }

    const total = campaign.recipientCount || 1;
    const response: ApiResponse<{
      id: string;
      name: string;
      status: string;
      recipientCount: number;
      stats: {
        sentCount: number;
        failedCount: number;
        deferredCount: number;
        bounceCount: number;
        openCount: number;
        clickCount: number;
        deliveryRate: string;
        openRate: string;
        clickRate: string;
      };
      scheduledFor: Date | null;
      startedAt: Date | null;
      completedAt: Date | null;
      createdAt: Date | undefined;
    }> = {
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        recipientCount: campaign.recipientCount,
        stats: {
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount,
          deferredCount: campaign.deferredCount,
          bounceCount: campaign.bounceCount,
          openCount: campaign.openCount,
          clickCount: campaign.clickCount,
          deliveryRate: `${((campaign.sentCount / total) * 100).toFixed(1)}%`,
          openRate:
            campaign.sentCount > 0
              ? `${((campaign.openCount / campaign.sentCount) * 100).toFixed(1)}%`
              : '0.0%',
          clickRate:
            campaign.sentCount > 0
              ? `${((campaign.clickCount / campaign.sentCount) * 100).toFixed(1)}%`
              : '0.0%',
        },
        scheduledFor: campaign.scheduledFor,
        startedAt: campaign.startedAt,
        completedAt: campaign.completedAt,
        createdAt: campaign.createdAt,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: { code: 'CAMPAIGN_GET_ERROR', message: errorMessage },
    };
    res.status(500).json(response);
  }
}

/**
 * Preview rendered email for a specific user
 * Previsualizar email renderizado para un usuario específico
 *
 * @param req - Params: id (campaign UUID), Query: userId (UUID)
 * @param res - Response with rendered subject + HTML
 */
export async function previewCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.query.userId as string;

  try {
    const campaign = await emailCampaignService.getCampaign(id);
    if (!campaign) {
      const response: ApiResponse<never> = {
        success: false,
        error: { code: 'CAMPAIGN_NOT_FOUND', message: 'Email campaign not found' },
      };
      res.status(404).json(response);
      return;
    }

    // Access template through eager-loaded association
    const template = (campaign as any).emailTemplate;
    if (!template) {
      const response: ApiResponse<never> = {
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'Campaign template not found' },
      };
      res.status(404).json(response);
      return;
    }

    // Build variables for preview (simplified: uses userId as placeholder data)
    const variables: Record<string, string> = {
      firstName: 'Preview User',
      lastName: '',
      email: 'preview@example.com',
      referralCode: 'PREVIEW',
      discountCode: 'SAMPLE',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    const renderedHtml = await emailCampaignService.renderTemplate(template.htmlContent, variables);
    const renderedSubject = await emailCampaignService.renderTemplate(
      template.subjectLine,
      variables
    );

    const response: ApiResponse<{
      subjectLine: string;
      htmlContent: string;
      previewFor: { userId: string };
    }> = {
      success: true,
      data: {
        subjectLine: renderedSubject,
        htmlContent: renderedHtml,
        previewFor: { userId },
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: { code: 'CAMPAIGN_PREVIEW_ERROR', message: errorMessage },
    };
    res.status(500).json(response);
  }
}

/**
 * Send a campaign immediately
 * Enviar una campaña inmediatamente
 *
 * @param req - Params: id (UUID)
 * @param res - Response with status update
 */
export async function sendCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    await emailCampaignService.sendCampaign(id);

    const campaign = await emailCampaignService.getCampaign(id);

    const response: ApiResponse<{
      id: string;
      status: string;
      recipientCount: number;
      message: string;
    }> = {
      success: true,
      data: {
        id,
        status: campaign?.status || 'sending',
        recipientCount: campaign?.recipientCount || 0,
        message: `Campaign queued for delivery`,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = (error as Error & { statusCode?: number }).statusCode || 400;
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: errorMessage.includes('already sending')
          ? 'CAMPAIGN_CONFLICT'
          : 'CAMPAIGN_SEND_ERROR',
        message: errorMessage,
      },
    };
    res.status(statusCode).json(response);
  }
}

/**
 * Schedule a campaign for future delivery
 * Programar una campaña para envío futuro
 *
 * @param req - Params: id (UUID), Body: scheduledFor (ISO date string)
 * @param res - Response with status update
 */
export async function scheduleCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { scheduledFor } = req.body;

  try {
    await emailCampaignService.scheduleCampaign(id, new Date(scheduledFor));

    const response: ApiResponse<{
      id: string;
      status: string;
      scheduledFor: string;
      message: string;
    }> = {
      success: true,
      data: {
        id,
        status: 'scheduled',
        scheduledFor,
        message: `Campaign scheduled for ${scheduledFor}`,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNotFound = errorMessage.includes('not found');
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: isNotFound ? 'CAMPAIGN_NOT_FOUND' : 'CAMPAIGN_SCHEDULE_ERROR',
        message: errorMessage,
      },
    };
    res.status(isNotFound ? 404 : 400).json(response);
  }
}

/**
 * Pause a sending campaign
 * Pausar una campaña en envío
 *
 * @param req - Params: id (UUID)
 * @param res - Response with status update
 */
export async function pauseCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    await emailCampaignService.pauseCampaign(id);

    const response: ApiResponse<{ id: string; status: string; message: string }> = {
      success: true,
      data: { id, status: 'paused', message: 'Campaign paused' },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNotFound = errorMessage.includes('not found');
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: isNotFound ? 'CAMPAIGN_NOT_FOUND' : 'CAMPAIGN_PAUSE_ERROR',
        message: errorMessage,
      },
    };
    res.status(isNotFound ? 404 : 400).json(response);
  }
}

/**
 * Retry failed emails for a campaign
 * Reintentar emails fallidos de una campaña
 *
 * @param req - Params: id (UUID)
 * @param res - Response with retry count
 */
export async function retryFailedEmails(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const retriedCount = await emailCampaignService.retryFailedEmails(id);

    const response: ApiResponse<{ retriedCount: number; message: string }> = {
      success: true,
      data: {
        retriedCount,
        message: `${retriedCount} failed emails queued for retry`,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNotFound = errorMessage.includes('not found');
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: isNotFound ? 'CAMPAIGN_NOT_FOUND' : 'CAMPAIGN_RETRY_ERROR',
        message: errorMessage,
      },
    };
    res.status(isNotFound ? 404 : 500).json(response);
  }
}

/**
 * Get campaign delivery logs with optional filters
 * Obtener logs de entrega de campaña con filtros opcionales
 *
 * @param req - Params: id (UUID), Query: status, limit, offset
 * @param res - Response with paginated logs
 */
export async function getCampaignLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const offset = parseInt(req.query.offset as string, 10) || 0;
  const eventType = req.query.eventType as string | undefined;

  try {
    const where: Record<string, unknown> = { campaignId: id };
    if (eventType) where.eventType = eventType;

    const { rows, count } = await EmailCampaignLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['event_timestamp', 'DESC']],
    });

    const response: ApiResponse<typeof rows> = {
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: { code: 'CAMPAIGN_LOGS_ERROR', message: errorMessage },
    };
    res.status(500).json(response);
  }
}
