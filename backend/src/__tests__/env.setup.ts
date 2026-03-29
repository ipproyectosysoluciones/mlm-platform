/**
 * @fileoverview Environment setup for integration tests
 * Runs BEFORE any module imports (setupFiles, not setupFilesAfterEnv)
 */
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'postgres';
process.env.TEST_DB_NAME = 'mlm_test';
process.env.TEST_DB_HOST = '127.0.0.1';
process.env.TEST_DB_PORT = '5435';
process.env.TEST_DB_USER = 'mlm_test';
process.env.TEST_DB_PASSWORD = 'mlm_test';
process.env.DB_HOST = '127.0.0.1';
// Disable Sentry (prevents hanging on import with fake DSN)
process.env.SENTRY_DSN = '';
process.env.REDIS_ENABLED = 'false';
