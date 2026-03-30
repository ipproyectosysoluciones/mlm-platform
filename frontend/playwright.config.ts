import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'always',
    video: 'on',
  },

  outputDir: './test-results',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // In CI, the backend is already running, so we just wait for it
  webServer: process.env.CI
    ? {
        command: 'echo "Backend already running" && exit 0',
        url: 'http://localhost:3000/api/health',
        reuseExistingServer: true,
        timeout: 10000,
      }
    : {
        command: 'pnpm dev',
        url: process.env.BASE_URL
          ? `http://localhost:${process.env.BASE_URL.split(':')[2]}`
          : 'http://localhost:5174',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
});
