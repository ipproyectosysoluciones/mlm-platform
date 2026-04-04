/**
 * @fileoverview BrevoEmailService - Brevo REST API + SMTP Fallback with Circuit Breaker
 * @description Sends emails via Brevo REST API as primary channel with automatic SMTP fallback
 *              on timeout (>5s), 5xx errors, or circuit breaker activation (10 consecutive failures).
 *              Envía emails via API REST de Brevo como canal primario con fallback automático a SMTP
 *              en timeout (>5s), errores 5xx, o activación del circuit breaker (10 fallos consecutivos).
 * @module services/BrevoEmailService
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Send an email (REST first, then SMTP fallback)
 * const result = await brevoEmailService.sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Hello!',
 *   htmlContent: '<p>Welcome</p>',
 * });
 * console.log(result.messageId);
 *
 * // ES: Enviar un email (REST primero, luego fallback SMTP)
 * const result = await brevoEmailService.sendEmail({
 *   to: 'usuario@ejemplo.com',
 *   subject: '¡Hola!',
 *   htmlContent: '<p>Bienvenido</p>',
 * });
 * console.log(result.messageId);
 */

import nodemailer from 'nodemailer';
import { config } from '../config/env';

// ============================================
// TYPES — Tipos
// ============================================

/**
 * Email send parameters
 * Parámetros de envío de email
 */
export interface SendEmailParams {
  /** Recipient email address / Correo del destinatario */
  to: string;
  /** Email subject line / Asunto del email */
  subject: string;
  /** HTML content of the email / Contenido HTML del email */
  htmlContent: string;
}

/**
 * Email send result
 * Resultado de envío de email
 */
export interface SendEmailResult {
  /** Unique message ID from Brevo or SMTP / ID único del mensaje de Brevo o SMTP */
  messageId: string;
}

/**
 * Circuit breaker state for REST API monitoring
 * Estado del circuit breaker para monitoreo de API REST
 */
interface CircuitBreakerState {
  /** Consecutive failure count / Contador de fallos consecutivos */
  failures: number;
  /** Threshold before switching to SMTP permanently / Umbral antes de cambiar a SMTP permanentemente */
  threshold: number;
  /** Whether SMTP fallback is permanently active / Si el fallback SMTP está activo permanentemente */
  fallbackToSMTP: boolean;
}

// ============================================
// CONSTANTS — Constantes
// ============================================

/** Brevo REST API base URL / URL base de API REST de Brevo */
const BREVO_API_BASE = 'https://api.brevo.com/v3';

/** REST API timeout in milliseconds (5 seconds) / Timeout de API REST en milisegundos (5 segundos) */
const REST_TIMEOUT_MS = 5000;

/** Circuit breaker failure threshold / Umbral de fallos del circuit breaker */
const CIRCUIT_BREAKER_THRESHOLD = 10;

// ============================================
// SERVICE — Servicio
// ============================================

export class BrevoEmailService {
  private circuitBreaker: CircuitBreakerState;

  constructor() {
    this.circuitBreaker = {
      failures: 0,
      threshold: CIRCUIT_BREAKER_THRESHOLD,
      fallbackToSMTP: false,
    };
  }

  // ============================================
  // PUBLIC API — API Pública
  // ============================================

  /**
   * Send an email via Brevo REST API with SMTP fallback
   * Enviar un email via API REST de Brevo con fallback SMTP
   *
   * Flow / Flujo:
   * 1. If circuit breaker tripped → go directly to SMTP
   * 2. Try Brevo REST API (POST /smtp/email, timeout 5s)
   * 3. On success → reset circuit breaker, return messageId
   * 4. On timeout (>5s) or 5xx → increment circuit breaker, fallback to SMTP
   * 5. If circuit breaker >= 10 failures → switch to SMTP permanently
   *
   * @param params - Email params (to, subject, htmlContent) / Parámetros del email
   * @returns Object with messageId / Objeto con messageId
   * @throws Error if both REST and SMTP fail / Error si ambos REST y SMTP fallan
   */
  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // If circuit breaker has tripped, go directly to SMTP
    if (this.circuitBreaker.fallbackToSMTP) {
      console.log('[BrevoEmailService] Circuit breaker active — sending via SMTP');
      return this.sendViaSMTP(params);
    }

    try {
      const result = await this.sendViaREST(params);
      // Reset circuit breaker on success
      this.circuitBreaker.failures = 0;
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown REST API error';
      console.error(`[BrevoEmailService] REST API failed: ${errorMessage}`);

      // Increment circuit breaker
      this.circuitBreaker.failures++;
      console.log(
        `[BrevoEmailService] Circuit breaker: ${this.circuitBreaker.failures}/${this.circuitBreaker.threshold} failures`
      );

      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.fallbackToSMTP = true;
        console.warn('[BrevoEmailService] Circuit breaker TRIPPED — switching to SMTP permanently');
      }

      // Fallback to SMTP
      console.log('[BrevoEmailService] Falling back to SMTP');
      return this.sendViaSMTP(params);
    }
  }

  /**
   * Reset the circuit breaker (re-enable REST API)
   * Resetear el circuit breaker (re-habilitar API REST)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.fallbackToSMTP = false;
    console.log('[BrevoEmailService] Circuit breaker reset — REST API re-enabled');
  }

  /**
   * Get current circuit breaker state (for monitoring)
   * Obtener estado actual del circuit breaker (para monitoreo)
   */
  getCircuitBreakerState(): Readonly<CircuitBreakerState> {
    return { ...this.circuitBreaker };
  }

  // ============================================
  // PRIVATE: REST API — API REST Privada
  // ============================================

  /**
   * Send email via Brevo REST API with 5s timeout
   * Enviar email via API REST de Brevo con timeout de 5s
   *
   * @param params - Email send params / Parámetros de envío
   * @returns SendEmailResult with messageId
   * @throws Error on timeout, 5xx, or network failure
   */
  private async sendViaREST(params: SendEmailParams): Promise<SendEmailResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);

    try {
      const response = await fetch(`${BREVO_API_BASE}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': config.brevo.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          to: [{ email: params.to }],
          sender: {
            email: config.brevo.senderEmail,
            name: config.brevo.senderName,
          },
          subject: params.subject,
          htmlContent: params.htmlContent,
          tags: ['email-campaign'],
        }),
        signal: controller.signal,
      });

      if (response.status >= 500) {
        throw new Error(`Brevo REST API 5xx error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Brevo REST API error: ${response.status} - ${errorBody}`);
      }

      const data = (await response.json()) as { messageId?: string };
      return { messageId: data.messageId || `brevo-rest-${Date.now()}` };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Brevo REST API timeout (>5s)');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ============================================
  // PRIVATE: SMTP FALLBACK — SMTP Fallback Privado
  // ============================================

  /**
   * Send email via SMTP relay (fallback channel)
   * Enviar email via relay SMTP (canal de fallback)
   *
   * @param params - Email send params / Parámetros de envío
   * @returns SendEmailResult with messageId from SMTP
   * @throws Error if SMTP send fails
   */
  private async sendViaSMTP(params: SendEmailParams): Promise<SendEmailResult> {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: config.brevo.smtpUser,
        pass: config.brevo.smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${config.brevo.senderName}" <${config.brevo.senderEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.htmlContent,
    });

    console.log(`[BrevoEmailService] SMTP sent: ${info.messageId}`);
    return { messageId: info.messageId || `smtp-${Date.now()}` };
  }
}

// Export singleton instance
export const brevoEmailService = new BrevoEmailService();
