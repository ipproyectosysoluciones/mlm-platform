/**
 * @fileoverview Environment configuration for MLM Backend
 * @description Configuración de variables de entorno para el backend MLM
 *             Environment variables for database, JWT, Redis, Brevo SMS/Email
 * @module config/env
 * @author MLM Development Team
 * @version 3.0.0
 *
 * @example
 * // English: Import config in your modules
 * import { config } from '../config/env.js';
 *
 * // Español: Importar config en tus módulos
 * import { config } from '../config/env.js';
 *
 * @example
 * // English: Environment variables required
 * // Required env vars: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 * // Required env vars: JWT_SECRET, JWT_EXPIRES_IN
 * // Required env vars: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
 * // Required env vars: BREVO_SMTP_*, BREVO_API_KEY
 *
 * // Español: Variables de entorno requeridas
 * // Vars requeridas: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 * // Vars requeridas: JWT_SECRET, JWT_EXPIRES_IN
 * // Vars requeridas: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
 * // Vars requeridas: BREVO_SMTP_*, BREVO_API_KEY
 */
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

/**
 * Platform domain used across all config defaults (emails, URLs, VAPID).
 * Set PLATFORM_DOMAIN env var in production to override.
 *
 * Dominio de la plataforma usado en todos los valores por defecto de config.
 * Establecer la variable PLATFORM_DOMAIN en producción para sobreescribir.
 */
const platformDomain: string = process.env.PLATFORM_DOMAIN || 'nexoreal.xyz';

/**
 * Exported for use in seed scripts and modules that cannot import config
 * due to circular dependencies or initialization order.
 *
 * Exportado para uso en scripts de seed y módulos que no pueden importar config
 * por dependencias circulares u orden de inicialización.
 */
export { platformDomain };

/**
 * Main configuration object / Objeto de configuración principal
 * @constant {Object}
 *
 * @example
 * // English: Access environment values
 * const dbHost = config.db.host;
 * const jwtSecret = config.jwt.secret;
 *
 * // Español: Acceder a valores de entorno
 * const dbHost = config.db.host;
 * const jwtSecret = config.jwt.secret;
 */
