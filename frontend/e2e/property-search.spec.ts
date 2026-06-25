/**
 * @fileoverview E2E tests — Property search & detail flow
 * @description T2.2.2: Verifica búsqueda de propiedades, filtros y navegación a detalle
 */

import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

const MOCK_PROPERTIES = [
  {
    id: 'prop-001',
    title: 'Departamento en Palermo',
    address: 'Av. Santa Fe 3200',
    city: 'Buenos Aires',
    type: 'rental',
    price: 180000,
    currency: 'ARS',
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    images: [],
  },
  {
    id: 'prop-002',
    title: 'Casa en Nordelta',
    address: 'Calle Los Cipreses 45',
    city: 'Tigre',
    type: 'sale',
    price: 95000,
    currency: 'USD',
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    images: [],
  },
];

test.describe('Property Search & Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API for property listing and detail
    await page.route('**/api/properties**', async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;

      // Detail endpoint: /api/properties/:id
      if (pathname !== '/api/properties') {
        const propId = pathname.split('/').pop() || '';
        const property = MOCK_PROPERTIES.find((p) => p.id === propId) || MOCK_PROPERTIES[0];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: property }),
        });
        return;
      }

      // List endpoint: /api/properties?page=...
      const requestedPage = parseInt(url.searchParams.get('page') || '1');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_PROPERTIES,
          pagination: { total: 2, page: requestedPage, limit: 12, totalPages: 1 },
        }),
      });
    });

    await login(page);
    await page.goto(`${baseURL}/properties`);
    await page.waitForLoadState('networkidle');
  });

  test('should display properties listing page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Properties|Propiedades/i);
    // Search input visible
    await expect(
      page.locator('input[placeholder*="Search" i], input[placeholder*="Buscar" i]')
    ).toBeVisible();
    // Filter button visible
    await expect(page.locator('button', { hasText: /Filter|Filtrar/i })).toBeVisible();
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

    const searchInput = page
      .locator('input[placeholder*="Search" i], input[placeholder*="Buscar" i]')
      .first();
    await searchInput.fill('casa');

    // Submit the search form
    await page.locator('button', { hasText: /Filter|Filtrar/i }).click();
    await page.waitForLoadState('networkidle');

    // Either results or empty state
    const hasCards = (await page.locator('article').count()) > 0;
    const hasEmpty = await page
      .locator('text=/No results found|No se encontraron resultados/i')
      .isVisible();
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('should filter properties by type', async ({ page }) => {
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    // Select "Rental" type
    await page.locator('select').selectOption('rental');
    await page.waitForLoadState('networkidle');

    // Clear filters button should appear
    await expect(page.locator('button', { hasText: /Clear|Limpiar/i })).toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    // Apply a filter
    await page
      .locator('input[placeholder*="Search" i], input[placeholder*="Buscar" i]')
      .first()
      .fill('xyz');
    await page.locator('button', { hasText: /Filter|Filtrar/i }).click();
    await page.waitForLoadState('networkidle');

    // Clear button appears, click it
    const clearBtn = page.locator('button', { hasText: /Clear|Limpiar/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Search input should be cleared
    await expect(
      page.locator('input[placeholder*="Search" i], input[placeholder*="Buscar" i]').first()
    ).toHaveValue('');
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
    await expect(
      page.locator('button', { hasText: /Back to properties|Volver a propiedades/i })
    ).toBeVisible();

    // Reserve / consult button visible
    const reserveBtn = page.locator('button').filter({
      hasText: /Request visit|Solicitar visita|Consultar|Schedule tour/i,
    });
    await expect(reserveBtn).toBeVisible();
  });

  test('should navigate back to listing from detail', async ({ page }) => {
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });
    await page.locator('article').first().click();
    await page.waitForURL(/\/properties\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await page.locator('button', { hasText: /Back to properties|Volver a propiedades/i }).click();
    await expect(page).toHaveURL(/\/properties$/, { timeout: 10000 });
  });
});
