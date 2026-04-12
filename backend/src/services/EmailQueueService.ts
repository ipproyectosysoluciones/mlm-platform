/**
 * @fileoverview EmailQueueService - Email queue processor with exponential backoff retry
 * @description Processes pending/deferred emails from the queue via BrevoEmailService,
 *              implements exponential backoff (2^(retryCount-1) seconds), max 5 retries,
 *              updates campaign stats, and logs all send attempts.
 *              Procesa emails pendientes/diferidos de la cola via BrevoEmailService,
 *              implementa backoff exponencial (2^(retryCount-1) segundos), máximo 5 reintentos,
 *              actualiza estadísticas de campaña y registra todos los intentos de envío.
 * @module services/EmailQueueService
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Process pending emails from the queue
 * await emailQueueService.processPendingEmails();
 *
 * // ES: Procesar emails pendientes de la cola
 * await emailQueueService.processPendingEmails();
 */

import { Op } from 'sequelize';
import { EmailQueue, EmailCampaign, EmailCampaignLog } from '../models';
import { brevoEmailService } from './BrevoEmailService';
import { EMAIL_QUEUE_STATUS, EMAIL_CAMPAIGN_STATUS } from '../types';
import { logger } from '../utils/logger';

// ============================================
// CONSTANTS — Constantes
// ============================================

/**
 * Maximum retry attempts before marking as permanently failed
 * Máximo de reintentos antes de marcar como fallido permanentemente
 */
const MAX_RETRIES = 5;

/**
 * Maximum emails to process per batch
 * Máximo de emails a procesar por lote
 */
const BATCH_LIMIT = 100;

// ============================================
// SERVICE — Servicio
// ============================================

export class EmailQueueService {
  // ============================================
  // PUBLIC API — API Pública
  // ============================================

