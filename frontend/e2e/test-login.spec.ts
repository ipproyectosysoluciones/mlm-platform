/**
 * @fileoverview Debug login test for mock API verification
 * @description Tests the login flow with mock API interception.
 *              Clears any pre-existing auth (from storageState) before testing.
 *
 * @module e2e/test-login
 */
import { test, expect } from '@playwright/test';
import { setupMockApi } from './mock-api';

test('debug login with exact credentials', async ({ page }) => {
  // Set up mock API BEFORE navigation
  setupMockApi(page);

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.log('PAGE ERROR:', err.message);
  });

  // Clear pre-existing auth from storageState to start at login page
  await page.context().clearCookies();
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });

  // Clear localStorage injected by storageState (token + mlm_user_cache)
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Reload so the app starts fresh without auth — lands on /login
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Login form should now be visible
  await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });

  await page.fill('input[type="email"]', 'admin@mlm.com');
  await page.fill('input[type="password"]', 'admin123');

  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard — with mock API this resolves fast
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });

  await page.screenshot({ path: '/tmp/login-debug.png', fullPage: true });

  await expect(page).toHaveURL(/\/dashboard/);
});
