import { test, expect } from '@playwright/test';
import { baseURL, testUser } from './helpers';

test.describe('Auth Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.waitForSelector('input[type="email"]', { state: 'visible' });

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    // Wait for dashboard content to load
    await page.waitForLoadState('networkidle');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.waitForSelector('input[type="email"]', { state: 'visible' });

    await page.fill('input[type="email"]', 'invalid@mlm.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Error message should appear
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.waitForSelector('input[type="email"]', { state: 'visible' });

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Click user menu dropdown - find the user menu button (has avatar circle)
    const userMenuButton = page
      .locator('nav button')
      .filter({
        has: page.locator('[class*="rounded-full"]'),
      })
      .first();
    await userMenuButton.click();
    await page.waitForTimeout(500);

    // Click logout - look for text in dropdown
    await page.getByText('Cerrar Sesión').click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to register from login', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.getByText('Registrate').click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should register new user with unique email', async ({ page }) => {
    const uniqueEmail = `newuser_${Date.now()}@mlm.com`;

    await page.goto(`${baseURL}/register`);
    await page.waitForSelector('input[type="email"]', { state: 'visible' });

    // Fill form using name attributes
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'NewUser123!');
    await page.fill('input[name="confirmPassword"]', 'NewUser123!');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });
});
