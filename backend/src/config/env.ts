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

  /** Database configuration / Configuración de base de datos */
  db: {
    /** Database host / Host de base de datos */
    host: process.env.DB_HOST || 'localhost',
    /** Database port / Puerto de base de datos */
    port: parseInt(process.env.DB_PORT || '3306', 10),
    /** Database name / Nombre de base de datos */
    name: process.env.DB_NAME || 'mlm_db',
    /** Database user / Usuario de base de datos */
    user: process.env.DB_USER || 'root',
    /** Database password / Contraseña de base de datos */
    password: process.env.DB_PASSWORD || '',
  },

  /** JWT authentication configuration / Configuración de autenticación JWT */
  jwt: {
    /** JWT secret key - CHANGE IN PRODUCTION / Clave secreta JWT - CAMBIAR EN PRODUCCIÓN */
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    /** JWT token expiration / Expiración del token JWT */
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  /** Two-Factor Authentication configuration / Configuración de autenticación de dos factores */
  twoFactor: {
    /** 2FA secret key - CHANGE IN PRODUCTION / Clave secreta 2FA - CAMBIAR EN PRODUCCIÓN */
    secretKey: process.env.TWO_FACTOR_SECRET_KEY || '',
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
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@mlm-platform.com',
    /** Sender display name / Nombre del remitente */
    senderName: process.env.BREVO_SENDER_NAME || 'MLM Platform',
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
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@mlm-platform.com',
  },

  /** PayPal configuration / Configuración de PayPal */
  paypal: {
    /** PayPal mode: 'sandbox' or 'live' / Modo de PayPal: 'sandbox' o 'live' */
    mode: process.env.PAYPAL_MODE || 'sandbox',
    /** PayPal client ID / Client ID de PayPal */
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    /** PayPal client secret / Client secret de PayPal */
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  },
};
