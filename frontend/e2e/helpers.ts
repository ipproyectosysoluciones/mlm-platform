import { Page } from '@playwright/test';
import { setupMockApi } from './mock-api';

export const baseURL = 'http://localhost:5173';

export const testUser = {
  email: 'admin@mlm.com',
  password: 'admin123',
};

export const regularUser = {
  email: 'user1@mlm.com',
  password: 'User12345!',
};

/**
 * Login helper — navigates to /login, fills form, submits, waits for dashboard.
 *
 * Uses addInitScript to clear the storageState token BEFORE any page JS runs.
 * This avoids the race where the AuthGuard redirects to /dashboard before the
 * login form can be shown.
 *
 * NOTE: addInitScript persists for the page's lifetime and runs on EVERY new
 * document load (not SPA navigations). Tests that need to maintain auth state
 * across full page navigations should NOT use this helper — use the storageState
 * token directly instead, or call login() once and only use SPA navigation.
 */
export async function login(page: Page) {
  setupMockApi(page);

  // Capture any JS errors in the page for debugging
  const errors: string[] = [];
  const onError = (msg: string) => errors.push(msg);
  page.on('pageerror', (err) => onError(err.message.slice(0, 200)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') onError(msg.text().slice(0, 200));
  });

  // Clear pre-existing auth BEFORE page JS executes
  await page.addInitScript(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('mlm_user_cache');
    sessionStorage.clear();
  });
  await page.context().clearCookies();

  // Navigate to login with generous timeout
  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for React to mount and render ANY content in the root div.
  // The load event can fire before async ES modules finish importing,
  // so we explicitly wait for React hydration first.
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.innerHTML.length > 0 && root.innerHTML !== '<div></div>';
    },
    { timeout: 120000 }
  );

  // Wait for the login form
  try {
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 30000 });
  } catch (e) {
    const root = await page.evaluate(
      () => document.getElementById('root')?.innerHTML?.slice(0, 500) || 'empty'
    );
    const url = page.url();
    console.error(`\n=== LOGIN FAILURE ===`);
    console.error(`URL: ${url}`);
    console.error(`Root HTML:\n${root}`);
    console.error(`Page errors (${errors.length}): ${errors.join('\n  ')}`);
    console.error(`====================\n`);
    throw e;
  }

  // Fill and submit
  await page.fill('input[type="email"]', testUser.email);
  await page.fill('input[type="password"]', testUser.password);
  await page.click('button[type="submit"]');

  // Wait for dashboard
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  } catch {
    await page.waitForTimeout(5000);
    if (!page.url().includes('/dashboard')) {
      throw new Error('Login failed - did not redirect to dashboard');
    }
  }

  // Let React finish rendering
  await page.waitForTimeout(3000);
}

/**
 * Login as specific user
 */
export async function loginAs(page: Page, email: string, password: string) {
  setupMockApi(page);

  // Clear pre-existing auth BEFORE page JS executes
  await page.addInitScript(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('mlm_user_cache');
    sessionStorage.clear();
  });
  await page.context().clearCookies();

  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.innerHTML.length > 0 && root.innerHTML !== '<div></div>';
    },
    { timeout: 120000 }
  );
  await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 30000 });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(2000);
}

/**
 * Logout helper — finds user menu, clicks logout, waits for /login
 */
export async function logout(page: Page) {
  const userMenuButton = page
    .locator('nav button')
    .filter({
      has: page.locator('div[class*="rounded-full"]'),
    })
    .first();

  await userMenuButton.click();
  await page.waitForTimeout(800);

  const logoutButton = page
    .locator('button')
    .filter({
      hasText: /cerrar sesión|logout/i,
    })
    .first();

  await logoutButton.click();
  await page.waitForURL(/\/login/, { timeout: 15000 });
}

/**
 * Get user menu button
 */
export async function getUserMenuButton(page: Page) {
  return page
    .locator('nav button')
    .filter({
      has: page.locator('div[class*="rounded-full"]'),
    })
    .first();
}

/**
 * Wait for page ready
 */
export async function waitForPageReady(page: Page, timeout = 3000) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(timeout);
}

/**
 * Take screenshot for debugging
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}
