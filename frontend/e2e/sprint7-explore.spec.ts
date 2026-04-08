/**
 * @fileoverview Sprint 7 — Visual Exploration Script
 * @description Captures screenshots of all key routes to analyze current state
 *              before writing Phase 2 unit/integration tests.
 *              Captura pantallazos de todas las rutas clave para analizar el estado actual
 *              antes de escribir los tests de Phase 2.
 * @module e2e/sprint7-explore
 */
import { test, expect, type BrowserContext } from '@playwright/test';
import { baseURL } from './helpers';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOT = (name: string) => `e2e/screenshots/sprint7-explore/${name}.png` as const;

/** Loads the authenticated storage state saved by globalSetup / Carga el storage state autenticado guardado por globalSetup */
async function useAuthState(context: BrowserContext) {
  await context.storageState(); // ensure fresh
  // Storage state is applied via project config — this is a no-op placeholder
  // El storage state se aplica vía config del proyecto — este es un placeholder sin operación
}

// ─── Public routes (no auth) ───────────────────────────────────────────────

test.describe('Public Routes', () => {
  test('landing — hero + properties + tours', async ({ page }) => {
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: SHOT('01-landing-full'), fullPage: true });

    // Hero section visible
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('landing — mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: SHOT('02-landing-mobile-375'), fullPage: true });
  });

  test('landing — tablet 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: SHOT('03-landing-tablet-768'), fullPage: true });
  });

  test('login page', async ({ page }) => {
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SHOT('04-login'), fullPage: true });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('register page', async ({ page }) => {
    await page.goto(`${baseURL}/register`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SHOT('05-register'), fullPage: true });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

// ─── Authenticated routes — use storageState from globalSetup ─────────────

test.describe('Authenticated Routes', () => {
  test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

  test('dashboard', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: SHOT('06-dashboard'), fullPage: true });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navbar — desktop', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SHOT('07-navbar-desktop'), fullPage: false });
  });

  test('navbar — mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SHOT('08-navbar-mobile'), fullPage: false });
  });

  test('properties listing (/properties)', async ({ page }) => {
    await page.goto(`${baseURL}/properties`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SHOT('09-properties-list'), fullPage: true });
  });

  test('tours listing (/tours)', async ({ page }) => {
    await page.goto(`${baseURL}/tours`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SHOT('10-tours-list'), fullPage: true });
  });

  test('wallet', async ({ page }) => {
    await page.goto(`${baseURL}/wallet`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SHOT('11-wallet'), fullPage: true });
  });

  test('tree view', async ({ page }) => {
    await page.goto(`${baseURL}/tree`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SHOT('12-tree'), fullPage: true });
  });

  test('profile', async ({ page }) => {
    await page.goto(`${baseURL}/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SHOT('13-profile'), fullPage: true });
  });

  test('leaderboard', async ({ page }) => {
    await page.goto(`${baseURL}/leaderboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SHOT('14-leaderboard'), fullPage: true });
  });

  test('achievements', async ({ page }) => {
    await page.goto(`${baseURL}/achievements`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SHOT('15-achievements'), fullPage: true });
  });

  test('404 — unknown route', async ({ page }) => {
    await page.goto(`${baseURL}/ruta-que-no-existe`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SHOT('16-404'), fullPage: true });
  });
});

// ─── New Sprint 7 components — responsive spot-check ─────────────────────

test.describe('Sprint 7 New Components', () => {
  test('PropertyCard grid vs list — landing', async ({ page }) => {
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Scroll to featured properties section
    const section = page.getByText(/propiedades destacadas|featured properties/i).first();
    if (await section.isVisible().catch(() => false)) {
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: SHOT('17-property-cards-landing'), fullPage: false });
  });

  test('TourCard grid vs list — landing', async ({ page }) => {
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Scroll to featured tours section
    const section = page.getByText(/tours destacados|featured tours/i).first();
    if (await section.isVisible().catch(() => false)) {
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: SHOT('18-tour-cards-landing'), fullPage: false });
  });

  test('landing CTA section', async ({ page }) => {
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Scroll to bottom (CTA + footer)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: SHOT('19-landing-cta-footer'), fullPage: false });
  });

  test('landing CTA buttons — mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Hero CTA buttons responsive check
    await page.screenshot({ path: SHOT('20-landing-hero-mobile'), fullPage: false });
  });
});
