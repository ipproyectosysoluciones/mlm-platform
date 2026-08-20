/**
 * @fileoverview Tours Page E2E Tests
 * @description End-to-end tests for the /tours listing page.
 *              Covers page rendering, filters, pagination, empty/error states,
 *              category badges, and tour card navigation.
 *
 *              Tests de extremo a extremo para la página /tours.
 *              Cubre renderizado, filtros, paginación, estados vacío/error,
 *              badges de categoría y navegación desde la card de tour.
 *
 * @module e2e/tours
 * @author Nexo Real Development Team
 */

import { test, expect } from './fixtures';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { baseURL } from './helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Auth state from globalSetup ────────────────────────────────────────────

test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

// ─── Page rendering ──────────────────────────────────────────────────────────

test.describe('ToursPage — Rendering', () => {
  test('renders h1 with "Paquetes de Turismo" heading', async ({ page }) => {
    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText(/Tour Packages|Paquetes de Turismo/i);
  });

  test('renders search input with correct placeholder', async ({ page }) => {
    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    const searchInput = page.locator(
      'input[placeholder*="Search" i], input[placeholder*="Buscar" i]'
    );
    await expect(searchInput).toBeVisible();
  });

  test('renders category filter select with default option', async ({ page }) => {
    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible();
    await expect(categorySelect).toHaveValue('');
  });

  test('renders destination filter input', async ({ page }) => {
    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    const destInput = page.locator(
      'input[placeholder*="Destino" i], input[placeholder*="Destination" i]'
    );
    await expect(destInput).toBeVisible();
  });

  test('renders filter submit button', async ({ page }) => {
    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    const filterBtn = page.locator('button[type="submit"]').filter({ hasText: /Filter|Filtrar/i });
    await expect(filterBtn).toBeVisible();
  });

  test('shows loading skeleton while fetching', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'domcontentloaded' });

    const skeletons = page.locator('.animate-pulse');
    await expect(skeletons.first()).toBeVisible();
  });
});

// ─── Tour cards ───────────────────────────────────────────────────────────────

test.describe('ToursPage — Tour Cards', () => {
  test('shows tour grid when API returns data', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'tour-001',
              title: 'Trekking en Patagonia',
              destination: 'El Chaltén, Santa Cruz',
              category: 'adventure',
              price: 85000,
              currency: 'ARS',
              durationDays: 7,
              maxCapacity: 12,
              images: [],
            },
            {
              id: 'tour-002',
              title: 'Bodega & Vino en Mendoza',
              destination: 'Luján de Cuyo, Mendoza',
              category: 'gastronomic',
              price: 45000,
              currency: 'ARS',
              durationDays: 3,
              maxCapacity: 8,
              images: [],
            },
          ],
          pagination: { total: 2, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });

    const cards = page.locator('article');
    await expect(cards).toHaveCount(2);
  });

  test('each card shows title, destination and price', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'tour-001',
              title: 'Trekking en Patagonia',
              destination: 'El Chaltén, Santa Cruz',
              category: 'adventure',
              price: 85000,
              currency: 'ARS',
              durationDays: 7,
              maxCapacity: 12,
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });

    const card = page.locator('article').first();
    await expect(card).toContainText('Trekking en Patagonia');
    await expect(card).toContainText('El Chaltén, Santa Cruz');
    await expect(card).toContainText('85.000');
  });

  test('each card shows duration in days', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'tour-dur',
              title: 'Tour Corto',
              destination: 'Iguazú',
              category: 'ecotourism',
              price: 30000,
              currency: 'ARS',
              durationDays: 3,
              maxCapacity: 20,
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(page.locator('article').first()).toContainText(/3 días|3 days/i);
  });

  test('each card shows max guests with "Hasta" prefix', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'tour-gu',
              title: 'Tour Privado',
              destination: 'Colonia del Sacramento',
              category: 'luxury',
              price: 200000,
              currency: 'ARS',
              durationDays: 2,
              maxCapacity: 6,
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(page.locator('article').first()).toContainText(/Hasta 6|Up to 6/i);
  });

  test('clicking a card navigates to /tours/:id', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'tour-xyz',
              title: 'Safari Fotográfico',
              destination: 'Iberá, Corrientes',
              category: 'ecotourism',
              price: 55000,
              currency: 'ARS',
              durationDays: 4,
              maxCapacity: 10,
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await page.locator('article').first().click();
    await expect(page).toHaveURL(/\/tours\/tour-xyz/);
  });

  test('renders placeholder icon when tour has no images', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'tour-noimg',
              title: 'Tour sin imágenes',
              destination: 'Mar del Plata',
              category: 'relaxation',
              price: 25000,
              currency: 'ARS',
              durationDays: 2,
              maxCapacity: 15,
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });

    // No <img> tag — placeholder SVG from lucide Compass
    const img = page.locator('article img');
    await expect(img).toHaveCount(0);
  });

  test('shows social proof badge "personas vieron esto hoy"', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'tour-sp',
              title: 'Tour Social Proof',
              destination: 'Bariloche',
              category: 'adventure',
              price: 60000,
              currency: 'ARS',
              durationDays: 5,
              maxCapacity: 12,
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    const badge = page
      .locator('article')
      .first()
      .getByText(/personas vieron esto hoy|people viewed this today/i);
    await expect(badge).toBeVisible();
  });

  test('shows tour count in subtitle when data loads', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { total: 18, page: 1, limit: 12, totalPages: 2 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(
      page.locator('p').filter({ hasText: /18 experiencias disponibles|18 experiences available/i })
    ).toBeVisible();
  });

  test('shows "/ persona" suffix in price', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'tour-pp',
              title: 'Tour por persona',
              destination: 'Rosario',
              category: 'cultural',
              price: 15000,
              currency: 'ARS',
              durationDays: 1,
              maxCapacity: 30,
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(page.locator('article').first()).toContainText(/\/ persona|\/ person/i);
  });
});

