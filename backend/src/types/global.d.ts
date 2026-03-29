/**
 * @fileoverview Global type declarations for environment variables
 * @description Declares global constants used throughout the application
 * @module types/global
 */

/**
 * Environment variables used in the application
 * These are loaded from process.env at runtime
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DB_HOST?: string;
      DB_PORT?: string;
      DB_DIALECT?: 'mysql' | 'postgres';
      DB_NAME?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;

      // Test Database
      TEST_DB_HOST?: string;
      TEST_DB_PORT?: string;
      TEST_DB_NAME?: string;
      TEST_DB_USER?: string;
      TEST_DB_PASSWORD?: string;

      // JWT
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;

      // Server
      PORT?: string;
      NODE_ENV?: 'development' | 'test' | 'production';

      // App
      APP_URL?: string;
      FRONTEND_URL?: string;
      ALLOWED_ORIGINS?: string;

      // Redis
      REDIS_ENABLED?: 'true' | 'false';
      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_PASSWORD?: string;

      // Two-Factor Authentication
      TWO_FACTOR_SECRET_KEY?: string;

      // Brevo Email/SMS
      BREVO_SMTP_HOST?: string;
      BREVO_SMTP_PORT?: string;
      BREVO_SMTP_USER?: string;
      BREVO_SMTP_PASS?: string;
      BREVO_SENDER_EMAIL?: string;
      BREVO_SENDER_NAME?: string;
      BREVO_API_KEY?: string;
      BREVO_SMS_SENDER?: string;

      // Wallet
      WALLET_MIN_WITHDRAWAL?: string;
      WALLET_FEE_PERCENTAGE?: string;
      WALLET_CRON_TIME?: string;

      // Testing
      SKIP_COMMISSION_CALCULATION?: 'true' | 'false';

      // Sentry
      SENTRY_DSN?: string;
    }
  }
}

/**
 * Constants for testing
 */
export const TEST_CONSTANTS = {
  SKIP_COMMISSION_CALCULATION: 'true',
  NODE_ENV_TEST: 'test',
} as const;

export {};
