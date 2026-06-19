/**
 * @fileoverview E2E tests — Property search & detail flow
 * @description T2.2.2: Verifica búsqueda de propiedades, filtros y navegación a detalle
 */

import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('Property Search & Detail', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/properties`);
    await page.waitForLoadState('networkidle');
  });

  test('should display properties listing page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Propiedades');
    // Search input visible
    await expect(
      page.locator('input[placeholder="Buscar por título o dirección..."]')
    ).toBeVisible();
    // Filter button visible
    await expect(page.locator('button', { hasText: 'Filtrar' })).toBeVisible();
  });

  test('should show property cards after load', async ({ page }) => {
    // Wait for skeleton to disappear and cards to appear
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });
    const cards = page.locator('article');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter properties by search text', async ({ page }) => {
    // Wait for cards to load first
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    const searchInput = page.locator('input[placeholder="Buscar por título o dirección..."]');
    await searchInput.fill('casa');

    // Submit the search form
    await page.locator('button', { hasText: 'Filtrar' }).click();
    await page.waitForLoadState('networkidle');

    // Either results or empty state
    const hasCards = (await page.locator('article').count()) > 0;
    const hasEmpty = await page.locator('text=No se encontraron propiedades').isVisible();
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('should filter properties by type', async ({ page }) => {
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    // Select "Alquiler" type
    await page.locator('select').selectOption('rental');
    await page.waitForLoadState('networkidle');

    // Clear filters button should appear
    await expect(page.locator('button', { hasText: 'Limpiar' })).toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    // Apply a filter
    await page.locator('input[placeholder="Buscar por título o dirección..."]').fill('xyz');
    await page.locator('button', { hasText: 'Filtrar' }).click();
    await page.waitForLoadState('networkidle');

    // Limpiar button appears, click it
    const clearBtn = page.locator('button', { hasText: 'Limpiar' });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Search input should be cleared
    await expect(page.locator('input[placeholder="Buscar por título o dirección..."]')).toHaveValue(
      ''
    );
  });

  test('should navigate to property detail on card click', async ({ page }) => {
    // Wait for at least one card
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    // Click the first property card
    await page.locator('article').first().click();

    // Should navigate to /properties/:id
    await page.waitForURL(/\/properties\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Detail page title visible
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should show property detail with back button', async ({ page }) => {
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });
    await page.locator('article').first().click();
    await page.waitForURL(/\/properties\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Back button visible
    await expect(page.locator('button', { hasText: 'Volver a propiedades' })).toBeVisible();

    // Reserve / consult button visible
    const reserveBtn = page.locator('button').filter({
      hasText: /Solicitar visita|Consultar/,
    });
    await expect(reserveBtn).toBeVisible();
  });

  test('should navigate back to listing from detail', async ({ page }) => {
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });
    await page.locator('article').first().click();
    await page.waitForURL(/\/properties\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await page.locator('button', { hasText: 'Volver a propiedades' }).click();
    await expect(page).toHaveURL(/\/properties$/, { timeout: 10000 });
  });
});
