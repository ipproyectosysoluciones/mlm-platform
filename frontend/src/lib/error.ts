/**
 * @fileoverview Shared HTTP error helpers
 * @description Utilities to extract the HTTP status from errors thrown by the API
 *              client (axios) and to distinguish "not found" from real failures.
 *
 *              Utilidades para extraer el status HTTP de los errores lanzados por
 *              el cliente de API (axios) y para distinguir "no encontrado" de fallos reales.
 * @module lib/error
 * @author Nexo Real Development Team
 */

import axios from 'axios';

/**
 * Extract the HTTP status from an unknown error when the API client threw an
 * AxiosError (e.g. 400 VALIDATION_ERROR or 404). Returns undefined otherwise.
 * Extrae el status HTTP de un error desconocido cuando el cliente de API lanzó
 * un AxiosError (ej. 400 VALIDATION_ERROR o 404). Devuelve undefined en otro caso.
 * @param {unknown} error - The caught error / El error capturado
 * @returns {number | undefined} HTTP status / Status HTTP
 */
export function getHttpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/**
 * Whether the error means the requested resource does not exist.
 * The backend answers 400 VALIDATION_ERROR for malformed UUIDs and 404 for
 * missing records, so both count as "not found" for the UI.
 * Determina si el error significa que el recurso solicitado no existe.
 * El backend responde 400 VALIDATION_ERROR para UUIDs malformados y 404 para
 * registros inexistentes, por lo que ambos cuentan como "no encontrado" en la UI.
 * @param {unknown} error - The caught error / El error capturado
 * @returns {boolean} True if the error is a 400/404 / True si el error es 400/404
 */
export function isNotFoundError(error: unknown): boolean {
  const status = getHttpStatus(error);
  return status === 400 || status === 404;
}
