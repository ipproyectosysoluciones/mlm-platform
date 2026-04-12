import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Centralized Pino logger singleton for the entire backend.
 * Logger centralizado Pino (singleton) para todo el backend.
 *
 * - Production: JSON structured logs (Grafana / Loki / CloudWatch ready)
 * - Development: pino-pretty colorized output
 * - Test: silent (level 'silent') to avoid noise in test output
 *
 * @example
 * ```ts
 * import { logger } from '../utils/logger';
 *
 * logger.info({ userId: 123 }, 'User logged in');
 * logger.error({ err }, 'Payment failed');
 * logger.warn('Deprecated endpoint called');
 * logger.debug({ payload }, 'Processing webhook');
 * ```
 */
const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  ...(isProduction || isTest ? {} : { transport: { target: 'pino-pretty' } }),
});

export { logger };
export default logger;