// ─── Category badges ──────────────────────────────────────────────────────────

test.describe('ToursPage — Category Badges', () => {
  const categoryCases: Array<{ category: string; label: string; enLabel: string }> = [
    { category: 'adventure', label: 'Aventura', enLabel: 'Adventure' },
    { category: 'cultural', label: 'Cultural', enLabel: 'Cultural' },
    { category: 'relaxation', label: 'Relax', enLabel: 'Relax' },
    { category: 'gastronomic', label: 'Gastronómico', enLabel: 'Gastronomic' },
    { category: 'ecotourism', label: 'Ecoturismo', enLabel: 'Ecotourism' },
    { category: 'luxury', label: 'Lujo', enLabel: 'Luxury' },
  ];

  for (const { category, label, enLabel } of categoryCases) {
    test(`renders "${label}" badge for category "${category}"`, async ({ page }) => {
      await page.route('**/api/tours*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: `tour-${category}`,
                title: `Tour ${label}`,
                destination: 'Test Destino',
                category,
                price: 40000,
                currency: 'ARS',
                durationDays: 2,
                maxCapacity: 10,
                images: [],
              },
            ],
            pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
          }),
        });
      });

      await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
      await expect(page.locator('article').first()).toContainText(
        new RegExp(`${label}|${enLabel}`, 'i')
      );
    });
  }
});

// ─── Empty & Error states ─────────────────────────────────────────────────────

test.describe('ToursPage — States', () => {
  test('shows empty state message when API returns no tours', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
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

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', {
        level: 3,
        name: /No results found|No se encontraron resultados/i,
      })
    ).toBeVisible();
  });

  test('shows error message when API fails', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(
      page.getByText(/Could not load tours|No se pudieron cargar los tours/i)
    ).toBeVisible();
  });
});

// ─── Filters ─────────────────────────────────────────────────────────────────

