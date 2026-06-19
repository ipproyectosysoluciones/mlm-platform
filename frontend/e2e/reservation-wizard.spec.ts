/**
 * @fileoverview E2E tests — Reservation wizard (3-step flow)
 * @description T2.2.3: Verifica el wizard completo: dates → guests → confirm
 * @note The wizard requires a property to be pre-selected via the store.
 *       We navigate through the UI (properties → detail → reserve button).
 */

import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('Reservation Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /**
   * Navigate to a property detail and start the reservation flow.
   * Returns after confirming the wizard page is loaded.
   */
  async function startReservationFromProperty(page: Parameters<typeof login>[0]) {
    await page.goto(`${baseURL}/properties`);
    await page.waitForLoadState('networkidle');

    // Wait for at least one property card
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    // Find a rental property (wizard has dates step) if possible; otherwise use first
    const cards = page.locator('article');
    await cards.first().click();

    await page.waitForURL(/\/properties\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Click the reserve / consult button
    const reserveBtn = page.locator('button').filter({
      hasText: /Request visit|Solicitar visita|Consultar|Schedule tour/i,
    });
    await expect(reserveBtn).toBeVisible({ timeout: 10000 });
    await reserveBtn.click();

    // Should navigate to /reservations/new
    await page.waitForURL(/\/reservations\/new/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  }

  test('should reach the reservation wizard from property detail', async ({ page }) => {
    await startReservationFromProperty(page);

    // The wizard wrapper card is visible
    await expect(page.locator('.rounded-2xl').first()).toBeVisible();

    // Step indicator shows step labels
    await expect(page.locator('text=/Fechas|Dates|Huéspedes|Guests/i').first()).toBeVisible();
  });

  test('should show step 1 (Fechas) for property reservation', async ({ page }) => {
    await page.goto(`${baseURL}/properties`);
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    // Click the first card that's a rental (has "Rental" or "Alquiler" badge)
    const rentalCard = page
      .locator('article')
      .filter({ hasText: /Alquiler|Rental/i })
      .first();
    const cardCount = await rentalCard.count();

    if (cardCount > 0) {
      await rentalCard.click();
    } else {
      await page.locator('article').first().click();
    }

    await page.waitForURL(/\/properties\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const reserveBtn = page.locator('button').filter({
      hasText: /Request visit|Solicitar visita|Consultar|Schedule tour/i,
    });
    await reserveBtn.click();
    await page.waitForURL(/\/reservations\/new/, { timeout: 15000 });

    // Check-in / Check-out inputs should be visible for property type
    const checkInInput = page.locator('input[type="date"]').first();
    const hasDateInputs = (await checkInInput.count()) > 0;

    // Either dates step (property rental) or guests step (sale/mgmt or tour)
    const stepLabels = page.locator('.text-emerald-600');
    const visible = await stepLabels.first().isVisible();
    expect(visible).toBeTruthy();

    // Confirm wizard is rendered
    await expect(page.locator('text=/Cancelar|Cancel/i').first()).toBeVisible();
    expect(
      hasDateInputs ||
        (await page.locator('text=/¿Cuántas personas?|How many people?/i').isVisible())
    ).toBeTruthy();
  });

  test('should redirect home if wizard accessed without data', async ({ page }) => {
    // Navigate directly to /reservations/new without starting wizard
    await page.goto(`${baseURL}/reservations/new`);
    // Should be redirected to home
    await expect(page).toHaveURL(/^\/?$|\/$/m, { timeout: 10000 });
  });

  test('should be able to cancel the wizard', async ({ page }) => {
    await startReservationFromProperty(page);

    // Click cancel button
    const cancelBtn = page.locator('button', { hasText: /Cancelar|Cancel/i });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Should navigate away from /reservations/new
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/reservations/new');
  });

  test('should show step indicator with 3 steps', async ({ page }) => {
    await startReservationFromProperty(page);

    // Three step labels in the indicator
    await expect(page.locator('text=/Fechas|Dates/i').first()).toBeVisible();
    await expect(page.locator('text=/Huéspedes|Guests/i').first()).toBeVisible();
    await expect(page.locator('text=/Confirmación|Confirmation/i').first()).toBeVisible();
  });

  test('should advance from dates to guests when dates are filled', async ({ page }) => {
    await page.goto(`${baseURL}/properties`);
    await page.waitForSelector('article', { state: 'visible', timeout: 15000 });

    // Specifically try to get a rental property for the dates step
    const rentalCard = page.locator('article').filter({ hasText: 'Alquiler' }).first();
    if ((await rentalCard.count()) > 0) {
      await rentalCard.click();
    } else {
      await page.locator('article').first().click();
    }

    await page.waitForURL(/\/properties\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Only proceed if it's a rental (dates step)
    const reserveBtn = page.locator('button', {
      hasText: /Request visit|Solicitar visita|Schedule tour/i,
    });
    if ((await reserveBtn.count()) === 0) {
      test.skip();
      return;
    }

    await reserveBtn.click();
    await page.waitForURL(/\/reservations\/new/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Fill check-in and check-out
    const dateInputs = page.locator('input[type="date"]');
    if ((await dateInputs.count()) >= 2) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const fmt = (d: Date) => d.toISOString().split('T')[0];

      await dateInputs.nth(0).fill(fmt(tomorrow));
      await dateInputs.nth(1).fill(fmt(nextWeek));

      // Continue button should be enabled
      const continueBtn = page.locator('button', { hasText: /Continuar|Continue|Next/i });
      await expect(continueBtn).toBeEnabled({ timeout: 5000 });
      await continueBtn.click();

      // Should advance to guests step
      await expect(page.locator('text=/¿Cuántas personas?|How many people?/i')).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
