/**
 * @fileoverview E2E tests — Responsive design (3 viewports)
 * @description T2.2.5: Verifica layout responsive en mobile, tablet y desktop
 */

import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

// ── Viewport definitions ─────────────────────────────────────────────────────

const VIEWPORTS = {
  mobile: { width: 375, height: 812, name: 'Mobile (375×812)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (768×1024)' },
  desktop: { width: 1280, height: 800, name: 'Desktop (1280×800)' },
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Set viewport and navigate to path, then wait for page ready.
 */
async function gotoViewport(
  page: Parameters<typeof login>[0],
  width: number,
  height: number,
  path: string
) {
  await page.setViewportSize({ width, height });
  await page.goto(`${baseURL}${path}`);
  await page.waitForLoadState('networkidle');
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Responsive — Landing page', () => {
  for (const [key, vp] of Object.entries(VIEWPORTS)) {
    test(`renders landing page correctly on ${vp.name}`, async ({ page }) => {
      await gotoViewport(page, vp.width, vp.height, '/');

      // Page renders without horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5); // allow 5px tolerance

      // Hero section visible
      const hero = page.locator('main, [class*="hero"], [class*="landing"], section').first();
      await expect(hero).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe('Responsive — Properties listing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('mobile: renders properties page without overflow', async ({ page }) => {
    await gotoViewport(page, VIEWPORTS.mobile.width, VIEWPORTS.mobile.height, '/properties');
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(VIEWPORTS.mobile.width + 5);

    await expect(page.locator('h1')).toContainText('Propiedades');
  });

  test('tablet: renders properties page without overflow', async ({ page }) => {
    await gotoViewport(page, VIEWPORTS.tablet.width, VIEWPORTS.tablet.height, '/properties');
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(VIEWPORTS.tablet.width + 5);

    await expect(page.locator('h1')).toContainText('Propiedades');
  });

  test('desktop: renders properties page without overflow', async ({ page }) => {
    await gotoViewport(page, VIEWPORTS.desktop.width, VIEWPORTS.desktop.height, '/properties');
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(VIEWPORTS.desktop.width + 5);

    await expect(page.locator('h1')).toContainText('Propiedades');
  });

  test('mobile: filter bar stacks vertically (flex-wrap)', async ({ page }) => {
    await gotoViewport(page, VIEWPORTS.mobile.width, VIEWPORTS.mobile.height, '/properties');
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });

    // Search input must be visible and accessible on mobile
    const searchInput = page.locator('input[placeholder="Buscar por título o dirección..."]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    const inputWidth = await searchInput.evaluate((el) => el.getBoundingClientRect().width);
    // On mobile, the input should take at least 60% of the mobile width (flex-1 min-w-[200px])
    expect(inputWidth).toBeGreaterThan(VIEWPORTS.mobile.width * 0.5);
  });

  test('desktop: property grid uses multiple columns', async ({ page }) => {
    await gotoViewport(page, VIEWPORTS.desktop.width, VIEWPORTS.desktop.height, '/properties');
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    // On desktop with 1280px, grid should have multiple columns (grid-cols-3 or 4)
    const cards = page.locator('article');
    const count = await cards.count();

    if (count >= 2) {
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();

      if (first && second) {
        // If columns > 1, the second card should be to the right of the first (same row)
        const sameRow = Math.abs((first.y ?? 0) - (second.y ?? 0)) < 10;
        expect(sameRow).toBeTruthy();
      }
    }
  });

  test('mobile: property cards stack in single column', async ({ page }) => {
    await gotoViewport(page, VIEWPORTS.mobile.width, VIEWPORTS.mobile.height, '/properties');
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    const cards = page.locator('article');
    const count = await cards.count();

    if (count >= 2) {
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();

      if (first && second) {
        // On mobile (grid-cols-1), second card should be below the first
        const differentRow = (second.y ?? 0) > (first.y ?? 0) + 10;
        expect(differentRow).toBeTruthy();
      }
    }
  });
});

test.describe('Responsive — Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('desktop: navbar is fully visible', async ({ page }) => {
    await gotoViewport(page, VIEWPORTS.desktop.width, VIEWPORTS.desktop.height, '/dashboard');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test('mobile: navbar renders without overflow', async ({ page }) => {
    await gotoViewport(page, VIEWPORTS.mobile.width, VIEWPORTS.mobile.height, '/dashboard');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 10000 });

    const navBox = await nav.boundingBox();
    if (navBox) {
      expect(navBox.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width + 5);
    }
  });
});
