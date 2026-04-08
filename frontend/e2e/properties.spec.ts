/**
 * @fileoverview Properties Page E2E Tests
 * @description End-to-end tests for the /properties listing page.
 *              Covers page rendering, filters, pagination, empty/error states,
 *              and property card navigation.
 *
 *              Tests de extremo a extremo para la página /properties.
 *              Cubre renderizado, filtros, paginación, estados vacío/error
 *              y navegación desde la card de propiedad.
 *
 * @module e2e/properties
 * @author Nexo Real Development Team
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { baseURL } from './helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Auth state from globalSetup ────────────────────────────────────────────

test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

// ─── Page rendering ──────────────────────────────────────────────────────────

test.describe('PropertiesPage — Rendering', () => {
  test('renders h1 with "Propiedades" heading', async ({ page }) => {
    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Propiedades');
  });

  test('renders filters bar with search input', async ({ page }) => {
    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toBeVisible();
  });

  test('renders type filter select with "Todos los tipos" default option', async ({ page }) => {
    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    const typeSelect = page.locator('select').first();
    await expect(typeSelect).toBeVisible();
    await expect(typeSelect).toHaveValue('');
  });

  test('renders city filter input', async ({ page }) => {
    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    const cityInput = page.locator('input[placeholder*="Ciudad"]');
    await expect(cityInput).toBeVisible();
  });

  test('renders "Filtrar" submit button', async ({ page }) => {
    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    const filterBtn = page.locator('button[type="submit"]').filter({ hasText: /Filtrar/i });
    await expect(filterBtn).toBeVisible();
  });

  test('shows loading skeleton while fetching', async ({ page }) => {
    // Intercept API to delay response and capture skeleton
    await page.route('**/api/properties*', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'domcontentloaded' });

    // Skeleton divs have animate-pulse class
    const skeletons = page.locator('.animate-pulse');
    await expect(skeletons.first()).toBeVisible();
  });
});

// ─── Property cards ──────────────────────────────────────────────────────────

test.describe('PropertiesPage — Property Cards', () => {
  test('shows property grid when API returns data', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
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
          ],
          pagination: { total: 2, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });

    // Should render 2 article cards
    const cards = page.locator('article');
    await expect(cards).toHaveCount(2);
  });

  test('each card shows title, city and price', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'prop-001',
              title: 'Departamento en Palermo',
              address: 'Av. Santa Fe 3200',
              city: 'Buenos Aires',
              type: 'rental',
              price: 180000,
              currency: 'ARS',
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });

    const card = page.locator('article').first();
    await expect(card).toContainText('Departamento en Palermo');
    await expect(card).toContainText('Buenos Aires');
    await expect(card).toContainText('180.000');
  });

  test('clicking a card navigates to /properties/:id', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'prop-abc',
              title: 'Casa en Recoleta',
              address: 'Posadas 1580',
              city: 'Buenos Aires',
              type: 'sale',
              price: 250000,
              currency: 'USD',
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await page.locator('article').first().click();
    await expect(page).toHaveURL(/\/properties\/prop-abc/);
  });

  test('renders placeholder icon when property has no images', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'prop-noimg',
              title: 'Local sin imágenes',
              address: 'Corrientes 1000',
              city: 'CABA',
              type: 'management',
              price: 75000,
              currency: 'ARS',
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });

    // No <img> tag — placeholder SVG from lucide MapPin
    const img = page.locator('article img');
    await expect(img).toHaveCount(0);
  });

  test('shows social proof badge "personas vieron esto hoy"', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'prop-sp',
              title: 'Penthouse Vista al Río',
              address: 'Madero Este 800',
              city: 'Buenos Aires',
              type: 'sale',
              price: 500000,
              currency: 'USD',
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    const badge = page
      .locator('article')
      .first()
      .getByText(/personas vieron esto hoy/i);
    await expect(badge).toBeVisible();
  });

  test('shows property count in subtitle when data loads', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { total: 42, page: 1, limit: 12, totalPages: 4 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    // Subtitle below h1 shows "42 propiedades disponibles"
    await expect(
      page.locator('p').filter({ hasText: /42 propiedades disponibles/i })
    ).toBeVisible();
  });
});

// ─── Type badges ─────────────────────────────────────────────────────────────

test.describe('PropertiesPage — Type Badges', () => {
  const typeCases: Array<{ type: string; label: string }> = [
    { type: 'rental', label: 'Alquiler' },
    { type: 'sale', label: 'Venta' },
    { type: 'management', label: 'Administración' },
  ];

  for (const { type, label } of typeCases) {
    test(`renders "${label}" badge for type "${type}"`, async ({ page }) => {
      await page.route('**/api/properties*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: `prop-${type}`,
                title: `Propiedad ${label}`,
                address: 'Calle 123',
                city: 'Test City',
                type,
                price: 100000,
                currency: 'ARS',
                images: [],
              },
            ],
            pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
          }),
        });
      });

      await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
      await expect(page.locator('article').first()).toContainText(label);
    });
  }
});

