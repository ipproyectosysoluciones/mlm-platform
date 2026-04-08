import { Page } from '@playwright/test';

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
 * Login helper function / Función de ayuda para login
 * Uses type selectors and waits for page load
 */
export async function login(page: Page) {
  // Clear cookies AND localStorage to ensure fresh session / Limpia cookies Y localStorage para sesión fresca
  await page.context().clearCookies();
  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
  // Clear localStorage after navigation to remove stale auth tokens
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // Reload to apply cleared storage / Reload para aplicar storage limpio
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for form to be visible with retry logic
  await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 20000 });

  // Fill login form using type selectors (more reliable)
  await page.fill('input[type="email"]', testUser.email);
  await page.fill('input[type="password"]', testUser.password);

  // Click submit button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard with extended timeout
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
  } catch (e) {
    // If timeout, try waiting a bit more and check URL
    await page.waitForTimeout(5000);
    if (!page.url().includes('/dashboard')) {
      throw new Error('Login failed - did not redirect to dashboard');
    }
  }

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Extra wait for React to render completely
  await page.waitForTimeout(3000);
}

/**
 * Login as specific user / Login como usuario específico
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${baseURL}/login`);

  await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

/**
 * Logout helper / Función de ayuda para logout
 * Finds and clicks the user menu, then logout
 */
export async function logout(page: Page) {
  // Find the user menu button (has avatar circle)
  const userMenuButton = page
    .locator('nav button')
    .filter({
      has: page.locator('div[class*="rounded-full"]'),
    })
    .first();

  await userMenuButton.click();
  await page.waitForTimeout(800);

  // Click logout - look for button with logout text
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
 * Get user menu button / Obtener botón del menú de usuario
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
 * Wait for page ready / Esperar que la página esté lista
 */
export async function waitForPageReady(page: Page, timeout = 3000) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(timeout);
}

/**
 * Take screenshot for debugging / Captura de pantalla para debugging
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}
