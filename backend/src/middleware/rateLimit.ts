/**
 * @fileoverview Shared rate limiters for admin routes
 * @description Centralized rate limiting configuration for all admin endpoints.
 *              60 req/min in production, 1000 req/min in test environment.
 *              Configuración centralizada de rate limiting para todos los endpoints admin.
 *              60 req/min en producción, 1000 req/min en entorno de test.
 * @module middleware/rateLimit
 * @author MLM Development Team
 */
import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

/**
 * Shared rate limiter for all admin route files.
 * Replaces per-file inline limiters to ensure consistent configuration.
 *
 * Rate limit compartido para todos los archivos de rutas admin.
 * Reemplaza limiters inline por archivo para asegurar configuración consistente.
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute / 1 minuto
  max: isTest ? 1000 : 60, // 60 req/min production, 1000 for tests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' },
  },
});
