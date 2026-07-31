/** Domain types for email campaigns / Tipos de dominio para campañas de email. @module types/email */

// Email Campaign Types

/**
 * Campaign status values / Valores de estado de campaña
 */
export type EmailCampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'completed'
  | 'paused'
  | 'failed';

/**
 * Recipient log status values / Valores de estado de log de destinatario
 */
export type RecipientLogStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'deferred';

/**
 * Recipient segment values / Valores de segmento de destinatarios
 */
export type RecipientSegment = 'all_users' | 'high_value' | 'new_users' | 'inactive';

/**
 * Email template response / Respuesta de plantilla de email
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subjectLine: string;
  htmlContent: string;
  wysiwygState?: Record<string, unknown>;
  variablesUsed: string[];
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create email template payload / Payload para crear plantilla de email
 */
export interface EmailTemplateCreatePayload {
  name: string;
  subjectLine: string;
  htmlContent: string;
  wysiwygState?: Record<string, unknown>;
}

/**
 * Email campaign response / Respuesta de campaña de email
 */
export interface EmailCampaign {
  id: string;
  name: string;
  emailTemplateId: string;
  status: EmailCampaignStatus;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  recipientSegment: RecipientSegment;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  deferredCount: number;
  bounceCount: number;
  openCount: number;
  clickCount: number;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Campaign stats from API / Estadísticas de campaña desde la API
 */
export interface EmailCampaignStats {
  sentCount: number;
  failedCount: number;
  deferredCount: number;
  bounceCount: number;
  openCount: number;
  clickCount: number;
  deliveryRate: string;
  openRate: string;
  clickRate: string;
}

/**
 * Full campaign detail with stats / Detalle completo de campaña con estadísticas
 */
export interface EmailCampaignDetail extends EmailCampaign {
  stats: EmailCampaignStats;
}

/**
 * Create campaign payload / Payload para crear campaña
 */
export interface EmailCampaignCreatePayload {
  name: string;
  emailTemplateId: string;
  recipientSegment: RecipientSegment;
  scheduledFor?: string | null;
}

/**
 * Send campaign payload / Payload para enviar campaña
 */
export interface EmailCampaignSendPayload {
  sendNow: boolean;
}

/**
 * Campaign log entry / Entrada de log de campaña
 */
export interface CampaignLogEntry {
  recipientEmail: string;
  status: RecipientLogStatus;
  sentAt: string | null;
  errorReason: string | null;
  retryCount: number;
  nextRetryAt?: string | null;
}

/**
 * Campaign logs response with pagination / Respuesta de logs de campaña con paginación
 */
export interface CampaignLogsResponse {
  data: CampaignLogEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Campaign logs query params / Parámetros de consulta de logs de campaña
 */
export interface CampaignLogsParams {
  status?: RecipientLogStatus;
  limit?: number;
  offset?: number;
}

/**
 * Template variable validation result / Resultado de validación de variables de plantilla
 */
export interface TemplateValidationResult {
  valid: boolean;
  variablesUsed?: string[];
  error?: string;
  allowed?: string[];
}

/**
 * Retry failed response / Respuesta de reintentar fallidos
 */
export interface RetryFailedResponse {
  retriedCount: number;
  message: string;
}

/**
 * Allowed template variables / Variables de plantilla permitidas
 */
export const ALLOWED_TEMPLATE_VARIABLES = [
  'firstName',
  'lastName',
  'email',
  'referralCode',
  'discountCode',
  'expiresAt',
] as const;

export type TemplateVariable = (typeof ALLOWED_TEMPLATE_VARIABLES)[number];
