/**
 * @fileoverview Security tests for environment configuration
 * @description Tests de seguridad para configuración de entorno
 *
 * Validates that:
 * - JWT_SECRET has no insecure default fallback
 * - TWO_FACTOR_SECRET_KEY has no insecure default fallback
 * - Application fails fast when critical secrets are missing
 *
 * Valida que:
 * - JWT_SECRET no tiene fallback inseguro por defecto
 * - TWO_FACTOR_SECRET_KEY no tiene fallback inseguro por defecto
 * - La aplicación falla inmediatamente si faltan secretos críticos
 *
 * @module __tests__/unit/env-security
 */

describe('env.ts — security hardening', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    // Restore original env after each test
    process.env = { ...ORIGINAL_ENV };
    // Clear module cache so env.ts re-evaluates on next import
    jest.resetModules();
  });

  describe('fail-fast on missing secrets', () => {
    it('should throw FATAL error when JWT_SECRET is missing', () => {
      // Remove JWT_SECRET so env.ts cannot find it
      delete process.env.JWT_SECRET;
      // Keep TWO_FACTOR_SECRET_KEY so only JWT fails
      process.env.TWO_FACTOR_SECRET_KEY = 'present-for-this-test';

      // Prevent dotenv from re-reading .env file (which would restore the secret)
      jest.mock('dotenv', () => ({ config: jest.fn() }));

      expect(() => {
        require('../../config/env');
      }).toThrow('FATAL: JWT_SECRET environment variable is required');
    });

    it('should throw FATAL error when TWO_FACTOR_SECRET_KEY is missing', () => {
      // Keep JWT_SECRET so only 2FA fails
      process.env.JWT_SECRET = 'present-for-this-test';
      // Remove TWO_FACTOR_SECRET_KEY
      delete process.env.TWO_FACTOR_SECRET_KEY;

      // Prevent dotenv from re-reading .env file
      jest.mock('dotenv', () => ({ config: jest.fn() }));

      expect(() => {
        require('../../config/env');
      }).toThrow('FATAL: TWO_FACTOR_SECRET_KEY environment variable is required');
    });

    it('should throw when BOTH secrets are missing', () => {
      delete process.env.JWT_SECRET;
      delete process.env.TWO_FACTOR_SECRET_KEY;

      // Prevent dotenv from re-reading .env file
      jest.mock('dotenv', () => ({ config: jest.fn() }));

      // JWT_SECRET is checked first, so it should throw for JWT
      expect(() => {
        require('../../config/env');
      }).toThrow('FATAL: JWT_SECRET environment variable is required');
    });
  });

  describe('no insecure defaults', () => {
    it('should NOT contain default-secret fallback for JWT', () => {
      // Provide valid secrets so env.ts loads without error
      process.env.JWT_SECRET = 'real-secret-value';
      process.env.TWO_FACTOR_SECRET_KEY = 'real-2fa-value';

      // Prevent dotenv from overwriting our test values
      jest.mock('dotenv', () => ({ config: jest.fn() }));

      const { config } = require('../../config/env');

      // The config should use the env var value, not a hardcoded default
      expect(config.jwt.secret).toBe('real-secret-value');
      expect(config.jwt.secret).not.toBe('default-secret-change-in-production');
    });

    it('should NOT contain empty string fallback for TWO_FACTOR_SECRET_KEY', () => {
      process.env.JWT_SECRET = 'real-secret-value';
      process.env.TWO_FACTOR_SECRET_KEY = 'real-2fa-value';

      // Prevent dotenv from overwriting our test values
      jest.mock('dotenv', () => ({ config: jest.fn() }));

      const { config } = require('../../config/env');

      expect(config.twoFactor.secretKey).toBe('real-2fa-value');
      // Ensures it's not falling back to empty string
      expect(config.twoFactor.secretKey).not.toBe('');
    });
  });

  describe('loads correctly with valid secrets', () => {
    it('should load config without throwing when both secrets are set', () => {
      process.env.JWT_SECRET = 'test-jwt-secret';
      process.env.TWO_FACTOR_SECRET_KEY = 'test-2fa-secret';

      // Prevent dotenv from overwriting our test values
      jest.mock('dotenv', () => ({ config: jest.fn() }));

      expect(() => {
        const { config } = require('../../config/env');
        // Verify the values are correctly assigned
        expect(config.jwt.secret).toBe('test-jwt-secret');
        expect(config.twoFactor.secretKey).toBe('test-2fa-secret');
      }).not.toThrow();
    });
  });
});