test.describe('ToursPage — Filters', () => {
  test('category select contains all six options', async ({ page }) => {
    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    const catSelect = page.locator('select').first();

    await expect(catSelect.locator('option[value="adventure"]')).toContainText(
      /Aventura|Adventure/i
    );
    await expect(catSelect.locator('option[value="cultural"]')).toContainText(/Cultural/i);
    await expect(catSelect.locator('option[value="relaxation"]')).toContainText(/Relax/i);
    await expect(catSelect.locator('option[value="gastronomic"]')).toContainText(
      /Gastronómico|Gastronomic/i
    );
    await expect(catSelect.locator('option[value="ecotourism"]')).toContainText(
      /Ecoturismo|Ecotourism/i
    );
    await expect(catSelect.locator('option[value="luxury"]')).toContainText(/Lujo|Luxury/i);
  });

  test('selecting a category adds clear button', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
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

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });

    await page.locator('select').first().selectOption('adventure');

    await expect(page.getByRole('button', { name: /Clear|Limpiar/i })).toBeVisible();
  });

  test('clear button resets all filters', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
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

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });

    // Apply a filter
    await page.locator('select').first().selectOption('luxury');
    await expect(page.getByRole('button', { name: /Clear|Limpiar/i })).toBeVisible();

    // Clear it
    await page.getByRole('button', { name: /Clear|Limpiar/i }).click();

    await expect(page.locator('select').first()).toHaveValue('');
    await expect(page.getByRole('button', { name: /Clear|Limpiar/i })).toHaveCount(0);
  });

  test('typing in search and submitting triggers new fetch', async ({ page }) => {
    const requests: string[] = [];

    await page.route('**/api/tours*', async (route) => {
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

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    const initialCount = requests.length;

    await page
      .locator('input[placeholder*="Search" i], input[placeholder*="Buscar" i]')
      .first()
      .fill('Bariloche');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(600);
    expect(requests.length).toBeGreaterThan(initialCount);
  });
});

// ─── Pagination ──────────────────────────────────────────────────────────────

test.describe('ToursPage — Pagination', () => {
  test('shows pagination controls when totalPages > 1', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: Array.from({ length: 12 }, (_, i) => ({
            id: `t${i}`,
            title: `Tour ${i}`,
            destination: 'Dest',
            category: 'cultural',
            price: 20000,
            currency: 'ARS',
            durationDays: 2,
            maxCapacity: 10,
            images: [],
          })),
          pagination: { total: 36, page: 1, limit: 12, totalPages: 3 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Previous|Anterior/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Next|Siguiente/i })).toBeVisible();
    await expect(page.getByText(/Page 1 of 3|Página 1 de 3/i)).toBeVisible();
  });

  test('"Anterior" is disabled on first page', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: Array.from({ length: 5 }, (_, i) => ({
            id: `t${i}`,
            title: `Tour ${i}`,
            destination: 'D',
            category: 'adventure',
            price: 10000,
            currency: 'ARS',
            durationDays: 1,
            maxCapacity: 5,
            images: [],
          })),
          pagination: { total: 10, page: 1, limit: 5, totalPages: 2 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Previous|Anterior/i })).toBeDisabled();
  });

  test('"Siguiente" is disabled on last page', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: Array.from({ length: 5 }, (_, i) => ({
            id: `t${i}`,
            title: `Tour ${i}`,
            destination: 'D',
            category: 'adventure',
            price: 10000,
            currency: 'ARS',
            durationDays: 1,
            maxCapacity: 5,
            images: [],
          })),
          pagination: { total: 10, page: 2, limit: 5, totalPages: 2 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });

    // Advance to the last page (the component only disables "Siguiente"
    // when its internal page state reaches totalPages)
    await page.getByRole('button', { name: /Next|Siguiente/i }).click();

    await expect(page.getByRole('button', { name: /Next|Siguiente/i })).toBeDisabled();
  });

  test('no pagination when totalPages <= 1', async ({ page }) => {
    await page.route('**/api/tours*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'only',
              title: 'Único Tour',
              destination: 'Único Destino',
              category: 'relaxation',
              price: 12000,
              currency: 'ARS',
              durationDays: 1,
              maxCapacity: 4,
              images: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        }),
      });
    });

    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Previous|Anterior/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Next|Siguiente/i })).toHaveCount(0);
  });
});

// ─── SEO ─────────────────────────────────────────────────────────────────────

test.describe('ToursPage — SEO', () => {
  test('page title is "Paquetes de Turismo | Nexo Real" by default', async ({ page }) => {
    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Tour Packages|Paquetes de Turismo/i);
  });
});
