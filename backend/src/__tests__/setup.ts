/**
 * @fileoverview Global Jest setup for integration tests
 * @description Uses table truncation for test isolation
 *
 * @module __tests__/setup
 */

// Set test environment BEFORE importing anything else
process.env.NODE_ENV = 'test';
// Use PostgreSQL for tests (set DB_DIALECT=postgres)
process.env.DB_DIALECT = 'postgres';
process.env.TEST_DB_NAME = 'mlm_test';
process.env.TEST_DB_HOST = '127.0.0.1';
process.env.TEST_DB_PORT = '5435'; // PostgreSQL test port
process.env.TEST_DB_USER = 'mlm_test';
process.env.TEST_DB_PASSWORD = 'mlm_test';
process.env.DB_HOST = '127.0.0.1';
// Disable Sentry for tests (prevents hanging on import)
process.env.SENTRY_DSN = '';

import { Sequelize } from 'sequelize';
import supertest from 'supertest';
import { resetSequelize } from '../config/database';

// Test database instance
let testDb: Sequelize;

// Global test agent - used by all integration tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let testAgent: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sequelizeInstance: any = null;

beforeAll(async () => {
  console.log('=== SETUP: Starting integration test setup ===');
  console.log('TEST_DB_NAME:', process.env.TEST_DB_NAME);
  console.log('TEST_DB_HOST:', process.env.TEST_DB_HOST);
  console.log('TEST_DB_PORT:', process.env.TEST_DB_PORT);

  // Reset any existing sequelize instance
  resetSequelize();

  // Import sequelize - it will use the environment variables set above
  const { sequelize } = require('../config/database');
  testDb = sequelize;
  sequelizeInstance = sequelize;

  console.log('Sequelize instance created');

  // Import models to register them with sequelize
  require('../models');
  console.log('Models registered');

  // Sync all models - force to recreate tables
  try {
    console.log('Syncing database...');
    // Use force to drop and recreate tables (faster for tests)
    await testDb.sync({ force: true });
    console.log('Test database synced successfully');
  } catch (error) {
    console.error('Error syncing test database:', error);
    throw error;
  }

  // Seed commission_configs if empty
  try {
    const existingConfigs = await sequelizeInstance?.query(
      'SELECT COUNT(*) as count FROM "commission_configs"',
      { type: 'SELECT' }
    );
    if (parseInt((existingConfigs as any)?.[0]?.count || '0') === 0) {
      const businessTypes = ['suscripcion', 'producto', 'membresia', 'servicio', 'otro'];
      const levels = ['direct', 'level_1', 'level_2', 'level_3', 'level_4'];
      const defaultRates: Record<string, Record<string, number>> = {
        suscripcion: { direct: 0.2, level_1: 0.1, level_2: 0.08, level_3: 0.05, level_4: 0.03 },
        producto: { direct: 0.15, level_1: 0.08, level_2: 0.05, level_3: 0.03, level_4: 0.02 },
        membresia: { direct: 0.25, level_1: 0.12, level_2: 0.08, level_3: 0.05, level_4: 0.03 },
        servicio: { direct: 0.18, level_1: 0.1, level_2: 0.06, level_3: 0.04, level_4: 0.02 },
        otro: { direct: 0.1, level_1: 0.05, level_2: 0.03, level_3: 0.02, level_4: 0.01 },
      };
      for (const bt of businessTypes) {
        for (const lvl of levels) {
          await sequelizeInstance?.query(
            `INSERT INTO "commission_configs" ("id", "business_type", "level", "percentage", "is_active", "created_at", "updated_at")
             VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())`,
            { bind: [bt, lvl, defaultRates[bt][lvl]] }
          );
        }
      }
      console.log('Commission configs seeded for tests');
    }
  } catch (error) {
    console.error('Error seeding commission_configs:', error);
  }

  // Create test agent
  try {
    console.log('Loading app...');
    const app = require('../app').default;
    console.log('App loaded, creating test agent...');
    testAgent = supertest(app);
    console.log('Test agent created successfully');
  } catch (error) {
    console.error('Error creating test agent:', error);
    throw error;
  }
  console.log('=== SETUP: Integration test setup complete ===');
});

afterAll(async () => {
  if (testDb) {
    await testDb.close();
  }
  resetSequelize();
});

// Clean tables before each test
beforeEach(async () => {
  const tables = [
    'communications',
    'tasks',
    'leads',
    'purchases',
    'commissions',
    'user_closure',
    'users',
    'landing_pages',
    'orders',
    'products',
    'wallets',
    'wallet_transactions',
    'withdrawal_requests',
  ];

  // Get dialect from sequelize
  const dialect = sequelizeInstance?.getDialect();

  if (dialect === 'postgres') {
    // PostgreSQL: Use TRUNCATE CASCADE
    for (const table of tables) {
      try {
        await sequelizeInstance?.query(`TRUNCATE TABLE "${table}" CASCADE`);
      } catch {
        // Ignore errors
      }
    }
  } else {
    // MySQL: Use DELETE with FK checks
    try {
      await sequelizeInstance?.query('SET FOREIGN_KEY_CHECKS = 0');

      for (const table of tables) {
        try {
          await sequelizeInstance?.query(`DELETE FROM \`${table}\``);
        } catch {
          // Ignore errors
        }
      }
    } finally {
      await sequelizeInstance?.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }
});
