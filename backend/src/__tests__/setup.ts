/**
 * @fileoverview Global Jest setup for integration tests
 * @description Uses table truncation for test isolation
 *
 * @module __tests__/setup
 */

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
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Reset any existing sequelize instance
  resetSequelize();

  // Import sequelize
  const { sequelize } = require('../config/database');
  testDb = sequelize;
  sequelizeInstance = sequelize;

  // Import models to register them with sequelize
  require('../models');

  // Sync all models - force to recreate tables
  await testDb.sync({ force: true });

  // Create test agent
  const app = require('../app').default;
  testAgent = supertest(app);
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
  ];

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
});
