/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/integration/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  // Mock Sentry to prevent hanging
  moduleNameMapper: {
    '^@sentry/node$': '<rootDir>/src/__tests__/__mocks__/sentry.ts',
  },
};
