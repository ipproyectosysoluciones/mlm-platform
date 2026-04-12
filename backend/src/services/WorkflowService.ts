/**
 * @fileoverview WorkflowService — n8n inbound action processing + outbound triggers
 * @description Processes n8n webhook actions: persists WorkflowExecutions with idempotency,
 *   syncs lead statuses with a human-guard, validates lead existence.
 *   Also triggers n8n workflows on lead creation (fire-and-forget).
 *
 * ES: Procesa acciones webhook de n8n: persiste WorkflowExecutions con idempotencia,
 *   sincroniza estados de leads con guardia humana, valida existencia de leads.
 *   También dispara workflows de n8n al crear un lead (fire-and-forget).
 *
 * EN: Processes n8n webhook actions: persists WorkflowExecutions with idempotency,
 *   syncs lead statuses with a human-guard, validates lead existence.
 *   Also triggers n8n workflows on lead creation (fire-and-forget).
 *
 * @module services/WorkflowService
 * @author MLM Development Team
 */

import { WorkflowExecution, Lead } from '../models';
import { logger } from '../utils/logger';

/**
 * Human-guard window in milliseconds (5 minutes).
 * If a lead was updated within this window, automation status changes are skipped.
 *
 * ES: Ventana de guardia humana en ms (5 min). Si un lead fue actualizado dentro
 *   de esta ventana, se omiten los cambios de estado por automatización.
 */
const HUMAN_GUARD_MS = 5 * 60 * 1000;

/**
 * Timeout for outbound n8n trigger requests in milliseconds (3 seconds).
 * ES: Timeout para requests outbound de trigger n8n en ms (3 segundos).
 */
const TRIGGER_TIMEOUT_MS = 3000;

/**
 * Valid lead statuses that n8n can set via status_changed action.
 * ES: Estados válidos que n8n puede asignar vía acción status_changed.
 */
const VALID_LEAD_STATUSES = new Set([
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
]);

/**
 * Input DTO for processN8nAction
 * DTO de entrada para processN8nAction
 */
export interface ProcessN8nActionInput {
  leadId: string;
  workflowName: string;
  actionType: string;
  n8nExecutionId: string;
  status: string;
  payload?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Result DTO from processN8nAction
 * DTO de resultado de processN8nAction
 */
export interface ProcessN8nActionResult {
  executionId: string;
  leadId: string;
  idempotent: boolean;
}

/**
 * Error thrown when a lead referenced in a webhook does not exist.
 * ES: Error lanzado cuando un lead referenciado en un webhook no existe.
 */
export class LeadNotFoundError extends Error {
  constructor(leadId: string) {
    super(`Lead not found: ${leadId}`);
    this.name = 'LeadNotFoundError';
  }
}

/**
 * WorkflowService — processes inbound n8n actions
 * Servicio que procesa acciones entrantes de n8n
 */
export class WorkflowService {
  /**
   * Process an inbound n8n action: validate lead, persist execution with idempotency,
   * and optionally sync lead status with human-guard protection.
   *
   * ES: Procesa una acción entrante de n8n: valida lead, persiste ejecución con idempotencia,
   *   y opcionalmente sincroniza estado del lead con protección de guardia humana.
   *
   * @param input - Action data from n8n webhook / Datos de acción del webhook n8n
   * @returns Execution result with idempotency flag / Resultado con flag de idempotencia
   * @throws {LeadNotFoundError} When the referenced lead does not exist
   */
  async processN8nAction(input: ProcessN8nActionInput): Promise<ProcessN8nActionResult> {
    const { leadId, workflowName, actionType, n8nExecutionId, status, payload, errorMessage } =
      input;

    logger.info(`Processing n8n action: ${actionType} for lead ${leadId}`);

    // 1. Validate lead exists
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }

    // 2. Idempotent findOrCreate on composite key (leadId + n8nExecutionId)
    const [execution, created] = await WorkflowExecution.findOrCreate({
      where: { leadId, n8nExecutionId },
      defaults: {
        workflowName,
        actionType,
        status: status as 'pending' | 'success' | 'failed',
        payload: payload ?? {},
        errorMessage: errorMessage ?? null,
      },
    });

    if (!created) {
      logger.info(`Idempotent hit: execution ${execution.id} already exists for lead ${leadId}`);
      return {
        executionId: execution.id,
        leadId,
        idempotent: true,
      };
    }

    // 3. Status sync with human-guard (only for status_changed actions)
    if (actionType === 'status_changed' && payload?.newStatus) {
      const newStatus = String(payload.newStatus);
      if (VALID_LEAD_STATUSES.has(newStatus)) {
        const msSinceUpdate = Date.now() - new Date(lead.updatedAt).getTime();
        if (msSinceUpdate >= HUMAN_GUARD_MS) {
          lead.status = newStatus as typeof lead.status;
          lead.automationStatus = 'n8n';
          lead.lastWorkflowActionId = execution.id;
          await lead.save();
          logger.info(`Lead ${leadId} status updated to ${newStatus} by n8n`);
        } else {
          logger.warn(
            `Human-guard: skipping status update for lead ${leadId} — ` +
              `last edited ${Math.round(msSinceUpdate / 1000)}s ago (< 300s)`
          );
        }
      }
    }

    return {
      executionId: execution.id,
      leadId,
      idempotent: false,
    };
  }

  /**
   * Trigger n8n workflow when a new lead is created. Fire-and-forget: never blocks
   * the caller, never throws. Logs a WorkflowExecution record on success or failure.
   *
   * ES: Dispara workflow de n8n cuando se crea un lead nuevo. Fire-and-forget: nunca
   *   bloquea al llamador, nunca lanza. Registra WorkflowExecution en éxito o fallo.
   *
   * @param lead - The newly created lead (with toJSON method) / El lead recién creado
   */
  async triggerLeadCreated(lead: {
    id: string;
    toJSON: () => Record<string, unknown>;
  }): Promise<void> {
    const webhookUrl = process.env.N8N_LEAD_CREATED_WEBHOOK_URL;

    if (!webhookUrl) {
      logger.warn('N8N_LEAD_CREATED_WEBHOOK_URL not set, skipping lead-created trigger');
      return;
    }

    const n8nExecutionId = `trigger-${lead.id}-${Date.now()}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TRIGGER_TIMEOUT_MS);

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead.toJSON()),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          await WorkflowExecution.create({
            leadId: lead.id,
            workflowName: 'crm-lead-created',
            actionType: 'lead_trigger',
            status: 'failed',
            n8nExecutionId,
            errorMessage: `n8n returned HTTP ${response.status}`,
            payload: {},
          });
          logger.error(
            `Outbound trigger failed for lead ${lead.id}: n8n returned HTTP ${response.status}`
          );
          return;
        }

        await WorkflowExecution.create({
          leadId: lead.id,
          workflowName: 'crm-lead-created',
          actionType: 'lead_trigger',
          status: 'success',
          n8nExecutionId,
          payload: {},
        });

        logger.info(`Outbound trigger sent for lead ${lead.id}`);
      } catch (fetchError) {
        clearTimeout(timeout);
        throw fetchError;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      try {
        await WorkflowExecution.create({
          leadId: lead.id,
          workflowName: 'crm-lead-created',
          actionType: 'lead_trigger',
          status: 'failed',
          n8nExecutionId,
          errorMessage: errMsg,
          payload: {},
        });
      } catch (logError) {
        logger.error(`Failed to log WorkflowExecution for lead ${lead.id}: ${logError}`);
      }
      logger.error(`Outbound trigger failed for lead ${lead.id}: ${errMsg}`);
    }
  }
}
