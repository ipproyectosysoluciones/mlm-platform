/**
 * @fileoverview Global Jest setup for integration tests
 * @description Uses table truncation for test isolation
 *
 * @module __tests__/setup
 */

// Set test environment BEFORE importing anything else
process.env.NODE_ENV = 'test';
process.env.TEST_DB_NAME = 'mlm_test';
process.env.TEST_DB_HOST = '127.0.0.1';
process.env.TEST_DB_PORT = '3307';
process.env.TEST_DB_USER = 'root';
process.env.TEST_DB_PASSWORD = 'testpass';
process.env.DB_HOST = '127.0.0.1';

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
    // Use alter instead of force for faster syncs (keeps existing data, adds missing columns)
    await testDb.sync({ alter: true });
    console.log('Test database synced successfully');
  } catch (error) {
    console.error('Error syncing test database:', error);
    throw error;
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
