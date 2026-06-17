/**
 * @fileoverview VAPID keys configuration for Web Push notifications
 * @description Configuration for VAPID (Voluntary Application Server Identification) keys
 *             used for push notifications. Generate keys using generateKeys() once and
 *             store in environment variables.
 * @module config/vapid
 * @author MLM Development Team
 *
 * @example
 * // English: Generate VAPID keys (run once, then use environment variables)
 * const keys = generateKeys();
 * console.log('Public Key:', keys.publicKey);
 * console.log('Private Key:', keys.privateKey);
 *
 * // Español: Generar claves VAPID (ejecutar una vez, luego usar variables de entorno)
 * const keys = generateKeys();
 * console.log('Clave Pública:', keys.publicKey);
 * console.log('Clave Privada:', keys.privateKey);
 *
 * @example
 * // English: Import from config (in production)
 * import { vapidConfig } from '../config/vapid';
 * const publicKey = vapidConfig.publicKey;
 *
 * // Español: Importar desde config (en producción)
 * import { vapidConfig } from '../config/vapid';
 * const publicKey = vapidConfig.publicKey;
 */
import webpush from 'web-push';
import { config } from './env';

/**
 * VAPID keys structure
 * Estructura de claves VAPID
 */
export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

/**
 * Generate new VAPID keys
 * Generar nuevas claves VAPID
 *
 * @returns {VapidKeys} Object containing public and private keys
 *
 * @example
 * // English: Generate keys and save to .env
 * const keys = generateKeys();
 * // Add to .env:
 * // VAPID_PUBLIC_KEY=<publicKey>
 * // VAPID_PRIVATE_KEY=<privateKey>
 * // VAPID_SUBJECT=mailto:admin@<PLATFORM_DOMAIN>
 *
 * // Español: Generar claves y guardar en .env
 * const keys = generateKeys();
 * // Agregar a .env:
 * // VAPID_PUBLIC_KEY=<publicKey>
 * // VAPID_PRIVATE_KEY=<privateKey>
 * // VAPID_SUBJECT=mailto:admin@<PLATFORM_DOMAIN>
 */
export function generateKeys(): VapidKeys {
  const keys = webpush.generateVAPIDKeys();
  return {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };
}

/**
 * VAPID configuration object
 * Objeto de configuración VAPID
 *
 * @constant {Object}
 *
 * @example
 * // English: Access VAPID config
 * const publicKey = vapidConfig.publicKey;
 * const subject = vapidConfig.subject;
 *
 * // Español: Acceder a config VAPID
 * const publicKey = vapidConfig.publicKey;
 * const subject = vapidConfig.subject;
 */
export const vapidConfig = {
  /** Public key for client-side subscription / Clave pública para suscripción del cliente */
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  /** Private key for server-side push / Clave privada para push del servidor */
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  /** Subject for VAPID (mailto or URL) / Asunto para VAPID (mailto o URL) */
  subject: process.env.VAPID_SUBJECT || `mailto:admin@${config.platform.domain}`,
};

/**
 * Validate VAPID configuration
 * Validar configuración VAPID
 *
 * @throws {Error} If VAPID keys are not properly configured
 *
 * @example
 * // English: Validate before using push
 * validateVapidConfig();
 *
 * // Español: Validar antes de usar push
 * validateVapidConfig();
 */
export function validateVapidConfig(): void {
  if (!vapidConfig.publicKey || !vapidConfig.privateKey) {
    throw new Error(
      'VAPID keys are not configured. Run generateKeys() and set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in environment variables.'
    );
  }
}

/**
 * Configure web-push with VAPID keys
 * Configurar web-push con claves VAPID
 *
 * @example
 * // English: Setup web-push for sending notifications
 * configureWebPush();
 *
 * // Español: Configurar web-push para enviar notificaciones
 * configureWebPush();
 */
export function configureWebPush(): void {
  validateVapidConfig();

  webpush.setVapidDetails(vapidConfig.subject, vapidConfig.publicKey, vapidConfig.privateKey);
}
