/**
 * Custom HTTP error class with status code support.
 *
 * Clase de error HTTP personalizada con soporte para código de estado.
 *
 * @description Extends the native Error class to include an HTTP status code.
 * Used throughout the application to throw typed HTTP errors instead of
 * using `(error as any).statusCode` patterns.
 *
 * @example
 * ```typescript
 * throw new HttpError('Resource not found', 404);
 * throw new HttpError('Unauthorized access', 401);
 * ```
 */
export class HttpError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;

    // Restore prototype chain (required when extending built-in classes in TS)
    // Restaurar cadena de prototipos (requerido al extender clases nativas en TS)
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * Interface for any error-like object that carries an HTTP status code.
 *
 * Interfaz para cualquier objeto tipo error que lleve un código de estado HTTP.
 *
 * @description Used by the `hasStatusCode` type guard to support both `HttpError`
 * instances and plain Error objects with a `statusCode` property assigned via
 * `Object.assign(new Error(), { statusCode })`.
 */
export interface ErrorWithStatusCode extends Error {
  statusCode: number;
  code?: string;
}

/**
 * Type guard to check if an unknown error is an HttpError instance.
 *
 * Type guard para verificar si un error desconocido es una instancia de HttpError.
 *
 * @param error - The caught error (unknown type from catch blocks)
 * @returns True if the error is an instance of HttpError
 *
 * @example
 * ```typescript
 * catch (error: unknown) {
 *   if (isHttpError(error)) {
 *     res.status(error.statusCode).json({ message: error.message });
 *   }
 * }
 * ```
 */
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/**
 * Type guard using duck typing to check if an error carries a status code.
 * Supports both `HttpError` instances AND plain `Error` objects with an
 * assigned `statusCode` property (e.g., `Object.assign(new Error(), { statusCode: 404 })`).
 *
 * Type guard con duck typing para verificar si un error lleva código de estado.
 * Soporta tanto instancias de `HttpError` COMO objetos `Error` con una
 * propiedad `statusCode` asignada.
 *
 * @param error - The caught error (unknown type from catch blocks)
 * @returns True if the error has a numeric `statusCode` property
 *
 * @example
 * ```typescript
 * catch (error: unknown) {
 *   if (hasStatusCode(error)) {
 *     res.status(error.statusCode).json({ message: error.message });
 *   }
 * }
 * ```
 */
export function hasStatusCode(error: unknown): error is ErrorWithStatusCode {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as ErrorWithStatusCode).statusCode === 'number'
  );
}

/**
 * Type guard to check if an unknown value is an Error instance.
 *
 * Type guard para verificar si un valor desconocido es una instancia de Error.
 *
 * @param error - The caught error (unknown type from catch blocks)
 * @returns True if the error is an instance of Error
 *
 * @example
 * ```typescript
 * catch (error: unknown) {
 *   const message = isError(error) ? error.message : 'Unknown error';
 * }
 * ```
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extract a safe error message from an unknown error.
 *
 * Extraer un mensaje de error seguro de un error desconocido.
 *
 * @param error - The caught error (unknown type from catch blocks)
 * @param fallback - Fallback message if error is not an Error instance
 * @returns The error message string
 *
 * @example
 * ```typescript
 * catch (error: unknown) {
 *   logger.error(getErrorMessage(error, 'Failed to process request'));
 * }
 * ```
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}
