/**
 * @fileoverview N8nWebhookController — handler for inbound n8n actions
 * @description Handles POST /webhooks/internal/n8n-action requests from n8n workflows.
 *   Validates required fields, delegates to WorkflowService, returns appropriate HTTP codes.
 *
 * ES: Maneja solicitudes POST /webhooks/internal/n8n-action de workflows n8n.
 *   Valida campos requeridos, delega a WorkflowService, retorna códigos HTTP apropiados.
 *
 * EN: Handles POST /webhooks/internal/n8n-action requests from n8n workflows.
 *   Validates required fields, delegates to WorkflowService, returns appropriate HTTP codes.
 *
 * @module controllers/N8nWebhookController
 * @author MLM Development Team
 */

import { Request, Response, NextFunction } from 'express';
import { WorkflowService, LeadNotFoundError } from '../services/WorkflowService';
import { logger } from '../utils/logger';

/** Required body fields for the n8n-action endpoint / Campos requeridos del body */
const REQUIRED_FIELDS = [
  'leadId',
  'workflowName',
  'actionType',
  'n8nExecutionId',
  'status',
] as const;

/** Valid execution statuses / Estados de ejecución válidos */
const VALID_STATUSES = new Set(['pending', 'success', 'failed']);

/**
 * Validate the n8n-action request body and return error messages if invalid.
 * Valida el body del request n8n-action y retorna mensajes de error si es inválido.
 *
 * @param body - Raw request body / Body crudo del request
 * @returns Array of error messages (empty = valid) / Array de errores (vacío = válido)
 */
function validateN8nActionBody(body: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const missing = REQUIRED_FIELDS.filter((field) => !body[field]);
  if (missing.length > 0) {
    errors.push(`Missing required fields: ${missing.join(', ')}`);
  }

  if (body.status && !VALID_STATUSES.has(String(body.status))) {
    errors.push(
      `Invalid status: "${String(body.status)}". Must be one of: ${[...VALID_STATUSES].join(', ')}`
    );
  }

  if (
    body.payload !== undefined &&
    (typeof body.payload !== 'object' || body.payload === null || Array.isArray(body.payload))
  ) {
    errors.push('payload must be a JSON object');
  }

  return errors;
}

/**
 * Handle inbound n8n action webhook.
 * Maneja webhook de acción n8n entrante.
 *
 * @param req - Express request with n8n action body / Request Express con body de acción n8n
 * @param res - Express response / Respuesta Express
 * @param _next - Next middleware (unused — errors handled inline) / Siguiente middleware (no usado)
 *
 * @returns 201 for new execution, 200 for idempotent hit, 400 for validation, 422 for unknown lead
 */
export async function handleN8nAction(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;

    // Validate request body
    const errors = validateN8nActionBody(body);
    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: errors.join('; '),
      });
      return;
    }

    const service = new WorkflowService();
    const result = await service.processN8nAction({
      leadId: String(body.leadId),
      workflowName: String(body.workflowName),
      actionType: String(body.actionType),
      n8nExecutionId: String(body.n8nExecutionId),
      status: String(body.status),
      payload: (body.payload as Record<string, unknown>) ?? undefined,
      errorMessage: body.errorMessage ? String(body.errorMessage) : undefined,
    });

    const statusCode = result.idempotent ? 200 : 201;
    res.status(statusCode).json({
      success: true,
      executionId: result.executionId,
      leadId: result.leadId,
      idempotent: result.idempotent,
    });
  } catch (error) {
    if (error instanceof LeadNotFoundError) {
      res.status(422).json({
        success: false,
        error: error.message,
      });
      return;
    }
    logger.error('Unexpected error in n8n-action handler', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
