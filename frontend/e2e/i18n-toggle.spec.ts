/**
 * @fileoverview E2E tests — i18n language toggle
 * @description T2.2.4: Verifica el selector de idioma ES/EN en la navbar
 */

import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('i18n Language Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Start on a page with the navbar (dashboard)
    await page.waitForLoadState('networkidle');
  });

  test('should show the language selector button in navbar', async ({ page }) => {
    // Globe icon button with language code
    const langBtn = page.locator('nav button').filter({ hasText: /ES|EN/i }).first();
    await expect(langBtn).toBeVisible({ timeout: 10000 });
  });

  test('should open language dropdown on click', async ({ page }) => {
    const langBtn = page.locator('nav button').filter({ hasText: /ES|EN/i }).first();
    await langBtn.click();

    // Dropdown with language options should appear
    const dropdown = page.locator('button').filter({ hasText: /Español|English/i });
    await expect(dropdown.first()).toBeVisible({ timeout: 5000 });
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    const langBtn = page.locator('nav button').filter({ hasText: /ES|EN/i }).first();
    await langBtn.click();

    // Dropdown is open
    await expect(
      page
        .locator('button')
        .filter({ hasText: /Español|English/i })
        .first()
    ).toBeVisible();

    // Click outside (on the overlay that LanguageSelector renders)
    await page.locator('.fixed.inset-0').click({ force: true });

    // Dropdown should close
    await expect(
      page
        .locator('button')
        .filter({ hasText: /Español|English/i })
        .first()
    ).not.toBeVisible({ timeout: 3000 });
  });

  test('should switch to English', async ({ page }) => {
    const langBtn = page.locator('nav button').filter({ hasText: /ES|EN/i }).first();
    await langBtn.click();

    // Click English option
    const englishBtn = page
      .locator('button')
      .filter({ hasText: /English/i })
      .first();
    await expect(englishBtn).toBeVisible({ timeout: 5000 });
    await englishBtn.click();

    // Dropdown should close
    await expect(
      page
        .locator('button')
        .filter({ hasText: /English/i })
        .first()
    ).not.toBeVisible({ timeout: 3000 });

    // Button should now show EN
    await expect(page.locator('nav button').filter({ hasText: /EN/i }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should switch back to Spanish', async ({ page }) => {
    // Switch to English first
    const langBtn = page.locator('nav button').filter({ hasText: /ES|EN/i }).first();
    await langBtn.click();

    const englishBtn = page
      .locator('button')
      .filter({ hasText: /English/i })
      .first();
    await expect(englishBtn).toBeVisible({ timeout: 5000 });
    await englishBtn.click();
    await page.waitForTimeout(500);

    // Now switch back to Spanish
    const langBtn2 = page.locator('nav button').filter({ hasText: /EN/i }).first();
    await langBtn2.click();

    const espanolBtn = page
      .locator('button')
      .filter({ hasText: /Español/i })
      .first();
    await expect(espanolBtn).toBeVisible({ timeout: 5000 });
    await espanolBtn.click();

    // Button should show ES
    await expect(page.locator('nav button').filter({ hasText: /ES/i }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should persist language selection on navigation', async ({ page }) => {
    // Switch to English
    const langBtn = page.locator('nav button').filter({ hasText: /ES|EN/i }).first();
    await langBtn.click();

    const englishBtn = page
      .locator('button')
      .filter({ hasText: /English/i })
      .first();
    await expect(englishBtn).toBeVisible({ timeout: 5000 });
    await englishBtn.click();
    await page.waitForTimeout(500);

    // Navigate to another page
    await page.goto(`${baseURL}/properties`);
    await page.waitForLoadState('networkidle');

    // Language should still be EN (persisted in localStorage/i18n)
    const langBtnAfterNav = page.locator('nav button').filter({ hasText: /EN/i }).first();
    await expect(langBtnAfterNav).toBeVisible({ timeout: 10000 });
  });
});
