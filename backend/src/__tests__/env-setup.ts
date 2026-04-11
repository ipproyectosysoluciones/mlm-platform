/**
 * @fileoverview Jest test environment bootstrap — sets test secrets BEFORE module imports
 * @description Bootstrap de entorno de pruebas Jest — configura secretos de test ANTES de importar módulos
 *
 * This file is loaded via Jest `setupFiles` (runs BEFORE any module import).
 * It sets required secrets so that env.ts fail-fast validation does not
 * crash the test runner. Without this, env.ts would throw at import time
 * because dotenv.config() runs at module scope.
 *
 * Este archivo se carga via Jest `setupFiles` (se ejecuta ANTES de importar módulos).
 * Configura secretos requeridos para que la validación fail-fast de env.ts
 * no rompa el test runner. Sin esto, env.ts lanzaría error al importarse
 * porque dotenv.config() se ejecuta a nivel de módulo.
 *
 * @module __tests__/env-setup
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jest';
process.env.TWO_FACTOR_SECRET_KEY = process.env.TWO_FACTOR_SECRET_KEY || 'test-2fa-key-for-jest';
