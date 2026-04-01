/**
 * @fileoverview VAPID utility functions for Web Push notifications
 * @description Re-exports and provides utility functions for VAPID key management
 * @module utils/vapid
 * @author MLM Development Team
 *
 * @example
 * // English: Get VAPID public key for client
 * import { getVapidPublicKey } from '../utils/vapid';
 * const publicKey = getVapidPublicKey();
 *
 * // Español: Obtener clave pública VAPID para el cliente
 * import { getVapidPublicKey } from '../utils/vapid';
 * const clavePublica = getVapidPublicKey();
 */
import webpush from 'web-push';
import { vapidConfig, validateVapidConfig } from '../config/vapid';

/**
 * Get the VAPID public key in base64 format for client-side subscription
 * Obtener la clave pública VAPID en formato base64 para suscripción del cliente
 *
 * @returns {string} Base64 encoded public key
 *
 * @example
 * // English: Use in frontend to subscribe to push notifications
 * const publicKey = getVapidPublicKey();
 * // Use with: pushManager.subscribe({ applicationServerKey: ... })
 *
 * // Español: Usar en frontend para suscribir a notificaciones push
 * const clavePublica = getVapidPublicKey();
 */
export function getVapidPublicKey(): string {
  validateVapidConfig();
  return vapidConfig.publicKey;
}

/**
 * Get the configured web-push instance
 * Obtener la instancia de web-push configurada
 *
 * @returns {typeof webpush} Configured web-push module
 *
 * @example
 * // English: Send push notification
 * import { getWebPush } from '../utils/vapid';
 * const webPush = getWebPush();
 * await webPush.sendNotification(subscription, payload);
 *
 * // Español: Enviar notificación push
 * import { getWebPush } from '../utils/vapid';
 * const webPush = getWebPush();
 * await webPush.sendNotification(subscription, payload);
 */
export function getWebPush(): typeof webpush {
  validateVapidConfig();

  // Ensure web-push is configured with VAPID details
  webpush.setVapidDetails(vapidConfig.subject, vapidConfig.publicKey, vapidConfig.privateKey);

  return webpush;
}

/**
 * Validate VAPID configuration before use
 * Validar configuración VAPID antes de usar
 *
 * @throws {Error} If VAPID keys are not properly configured
 *
 * @example
 * // English: Validate config before starting push service
 * import { validateVapid } from '../utils/vapid';
 * validateVapid();
 *
 * // Español: Validar config antes de iniciar servicio push
 * import { validateVapid } from '../utils/vapid';
 * validateVapid();
 */
export function validateVapid(): void {
  validateVapidConfig();
}

// Re-export types and config for convenience
export { vapidConfig } from '../config/vapid';
export type { VapidKeys } from '../config/vapid';
