/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
    }],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  verbose: true,
  // setupFilesAfterEnv runs AFTER test framework is installed
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 300000, // 5 minutes per test
  forceExit: true,
  detectOpenHandles: true,
  workerIdleMemoryLimit: '512MB',
  // Mock Sentry to prevent hanging (Sentry v10 hangs on import with fake DSN)
  moduleNameMapper: {
    '^@sentry/node$': '<rootDir>/src/__tests__/__mocks__/sentry.ts',
  },
};
