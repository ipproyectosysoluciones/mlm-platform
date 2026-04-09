/**
 * @fileoverview Structured Logger — Bot-level logging service
 * @description Provides a structured, leveled logging wrapper for the WhatsApp bot.
 *              All log entries are emitted as JSON lines to stdout/stderr so they can
 *              be collected by Docker logging drivers, Datadog, Loki, etc.
 *
 *              Provee un wrapper de logging estructurado y por niveles para el bot de WhatsApp.
 *              Todas las entradas son emitidas como JSON lines a stdout/stderr para ser
 *              recolectadas por drivers de logging de Docker, Datadog, Loki, etc.
 *
 * @module services/logger
 *
 * @example
 * // English: Log a user action
 * logger.info('balance.requested', { phone: '5491122334455', userId: 'uuid' });
 *
 * // Español: Loguear un error de handler
 * logger.error('handoff.failed', { phone: ctx.from, error: err.message });
 *
 * // English: Alert on critical failure (also fires Slack webhook if configured)
 * await logger.alert('openai.failed', { phone: ctx.from, error: err.message });
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Log levels supported by the bot logger.
 * Niveles de log soportados por el logger del bot.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured log entry emitted as JSON.
 * Entrada de log estructurada emitida como JSON.
 */
export interface LogEntry {
  /** ISO 8601 timestamp / Timestamp ISO 8601 */
  timestamp: string;
  /** Log severity level / Nivel de severidad */
  level: LogLevel;
  /** Dot-separated event name (e.g. 'balance.requested') / Nombre de evento separado por puntos */
  event: string;
  /** Service identifier — always 'nexo-bot' / Identificador de servicio — siempre 'nexo-bot' */
  service: 'nexo-bot';
  /** Optional structured context payload / Payload de contexto estructurado opcional */
  context?: Record<string, unknown>;
}

// ── Level config ──────────────────────────────────────────────────────────────

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Minimum log level from BOT_LOG_LEVEL env var (default: info).
 * Nivel mínimo de log desde la variable de entorno BOT_LOG_LEVEL (default: info).
 */
const MIN_LEVEL: LogLevel = (process.env.BOT_LOG_LEVEL as LogLevel) ?? 'info';

// ── Core emit ─────────────────────────────────────────────────────────────────

/**
 * Emits a structured log entry to stdout (info/debug) or stderr (warn/error).
 * Emite una entrada de log estructurada a stdout (info/debug) o stderr (warn/error).
 *
 * @param level   - Log severity / Severidad del log
 * @param event   - Dot-separated event name / Nombre de evento separado por puntos
 * @param context - Optional key-value context / Contexto clave-valor opcional
 */
function emit(level: LogLevel, event: string, context?: Record<string, unknown>): void {
  // Skip if below minimum level / Omitir si está por debajo del nivel mínimo
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'nexo-bot',
    ...(context ? { context } : {}),
  };

  const line = JSON.stringify(entry);

  if (level === 'warn' || level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Structured logger for the Nexo Bot.
 * Logger estructurado para el bot de Nexo.
 *
 * @example
 * logger.info('reservations.requested', { userId: 'abc', phone: '549...' });
 * logger.error('openai.failed', { phone: ctx.from, error: err.message, attempt: 2 });
 */
export const logger = {
  /**
   * Low-priority diagnostic information (suppressed in production by default).
   * Información de diagnóstico de baja prioridad (suprimida en producción por defecto).
   */
  debug(event: string, context?: Record<string, unknown>): void {
    emit('debug', event, context);
  },

  /**
   * Normal operational events (user actions, successful lookups).
   * Eventos operacionales normales (acciones de usuario, lookups exitosos).
   */
  info(event: string, context?: Record<string, unknown>): void {
    emit('info', event, context);
  },

  /**
   * Recoverable issues that need attention but didn't break the flow.
   * Problemas recuperables que necesitan atención pero no rompieron el flujo.
   */
  warn(event: string, context?: Record<string, unknown>): void {
    emit('warn', event, context);
  },

  /**
   * Critical failures — always emitted regardless of log level.
   * Fallos críticos — siempre emitidos independientemente del nivel de log.
   *
   * @param event   - Dot-separated event name / Nombre de evento separado por puntos
   * @param context - Should include `error` key with message or stack / Debe incluir key `error` con mensaje o stack
   */
  error(event: string, context?: Record<string, unknown>): void {
    // Always emit errors, bypass level filter
    // Siempre emitir errores, ignorar filtro de nivel
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      event,
      service: 'nexo-bot',
      ...(context ? { context } : {}),
    };
    process.stderr.write(JSON.stringify(entry) + '\n');
  },

  /**
   * Critical alert — logs as error AND fires a POST to BOT_ALERT_WEBHOOK_URL (Slack-compatible).
   * If BOT_ALERT_WEBHOOK_URL is not set, behaves exactly like logger.error (fail-safe).
   *
   * Alerta crítica — loguea como error Y dispara un POST a BOT_ALERT_WEBHOOK_URL (compatible con Slack).
   * Si BOT_ALERT_WEBHOOK_URL no está configurada, funciona igual que logger.error (fail-safe).
   *
   * @param event   - Dot-separated event name / Nombre de evento separado por puntos
   * @param context - Should include `error` key with message or stack / Debe incluir key `error` con mensaje o stack
   * @returns Promise<void> — fire-and-forget; never rejects / fire-and-forget; nunca rechaza
   *
   * @example
   * await logger.alert('openai.failed', { phone: ctx.from, error: err.message });
   */
  async alert(event: string, context?: Record<string, unknown>): Promise<void> {
    // Always log as structured error first
    // Siempre loguear como error estructurado primero
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      event,
      service: 'nexo-bot',
      ...(context ? { context } : {}),
    };
    process.stderr.write(JSON.stringify(entry) + '\n');

    // Fire webhook alert if configured / Disparar webhook si está configurado
    const webhookUrl = process.env.BOT_ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;

    const errorMsg = context?.error ? String(context.error) : '(no error detail)';
    const text = `🚨 *[nexo-bot] CRITICAL: ${event}*\n\`\`\`${errorMsg}\`\`\``;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch {
      // Fire-and-forget: ignore webhook delivery failures
      // Fire-and-forget: ignorar fallos de entrega del webhook
    }
  },
};
