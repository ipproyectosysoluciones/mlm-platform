import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',

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
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/admin.json',
      },
    },
  ],

  // Use vite preview (prebuilt) everywhere to avoid Vite dev server degradation
  // after many sequential page loads. The dev server's on-the-fly ES module
  // transformation pipeline hangs after ~16 page loads in the same session,
  // causing #root to stay empty (React never receives its bundle).
  //
  // Local: build + preview on port 5173 (same port as pnpm dev for compat).
  // CI: preview only (CI builds separately), port 4173.
  webServer: {
    command: process.env.CI
      ? 'pnpm preview --port 4173'
      : 'npx vite build && npx vite preview --port 5173',
    url: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
