/**
 * @fileoverview Authentication flow E2E tests using mock API
 * @description Tests login, logout, register, and auth guard redirects
 *              without requiring a running backend.
 *
 * @module e2e/auth.spec
 */
import { test, expect } from '@playwright/test';
import { baseURL, testUser } from './helpers';
import { setupMockApi } from './mock-api';

/**
 * Ensure the page starts with NO token — runs before any page JavaScript.
 * This avoids a race where the storageState token triggers an auth redirect
 * (mock API resolves in <1ms) before our script has a chance to clear it.
 */
async function startWithoutToken(page: import('@playwright/test').Page) {
  // Clear the token before the page JS executes (runs at context creation)
  await page.addInitScript(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('mlm_user_cache');
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

test.describe('Auth Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    setupMockApi(page);
    await startWithoutToken(page);

    await page.goto(`${baseURL}/login`, { waitUntil: 'load' });
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    setupMockApi(page);
    await startWithoutToken(page);

    await page.goto(`${baseURL}/login`, { waitUntil: 'load' });
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });

    await page.fill('input[type="email"]', 'invalid@mlm.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error feedback from the mock's 401 response
    await expect(
      page.locator('[class*="bg-red"], [class*="text-red"], [role="alert"]')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    setupMockApi(page);
    await startWithoutToken(page);

    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.innerHTML.length > 0;
      },
      { timeout: 60000 }
    );
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 30000 });

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });

    // Click user menu button (avatar with rounded-full)
    const userMenuButton = page
      .locator('nav button')
      .filter({ has: page.locator('[class*="rounded-full"]') })
      .first();
    await userMenuButton.click();
    await page.waitForTimeout(500);

    // Click Logout from the dropdown
    await page.getByText('Logout').click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    setupMockApi(page);
    await startWithoutToken(page);

    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'load' });
    // Without a token, mock returns 401 on /api/auth/me → app redirects to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to register from login', async ({ page }) => {
    setupMockApi(page);
    await startWithoutToken(page);

    await page.goto(`${baseURL}/login`, { waitUntil: 'load' });
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });
    await page.getByText('Sign Up').click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should register new user with unique email', async ({ page }) => {
    setupMockApi(page);
    await startWithoutToken(page);

    await page.goto(`${baseURL}/login`, { waitUntil: 'load' });
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });
    await page.getByText('Sign Up').click();
    await page.waitForURL(/\/register/, { timeout: 10000 });

    // Fill register form
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 10000 });
    await page.fill('input[name="email"]', `newuser_${Date.now()}@mlm.com`);
    await page.fill('input[name="password"]', 'NewUser123!');
    await page.fill('input[name="confirmPassword"]', 'NewUser123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });
});
