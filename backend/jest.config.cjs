/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Runs BEFORE any module import — provides test secrets so env.ts fail-fast doesn't crash Jest
  setupFiles: ['<rootDir>/src/__tests__/env-setup.ts'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/integration/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
    }],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  // Mock Sentry to prevent hanging
  // Rewrite .js extensions to .ts for ts-jest compatibility with NodeNext imports
  moduleNameMapper: {
    '^@sentry/node$': '<rootDir>/src/__tests__/__mocks__/sentry.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
