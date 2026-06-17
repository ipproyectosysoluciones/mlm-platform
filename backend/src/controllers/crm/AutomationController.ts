/**
 * @fileoverview AutomationController — CRM automation status & execution listing
 * @description Endpoints for querying n8n workflow automation status and execution history.
 *
 * ES: Endpoints para consultar estado de automatización n8n y historial de ejecuciones.
 * EN: Endpoints for querying n8n workflow automation status and execution history.
 *
 * @module controllers/crm/AutomationController
 * @author MLM Development Team
 */

import { Response, NextFunction } from 'express';
import { WorkflowExecution } from '../../models';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Get automation status summary: total executions, pending follow-ups, last action timestamp.
 *
 * ES: Resumen de automatización: total ejecuciones, seguimientos pendientes, último timestamp.
 * EN: Automation summary: total executions, pending follow-ups, last action timestamp.
 *
 * @param req - Authenticated request / Request autenticado
 * @param res - JSON with { totalExecutions, pendingFollowUps, lastActionAt }
 */
export async function getAutomationStatus(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const [totalExecutions, pendingFollowUps, lastExecution] = await Promise.all([
    WorkflowExecution.count(),
    WorkflowExecution.count({ where: { status: 'pending' } }),
    WorkflowExecution.findOne({ order: [['createdAt', 'DESC']] }),
  ]);

  res.json({
    success: true,
    data: {
      totalExecutions,
      pendingFollowUps,
      lastActionAt: lastExecution ? lastExecution.createdAt : null,
    },
  });
}

/** Max allowed page size to prevent abuse / Máximo tamaño de página para prevenir abuso */
const MAX_PAGE_SIZE = 100;

/** Default page size / Tamaño de página por defecto */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Get paginated list of workflow executions with joined lead data.
 *
 * ES: Lista paginada de ejecuciones de workflows con datos del lead asociado.
 * EN: Paginated list of workflow executions with joined lead data.
 *
 * Query params: page (default 1), limit (default 20, max 100)
 *
 * @param req - Authenticated request with query params / Request autenticado con query params
 * @param res - JSON with { data, total, page, limit }
 */
export async function getAutomationExecutions(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(req.query.limit as string, 10) || DEFAULT_PAGE_SIZE)
  );
  const offset = (page - 1) * limit;

  const { rows, count } = await WorkflowExecution.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [{ association: 'Lead', attributes: ['contactName', 'contactPhone'] }],
  });

  res.json({
    success: true,
    data: rows,
    total: count,
    page,
    limit,
  });
}
