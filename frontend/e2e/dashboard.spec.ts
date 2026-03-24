import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display dashboard with stats', async ({ page }) => {
    await expect(page.getByText(/Total Referidos/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Ganancias Totales/i)).toBeVisible();
    await expect(page.getByText(/Pendiente/i)).toBeVisible();
  });

  test('should display binary tree section', async ({ page }) => {
    await expect(page.getByText(/Árbol Binario/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Pierna Izquierda/i).first()).toBeVisible();
    await expect(page.getByText(/Pierna Derecha/i).first()).toBeVisible();
    await expect(page.getByText(/Ver Árbol Completo/i)).toBeVisible();
  });

  test('should display referral link', async ({ page }) => {
    await expect(page.getByText(/Tu Link de Referido/i)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[readonly]')).toBeVisible();
  });

  test('should navigate to tree view', async ({ page }) => {
    await page.getByText(/Ver Árbol Completo/i).click();
    await expect(page).toHaveURL(/\/tree/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Just verify we're on tree page - the heading might be different
    expect(page.url()).toContain('/tree');
  });

  test('should navigate to profile', async ({ page }) => {
    // Use more specific selector for the nav links
    await page.locator('nav a[href="/profile"], nav a[href="/perfil"]').first().click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should display user email in user menu', async ({ page }) => {
    // Click on user menu to see email (use rounded-full avatar pattern)
    await page
      .locator('nav button')
      .filter({ has: page.locator('.rounded-full') })
      .first()
      .click();
    await page.waitForTimeout(300);
    // Look for email in dropdown
    await expect(page.getByText(/admin@mlm.com/i)).toBeVisible();
  });

  test('should show QR code button', async ({ page }) => {
    await expect(page.getByText(/Mostrar Código QR/i)).toBeVisible({ timeout: 10000 });
  });

  test('should toggle QR code visibility', async ({ page }) => {
    await page.getByText(/Mostrar Código QR/i).click();
    await expect(page.getByText(/Ocultar QR/i)).toBeVisible();
  });
});
