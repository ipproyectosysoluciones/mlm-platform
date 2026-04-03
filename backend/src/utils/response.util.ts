/**
 * @fileoverview ApiResponse utility - Consistent API response format
 * @description Helper functions for consistent success/error responses across controllers
 * @module utils/response.util
 */

/**
 * Standardized API response helper
 * Provides consistent response format for success and error cases
 */
export class ApiResponse {
  /**
   * Create a success response
   * @template T - Data type
   * @param data - Response data
   * @param status - HTTP status code (default: 200)
   * @returns Standardized success response object
   */
  static success<T>(data: T, status = 200) {
    return { success: true, data, status };
  }

  /**
   * Create an error response
   * @param code - Error code (e.g., 'NOT_FOUND', 'INVALID_PARAMS')
   * @param message - Human-readable error message
   * @param status - HTTP status code (default: 400)
   * @param details - Optional additional error details
   * @returns Standardized error response object
   */
  static error(code: string, message: string, status = 400, details?: unknown) {
    return {
      success: false,
      error: { code, message, ...(details && { details }) },
      status,
    };
  }
}
