/**
 * @fileoverview Platform Configuration — env-backed constants for bot messages
 * @description Centralized configuration for platform URLs and contact info.
 *              Import from here instead of hardcoding URLs or placeholders in flows.
 *              Configuración centralizada para URLs de plataforma e info de contacto.
 *              Importar desde aquí en lugar de hardcodear URLs o placeholders en flows.
 * @module config/platform
 */

/**
 * Build a platform URL from the PLATFORM_URL env var and an optional path.
 *
 * - Removes trailing slash from base URL before appending path
 * - Path starting with `/` → appended as-is
 * - Path without leading `/` → `/` prepended automatically
 * - No path → returns base URL only
 *
 * @param path - Optional path to append (e.g. '/register', 'properties')
 * @returns Full platform URL
 *
 * @example
 * ```ts
 * platformUrl()              // → 'https://nexoreal.xyz'
 * platformUrl('/register')   // → 'https://nexoreal.xyz/register'
 * platformUrl('properties')  // → 'https://nexoreal.xyz/properties'
 * ```
 */
export function platformUrl(path?: string): string {
  const baseUrl = (process.env.PLATFORM_URL || 'https://nexoreal.xyz').replace(/\/+$/, '');

  if (!path) return baseUrl;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Contact email shown in bot responses.
 * Default: empty string (the substitution layer falls back to a generic message).
 */
export const EMAIL: string = process.env.EMAIL || '';

/**
 * Calendly scheduling link for booking visits.
 * Default: empty string (the substitution layer falls back to a generic message).
 */
export const CALENDLY_LINK: string = process.env.CALENDLY_LINK || '';

/**
 * Physical office address shown in bot responses.
 * Default: 'Ask the agent for more information'
 */
export const OFFICE_ADDRESS: string =
  process.env.OFFICE_ADDRESS || 'Ask the agent for more information';

/**
 * WhatsApp phone number for this bot instance (international format, no + or spaces).
 * Set via PHONE_NUMBER env var. Used for logging, self-identification, and display.
 *
 * Número de teléfono WhatsApp de esta instancia del bot (formato internacional, sin + ni espacios).
 * Se configura via variable de entorno PHONE_NUMBER. Se usa para logging, auto-identificación y display.
 *
 * @example '573004019604'
 */
export const BOT_PHONE_NUMBER: string = process.env.PHONE_NUMBER || '';