export const config = {
  /** Environment mode / Modo de entorno (development, production, test) */
  nodeEnv: process.env.NODE_ENV || 'development',
  /** Server port / Puerto del servidor */
  port: parseInt(process.env.PORT || '3000', 10),

  /**
   * Platform identity / Identidad de la plataforma
   * Single source of truth for the platform domain used in emails, URLs, and VAPID.
   * Fuente única de verdad para el dominio de la plataforma usado en emails, URLs y VAPID.
   */
  platform: {
    /** Platform domain (set via PLATFORM_DOMAIN env var) / Dominio de la plataforma */
    domain: platformDomain,
  },

  /** Database configuration / Configuración de base de datos */
  db: {
    /** Database host / Host de base de datos */
    host: process.env.DB_HOST || 'localhost',
    /** Database port / Puerto de base de datos */
    port: parseInt(process.env.DB_PORT || '5432', 10),
    /** Database name / Nombre de base de datos */
    name: process.env.DB_NAME || 'mlm_db',
    /** Database user / Usuario de base de datos */
    user: process.env.DB_USER || 'mlm',
    /** Database password / Contraseña de base de datos */
    password: process.env.DB_PASSWORD || '',
  },

  /** JWT authentication configuration / Configuración de autenticación JWT */
  jwt: {
    /** JWT secret key (required) / Clave secreta JWT (requerida) */
    secret: process.env.JWT_SECRET as string,
    /** JWT token expiration / Expiración del token JWT */
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  /** Two-Factor Authentication configuration / Configuración de autenticación de dos factores */
  twoFactor: {
    /** 2FA secret key (required) / Clave secreta 2FA (requerida) */
    secretKey: process.env.TWO_FACTOR_SECRET_KEY as string,
  },

  /** Application URLs / URLs de la aplicación */
  app: {
    /** Backend API URL / URL del API backend */
    url: process.env.APP_URL || 'http://localhost:3000',
    /** Frontend URL / URL del frontend */
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  /** CORS configuration / Configuración CORS */
  cors: {
    /** Allowed origins for CORS / Orígenes permitidos para CORS */
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
      : ['http://localhost:5173', 'http://localhost:3000'],
  },

  /** Redis cache configuration / Configuración de caché Redis */
  redis: {
    /** Redis enabled / Redis habilitado */
    enabled: process.env.REDIS_ENABLED === 'true',
    /** Redis host / Host de Redis */
    host: process.env.REDIS_HOST || 'localhost',
    /** Redis port / Puerto de Redis */
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    /** Redis password (optional) / Contraseña de Redis (opcional) */
    password: process.env.REDIS_PASSWORD || '',
  },

  /** Brevo (Sendinblue) SMTP configuration for emails / Configuración SMTP de Brevo para correos */
  brevo: {
    /** SMTP host / Host SMTP */
    smtpHost: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    /** SMTP port / Puerto SMTP */
    smtpPort: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
    /** SMTP username / Usuario SMTP */
    smtpUser: process.env.BREVO_SMTP_USER || '',
    /** SMTP password / Contraseña SMTP */
    smtpPass: process.env.BREVO_SMTP_PASS || '',
    /** Brevo API key for transactional emails / Clave API de Brevo para correos transaccionales */
    apiKey: process.env.BREVO_API_KEY || '',
    /** Sender email address / Correo del remitente */
    senderEmail: process.env.BREVO_SENDER_EMAIL || `noreply@${platformDomain}`,
    /** Sender display name / Nombre del remitente */
    senderName: process.env.BREVO_SENDER_NAME || 'Nexo Real',
    /** SMS sender ID / ID del remitente SMS */
    smsSender: process.env.BREVO_SMS_SENDER || 'MLM',
  },

  /** Wallet digital configuration / Configuración de wallet digital */
  wallet: {
    /** Minimum withdrawal amount in USD / Monto mínimo de retiro en USD */
    minWithdrawal: parseFloat(process.env.WALLET_MIN_WITHDRAWAL || '20'),
    /** Maximum withdrawal amount per request in USD / Monto máximo de retiro por solicitud en USD */
    maxWithdrawal: parseFloat(process.env.WALLET_MAX_WITHDRAWAL || '500'),
    /** Maximum daily withdrawal per user in UTC / Retiro máximo diario por usuario en UTC */
    maxWithdrawalDailyPerUser: parseFloat(
      process.env.WALLET_MAX_WITHDRAWAL_DAILY_PER_USER || '1000'
    ),
    /** Withdrawal fee percentage / Porcentaje de fee de retiro */
    feePercentage: parseFloat(process.env.WALLET_FEE_PERCENTAGE || '5'),
    /** Payout mode: 'manual' (flip approved→paid) or 'auto' (delegate to gateway) / Modo de payout */
    payoutMode: (process.env.WALLET_PAYOUT_MODE as 'manual' | 'auto') || 'manual',
    /** Daily payout job cron schedule (default: midnight UTC) / Cron del job de pagos diarios */
    cronTime: process.env.WALLET_CRON_TIME || '0 0 * * *',
    /** Poll reconciliation cron (auto mode only) / Cron de reconciliación */
    pollCron: process.env.WALLET_POLL_CRON || '0 */4 * * *',
    /** Daily budget for PayPal payouts in USD / Presupuesto diario para PayPal */
    budgetPaypal: parseFloat(process.env.WALLET_BUDGET_PAYPAL || '5000'),
    /** Daily budget for MercadoPago payouts in USD / Presupuesto diario para MercadoPago */
    budgetMercadopago: parseFloat(process.env.WALLET_BUDGET_MERCADO || '0'),
  },

  /** VAPID configuration for Web Push notifications / Configuración VAPID para notificaciones push */
  vapid: {
    /** VAPID public key / Clave pública VAPID */
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    /** VAPID private key / Clave privada VAPID */
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    /** VAPID subject (mailto or URL) / Asunto VAPID (mailto o URL) */
    subject: process.env.VAPID_SUBJECT || `mailto:admin@${platformDomain}`,
  },

  /** PayPal configuration / Configuración de PayPal */
  paypal: {
    /** PayPal mode: 'sandbox' or 'live' / Modo de PayPal: 'sandbox' o 'live' */
    mode: process.env.PAYPAL_MODE || 'sandbox',
    /** PayPal client ID / Client ID de PayPal */
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    /** PayPal client secret / Client secret de PayPal */
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    /** PayPal webhook ID for signature verification / Webhook ID de PayPal para verificación de firma */
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    /** PayPal Payouts webhook ID (separate webhook for PAYMENT.PAYOUTS.* events) / Webhook ID de PayPal Payouts */
    payoutWebhookId: process.env.PAYPAL_PAYOUT_WEBHOOK_ID || '',
  },

  /**
   * Feature flags — toggle features without code changes
   * Flags de funcionalidad — activar/desactivar features sin cambios de código
   */
  features: {
    /** Crypto wallet feature / Funcionalidad de wallet crypto */
    cryptoWallet: process.env.FEATURE_CRYPTO_WALLET === 'true',
  },

  /** MercadoPago configuration / Configuración de MercadoPago */
  mercadopago: {
    /** MercadoPago access token / Access token de MercadoPago */
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    /** MercadoPago public key / Clave pública de MercadoPago */
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    /** MercadoPago webhook ID / Webhook ID de MercadoPago */
    webhookId: process.env.MERCADOPAGO_WEBHOOK_ID || '',
    /** MercadoPago payout webhook ID (reserved for payout-event identification) / Webhook ID de payout */
    payoutWebhookId: process.env.MERCADOPAGO_PAYOUT_WEBHOOK_ID || '',
    /** MercadoPago integration type: 'checkout' or 'wallet' */
    integrationType: process.env.MERCADOPAGO_INTEGRATION_TYPE || 'checkout',
    /** MercadoPago webhook secret for HMAC-SHA256 signature verification (optional in dev) */
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  },

  /**
   * Marketplace configuration — per-vendor MercadoPago charging (BE-3).
   * Configuración del marketplace — cobro por negocio vía MercadoPago.
   *
   * Behind `MARKETPLACE_ENABLED` (default false) → zero behavior change until the
   * MP marketplace is enabled for the CO app. Detrás de `MARKETPLACE_ENABLED`
   * (default false) → cero cambio de comportamiento hasta habilitar la app.
   */
  marketplace: {
    /** MercadoPago app client ID for OAuth / Client ID de la app MP para OAuth */
    clientId: process.env.MERCADOPAGO_CLIENT_ID || '',
    /** MercadoPago app client secret for OAuth / Client secret de la app MP para OAuth */
    clientSecret: process.env.MERCADOPAGO_CLIENT_SECRET || '',
    /** OAuth redirect URI (HTTPS required, NFR-5) / URI de redirect OAuth (HTTPS obligatorio) */
    redirectUri: process.env.MERCADOPAGO_REDIRECT_URI || '',
    /** Marketplace feature flag (default false) / Flag del feature marketplace (default false) */
    enabled: process.env.MARKETPLACE_ENABLED === 'true',
    /** Supported marketplace country (only CO) / País soportado por el marketplace (solo CO) */
    country: process.env.MARKETPLACE_COUNTRY || 'CO',
    /** VAT rates by country (CO active; MX/AR/CL/ES defined but inactive) / Tasas IVA por país */
    vatRates: parseMarketplaceVatRates(),
  },
};

/**
 * Parse VAT rates from env (JSON override) or return the defaults.
 * CO 0.19 active; MX 0.16, AR 0.21, CL 0.19, ES 0.21 defined but inactive.
 *
 * Parsea tasas IVA desde env (override JSON) o devuelve los defaults.
 */
function parseMarketplaceVatRates(): Record<string, number> {
  const defaults: Record<string, number> = {
    CO: 0.19,
    MX: 0.16,
    AR: 0.21,
    CL: 0.19,
    ES: 0.21,
  };

  if (!process.env.MARKETPLACE_VAT_RATES) return defaults;

  try {
    return { ...defaults, ...JSON.parse(process.env.MARKETPLACE_VAT_RATES) };
  } catch {
    logger.warn('MARKETPLACE_VAT_RATES is not valid JSON — using default VAT rates');
    return defaults;
  }
}

/**
 * Fail-fast validation for critical security secrets
 * Validación fail-fast para secretos de seguridad críticos
 *
 * Crashes the process immediately on startup if required secrets are missing.
 * This prevents the application from running with undefined/empty JWT or 2FA keys,
 * which would be a critical security vulnerability.
 *
 * Detiene el proceso inmediatamente al iniciar si faltan secretos requeridos.
 * Esto previene que la aplicación corra con claves JWT o 2FA indefinidas/vacías,
 * lo cual sería una vulnerabilidad de seguridad crítica.
 */
if (!config.jwt.secret) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is required. Server cannot start without it.'
  );
}
if (!config.twoFactor.secretKey) {
  throw new Error(
    'FATAL: TWO_FACTOR_SECRET_KEY environment variable is required. Server cannot start without it.'
  );
}

/**
 * Warn if PLATFORM_DOMAIN is not explicitly set (uses default).
 * Advertir si PLATFORM_DOMAIN no está configurado explícitamente (usa default).
 */
if (!process.env.PLATFORM_DOMAIN) {
  logger.warn(
    `PLATFORM_DOMAIN is not set — defaulting to '${config.platform.domain}'. Set it in production.`
  );
}
