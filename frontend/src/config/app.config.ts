/**
 * @fileoverview app.config - Centralized application configuration
 * @description Single source of truth for domain, API URL and CDN URL.
 *              If the domain ever changes, update only this file.
 *
 *              Fuente única de verdad para dominio, URL de API y CDN.
 *              Si el dominio cambia, solo se toca este archivo.
 *
 * @module config/app.config
 * @author Nexo Real Development Team
 */

/**
 * Base URL of the public-facing frontend application.
 * URL base del frontend público de la aplicación.
 */
export const APP_URL = 'https://nexoreal.xyz';

/**
 * Base URL of the production REST API.
 * URL base de la API REST en producción.
 */
export const APP_API_URL = 'https://api.nexoreal.xyz';

/**
 * CDN base URL used for uploaded media assets (images, etc.).
 * URL base del CDN para assets multimedia subidos (imágenes, etc.).
 */
export const APP_CDN_URL = 'https://img.nexoreal.xyz';

/**
 * Default Open Graph fallback image URL.
 * URL de imagen Open Graph por defecto para redes sociales.
 */
export const APP_OG_DEFAULT_IMAGE = `${APP_URL}/og-default.jpg`;

/**
 * Human-readable site name used in meta tags.
 * Nombre legible del sitio para usar en meta tags.
 */
export const APP_SITE_NAME = 'Nexo Real';
