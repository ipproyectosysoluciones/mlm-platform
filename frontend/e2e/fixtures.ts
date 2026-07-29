import { test as base, expect } from '@playwright/test';
import { setupMockApi } from './mock-api';

/**
 * Extended test fixture that automatically sets up mock API interception
 * for every test. No test needs to call setupMockApi(page) manually.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    setupMockApi(page);
    await use(page);
  },
});

export { expect };
