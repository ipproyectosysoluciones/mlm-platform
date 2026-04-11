/**
 * @fileoverview Auth Guard — lightweight auth token check
 * @description Pure utility to check if an auth token exists in localStorage.
 *              Used to guard preloadData calls that require authentication.
 *              Utilidad pura para verificar si existe un token de auth en localStorage.
 *              Usada para proteger llamadas a preloadData que requieren autenticación.
 * @module lib/authGuard
 */

/**
 * Check if an authentication token exists in localStorage.
 * Returns true only if a non-empty token is present.
 *
 * Verifica si existe un token de autenticación en localStorage.
 * Retorna true solo si hay un token no vacío.
 *
 * @returns {boolean} Whether the user has an auth token / Si el usuario tiene un token de auth
 */
export function hasAuthToken(): boolean {
  const token = localStorage.getItem('token');
  return typeof token === 'string' && token.length > 0;
}