  /**
   * Process pending and deferred emails from the queue
   * Procesar emails pendientes y diferidos de la cola
   *
   * Query: status IN ('pending', 'deferred') AND (next_retry_at IS NULL OR next_retry_at <= NOW())
   * For each email:
   *   - Success: status='sent', brevo_message_id, processed_at=NOW()
   *   - Failure (retryable, retryCount < MAX):
   *       retryCount++, backoff = 2^(retryCount-1)s, next_retry_at = NOW() + backoff, status='deferred'
   *   - Failure (max retries): status='failed', log final error
   *
   * @returns Processing stats / Estadísticas de procesamiento
   */
  async processPendingEmails(): Promise<{
    processed: number;
    sent: number;
    deferred: number;
    failed: number;
  }> {
    const stats = { processed: 0, sent: 0, deferred: 0, failed: 0 };

    // Fetch batch of pending/deferred emails ready for processing
    const pendingEmails = await EmailQueue.findAll({
      where: {
        status: {
          [Op.in]: [EMAIL_QUEUE_STATUS.PENDING, EMAIL_QUEUE_STATUS.DEFERRED],
        },
        [Op.or]: [
          { nextRetryAt: { [Op.is]: null as unknown as undefined } },
          { nextRetryAt: { [Op.lte]: new Date() } },
        ],
      },
      limit: BATCH_LIMIT,
      order: [['created_at', 'ASC']],
    });

    if (pendingEmails.length === 0) {
      return stats;
    }

    // Process each email individually (graceful degradation)
    for (const emailItem of pendingEmails) {
      // Skip emails for paused campaigns (Sentry fix: prevent sending after pause)
      const campaign = await EmailCampaign.findByPk(emailItem.campaignId, {
        attributes: ['id', 'status'],
      });
      if (campaign && campaign.status === EMAIL_CAMPAIGN_STATUS.PAUSED) {
        continue;
      }

      stats.processed++;

      try {
        // Mark as processing to prevent double-processing
        await emailItem.update({ status: EMAIL_QUEUE_STATUS.PROCESSING });

        // Send via Brevo
        const result = await brevoEmailService.sendEmail({
          to: emailItem.emailAddress,
          subject: emailItem.subjectLine,
          htmlContent: emailItem.htmlContent,
        });

        // Success: mark as sent
        await emailItem.update({
          status: EMAIL_QUEUE_STATUS.SENT,
          brevoMessageId: result.messageId,
          processedAt: new Date(),
          lastError: null,
        });

        stats.sent++;

        // Update campaign sent count
        await this.incrementCampaignStat(emailItem.campaignId, 'sentCount');

        // Log success
        await this.logEvent(emailItem.campaignId, emailItem.campaignRecipientId, 'sent', {
          messageId: result.messageId,
          emailAddress: emailItem.emailAddress,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const newRetryCount = emailItem.retryCount + 1;

        if (newRetryCount >= MAX_RETRIES) {
          // Max retries reached: mark as permanently failed
          await emailItem.update({
            status: EMAIL_QUEUE_STATUS.FAILED,
            retryCount: newRetryCount,
            lastError: errorMessage,
            processedAt: new Date(),
          });

          stats.failed++;

          // Update campaign failed count
          await this.incrementCampaignStat(emailItem.campaignId, 'failedCount');

          // Log permanent failure
          await this.logEvent(emailItem.campaignId, emailItem.campaignRecipientId, 'failed', {
            error: errorMessage,
            retryCount: newRetryCount,
            emailAddress: emailItem.emailAddress,
            permanent: true,
          });
        } else {
          // Retryable: exponential backoff 2^(retryCount-1) seconds
          const backoffSeconds = Math.pow(2, newRetryCount - 1);
          const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

          await emailItem.update({
            status: EMAIL_QUEUE_STATUS.DEFERRED,
            retryCount: newRetryCount,
            nextRetryAt,
            lastError: errorMessage,
          });

          stats.deferred++;

          // Log deferred
          await this.logEvent(emailItem.campaignId, emailItem.campaignRecipientId, 'deferred', {
            error: errorMessage,
            retryCount: newRetryCount,
            nextRetryAt: nextRetryAt.toISOString(),
            backoffSeconds,
            emailAddress: emailItem.emailAddress,
          });
        }
      }
    }

    // After processing batch, update deferred counts for affected campaigns
    await this.updateDeferredCounts(pendingEmails);

    // Check if any campaigns are now complete (all emails sent or failed)
    await this.checkCampaignCompletion(pendingEmails);

    return stats;
  }

  // ============================================
  // PRIVATE HELPERS — Helpers Privados
  // ============================================

  /**
   * Increment a numeric stat field on a campaign
   * Incrementar un campo numérico de estadísticas en una campaña
   *
   * @param campaignId - Campaign UUID / UUID de la campaña
   * @param field - Field to increment / Campo a incrementar
   */
  private async incrementCampaignStat(
    campaignId: string,
    field: 'sentCount' | 'failedCount'
  ): Promise<void> {
    try {
      await EmailCampaign.increment(field, { where: { id: campaignId } });
    } catch (error) {
      logger.error(
        { err: error, service: 'EmailQueueService', campaignId, field },
        'Error incrementing campaign stat'
      );
    }
  }

  /**
   * Update deferred counts for all affected campaigns after a batch
   * Actualizar conteos diferidos para campañas afectadas después de un lote
   *
   * @param processedEmails - Processed email items / Items de email procesados
   */
  private async updateDeferredCounts(processedEmails: EmailQueue[]): Promise<void> {
    // Get unique campaign IDs from processed batch
    const campaignIds = [...new Set(processedEmails.map((e) => e.campaignId))];

    for (const campaignId of campaignIds) {
      try {
        const deferredCount = await EmailQueue.count({
          where: {
            campaignId,
            status: EMAIL_QUEUE_STATUS.DEFERRED,
          },
        });

        await EmailCampaign.update({ deferredCount }, { where: { id: campaignId } });
      } catch (error) {
        logger.error(
          { err: error, service: 'EmailQueueService', campaignId },
          'Error updating deferred count for campaign'
        );
      }
    }
  }

  /**
   * Check if campaigns are complete (no pending/deferred/processing emails remain)
   * Verificar si campañas están completas (no quedan emails pendientes/diferidos/procesando)
   *
   * @param processedEmails - Processed email items / Items de email procesados
   */
  private async checkCampaignCompletion(processedEmails: EmailQueue[]): Promise<void> {
    const campaignIds = [...new Set(processedEmails.map((e) => e.campaignId))];

    for (const campaignId of campaignIds) {
      try {
        const remainingCount = await EmailQueue.count({
          where: {
            campaignId,
            status: {
              [Op.in]: [
                EMAIL_QUEUE_STATUS.PENDING,
                EMAIL_QUEUE_STATUS.DEFERRED,
                EMAIL_QUEUE_STATUS.PROCESSING,
              ],
            },
          },
        });

        if (remainingCount === 0) {
          // All emails processed: mark campaign as completed
          const campaign = await EmailCampaign.findByPk(campaignId);
          if (campaign && campaign.status === EMAIL_CAMPAIGN_STATUS.SENDING) {
            await campaign.update({
              status: EMAIL_CAMPAIGN_STATUS.COMPLETED,
              completedAt: new Date(),
            });

            await this.logEvent(campaignId, null, 'campaign_completed', {
              sentCount: campaign.sentCount,
              failedCount: campaign.failedCount,
            });
          }
        }
      } catch (error) {
        logger.error(
          { err: error, service: 'EmailQueueService', campaignId },
          'Error checking completion for campaign'
        );
      }
    }
  }

  /**
   * Log an event to email_campaign_logs
   * Registrar un evento en email_campaign_logs
   *
   * @param campaignId - Campaign UUID / UUID de la campaña
   * @param campaignRecipientId - Recipient UUID (nullable) / UUID del destinatario (nullable)
   * @param eventType - Event type / Tipo de evento
   * @param details - Event details / Detalles del evento
   */
  private async logEvent(
    campaignId: string,
    campaignRecipientId: string | null,
    eventType: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      await EmailCampaignLog.create({
        campaignId,
        campaignRecipientId,
        eventType,
        eventTimestamp: new Date(),
        details,
      });
    } catch (error) {
      logger.error({ err: error, service: 'EmailQueueService', eventType }, 'Error logging event');
    }
  }
}

// Export singleton instance
export const emailQueueService = new EmailQueueService();
