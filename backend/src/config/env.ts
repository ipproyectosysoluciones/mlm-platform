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
 * import { config } from '../config/env';
 *
 * // Español: Importar config en tus módulos
 * import { config } from '../config/env';
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
    /** Withdrawal fee percentage / Porcentaje de fee de retiro */
    feePercentage: parseFloat(process.env.WALLET_FEE_PERCENTAGE || '5'),
    /** Daily payout job cron schedule (default: midnight UTC) / Cron del job de pagos diarios */
    cronTime: process.env.WALLET_CRON_TIME || '0 0 * * *',
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
  },

  /** MercadoPago configuration / Configuración de MercadoPago */
  mercadopago: {
    /** MercadoPago access token / Access token de MercadoPago */
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    /** MercadoPago public key / Clave pública de MercadoPago */
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    /** MercadoPago webhook ID / Webhook ID de MercadoPago */
    webhookId: process.env.MERCADOPAGO_WEBHOOK_ID || '',
    /** MercadoPago integration type: 'checkout' or 'wallet' */
    integrationType: process.env.MERCADOPAGO_INTEGRATION_TYPE || 'checkout',
    /** MercadoPago webhook secret for HMAC-SHA256 signature verification (optional in dev) */
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  },
};

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
  console.warn(
    `⚠️  PLATFORM_DOMAIN is not set — defaulting to '${config.platform.domain}'. Set it in production.`
  );
}
