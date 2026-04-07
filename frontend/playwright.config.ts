import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL:
      process.env.BASE_URL || (process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173'),
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

  // In CI the frontend is pre-built; serve via `vite preview` on port 4173.
  // Locally `pnpm dev` uses port 5173.
  webServer: process.env.CI
    ? {
        command: 'pnpm preview --port 4173',
        url: 'http://localhost:4173',
        reuseExistingServer: false,
        timeout: 60 * 1000,
      }
    : {
        command: 'pnpm dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
});