// ─── Empty & Error states ─────────────────────────────────────────────────────

test.describe('PropertiesPage — States', () => {
  test('shows empty state message when API returns no properties', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await expect(page.getByText(/No se encontraron propiedades/i)).toBeVisible();
    await expect(page.getByText(/Probá ajustando los filtros/i)).toBeVisible();
  });

  test('shows error message when API fails', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await expect(page.getByText(/No se pudieron cargar las propiedades/i)).toBeVisible();
  });
});

// ─── Filters ─────────────────────────────────────────────────────────────────

test.describe('PropertiesPage — Filters', () => {
  test('type filter select contains all three options', async ({ page }) => {
    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    const typeSelect = page.locator('select').first();
    await expect(typeSelect.locator('option[value="rental"]')).toHaveText('Alquiler');
    await expect(typeSelect.locator('option[value="sale"]')).toHaveText('Venta');
    await expect(typeSelect.locator('option[value="management"]')).toHaveText('Administración');
  });

  test('selecting a type filter adds "Limpiar" button', async ({ page }) => {
    // Mock so filters are applied instantly with stable response
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });

    // Select "Alquiler" type
    await page.locator('select').first().selectOption('rental');

    // "Limpiar" button should appear (hasActiveFilters = true)
    await expect(page.getByRole('button', { name: /Limpiar/i })).toBeVisible();
  });

  test('"Limpiar" button resets filters', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });

    // Apply filter
    await page.locator('select').first().selectOption('sale');
    await expect(page.getByRole('button', { name: /Limpiar/i })).toBeVisible();

    // Clear filters
    await page.getByRole('button', { name: /Limpiar/i }).click();

    // Select resets to empty value
    await expect(page.locator('select').first()).toHaveValue('');
    // Limpiar button gone
    await expect(page.getByRole('button', { name: /Limpiar/i })).toHaveCount(0);
  });

  test('typing in search input and clicking Filtrar triggers new fetch', async ({ page }) => {
    const requests: string[] = [];

    await page.route('**/api/properties*', async (route) => {
      requests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    const initialCount = requests.length;

    // Type search text and submit
    await page.locator('input[placeholder*="Buscar"]').fill('Palermo');
    await page.locator('button[type="submit"]').click();

    // A new fetch should have been triggered
    await page.waitForTimeout(600);
    expect(requests.length).toBeGreaterThan(initialCount);
  });
});

// ─── Pagination ──────────────────────────────────────────────────────────────

test.describe('PropertiesPage — Pagination', () => {
  test('shows pagination controls when totalPages > 1', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: Array.from({ length: 12 }, (_, i) => ({
            id: `prop-${i}`,
            title: `Propiedad ${i}`,
            address: 'Calle Test',
            city: 'Test',
            type: 'rental',
            price: 100000,
            currency: 'ARS',
            images: [],
          })),
          pagination: { total: 30, page: 1, limit: 12, totalPages: 3 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Anterior/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Siguiente/i })).toBeVisible();
    await expect(page.getByText(/Página 1 de 3/i)).toBeVisible();
  });

  test('"Anterior" button is disabled on first page', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: Array.from({ length: 5 }, (_, i) => ({
            id: `p${i}`,
            title: `Prop ${i}`,
            address: 'X',
            city: 'Y',
            type: 'sale',
            price: 50000,
            currency: 'USD',
            images: [],
          })),
          pagination: { total: 15, page: 1, limit: 5, totalPages: 3 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Anterior/i })).toBeDisabled();
  });

  test('"Siguiente" button is disabled on last page', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: Array.from({ length: 3 }, (_, i) => ({
            id: `p${i}`,
            title: `Prop ${i}`,
            address: 'X',
            city: 'Y',
            type: 'sale',
            price: 50000,
            currency: 'USD',
            images: [],
          })),
          pagination: { total: 15, page: 3, limit: 5, totalPages: 3 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Siguiente/i })).toBeDisabled();
  });

  test('does not render pagination when totalPages <= 1', async ({ page }) => {
    await page.route('**/api/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'only-one',
              title: 'Única propiedad',
              address: 'Única 1',
              city: 'Solo',
              type: 'rental',
              price: 10000,
              currency: 'ARS',
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Anterior/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Siguiente/i })).toHaveCount(0);
  });
});

// ─── SEO ─────────────────────────────────────────────────────────────────────

test.describe('PropertiesPage — SEO', () => {
  test('page title is "Propiedades | Nexo Real" by default', async ({ page }) => {
    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Propiedades \| Nexo Real/i);
  });
});
