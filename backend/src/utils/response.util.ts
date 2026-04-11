/**
 * @fileoverview ResponseUtil - Consistent API response format
 * @description Helper functions for consistent success/error responses across controllers.
 *              Utilidades para respuestas de API consistentes en todos los controladores.
 * @module utils/response.util
 */

/**
 * Standardized API response helper.
 * Utilidad para generar respuestas de API estandarizadas de éxito y error.
 *
 * @example
 * // English: Usage in a controller
 * return res.status(200).json(ResponseUtil.success(data));
 *
 * // Español: Uso en un controlador
 * return res.status(400).json(ResponseUtil.error('NOT_FOUND', 'Recurso no encontrado', 404));
 */
export class ResponseUtil {
  /**
   * Create a success response. / Crea una respuesta de éxito.
   * @template T - Data type / Tipo de dato
   * @param data - Response data / Datos de la respuesta
   * @param status - HTTP status code (default: 200) / Código HTTP (por defecto: 200)
   * @returns Standardized success response object / Objeto de respuesta estandarizado
   */
  static success<T>(data: T, status = 200) {
    return { success: true, data, status };
  }

  /**
   * Create an error response. / Crea una respuesta de error.
   * @param code - Error code (e.g., 'NOT_FOUND', 'INVALID_PARAMS') / Código de error
   * @param message - Human-readable error message / Mensaje de error legible
   * @param status - HTTP status code (default: 400) / Código HTTP (por defecto: 400)
   * @param details - Optional additional error details / Detalles adicionales opcionales
   * @returns Standardized error response object / Objeto de error estandarizado
   */
  static error(code: string, message: string, status = 400, details?: unknown) {
    return {
      success: false,
      error: { code, message, ...(details && { details }) },
      status,
    };
  }
}
