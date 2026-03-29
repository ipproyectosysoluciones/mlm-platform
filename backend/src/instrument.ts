/**
 * @fileoverview Sentry Instrumentation - MUST be imported first
 * @description Initializes Sentry before any other module loads.
 *              Follows the Sentry "instrument.js" pattern for ESM.
 *
 * @module instrument
 * @see https://docs.sentry.io/platforms/node/install/esm/
 */
import * as Sentry from '@sentry/node';
import { config } from './config/env';

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.nodeEnv,
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
    sendDefaultPii: true,
  });
}

export default Sentry;
