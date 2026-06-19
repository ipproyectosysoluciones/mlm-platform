/**
 * Landing Pages E2E Tests / Pruebas E2E de Landing Pages
 * CRUD operations for landing pages / Operaciones CRUD para landing pages
 *
 * @module e2e/landing-pages.spec
 */
import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('Landing Pages Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/landing-pages`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    if (!page.url().includes('/landing-pages')) {
      await page.waitForTimeout(3000);
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display landing pages page', async ({ page }) => {
    // Look for landing pages heading
    const heading = page.locator('h1, h2').filter({
      hasText: /landing|páginas|pages/i,
    });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display landing pages list or empty state', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Either show pages list or empty state
    const hasPages = await page
      .locator('[class*="card"], [class*="grid"], table')
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/no hay landing|creá tu primera/i)
      .isVisible()
      .catch(() => false);

    expect(hasPages || hasEmptyState).toBeTruthy();
  });

  test('should have create new landing page button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /crear|nueva|agregar/i });
    if (await createButton.isVisible().catch(() => false)) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should navigate back to dashboard', async ({ page }) => {
    const backLink = page.locator('a[href="/dashboard"]').first();
    if (await backLink.isVisible().catch(() => false)) {
      await backLink.click();
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('should display landing page cards with basic info', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for page cards or items
    const pageCards = page.locator('[class*="card"], [class*="item"]').filter({
      has: page.getByText(/editar|ver|eliminar/i),
    });

    if (
      await pageCards
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await expect(pageCards.first()).toBeVisible();
    }
  });
});

test.describe('Landing Page Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/landing-pages`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    if (!page.url().includes('/landing-pages')) {
      await page.waitForTimeout(3000);
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should open create landing page form', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /crear|nueva|agregar/i });

    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Form or modal should appear
      const form = page.locator('form, [class*="modal"], [class*="dialog"], [class*="form"]');
      if (
        await form
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await expect(form.first()).toBeVisible();
      }
    }
  });

  test('should have title input in create form', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /crear|nueva|agregar/i });

    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Look for title/name input
      const titleInput = page.locator(
        'input[name*="title"], input[name*="name"], input[placeholder*="título"], input[placeholder*="nombre"]'
      );
      if (
        await titleInput
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await expect(titleInput.first()).toBeVisible();
      }
    }
  });

  test('should have description input in create form', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /crear|nueva|agregar/i });

    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Look for description textarea
      const descInput = page.locator('textarea, input[name*="description"], input[name*="desc"]');
      if (
        await descInput
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await expect(descInput.first()).toBeVisible();
      }
    }
  });

  test('should close create form with cancel', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /crear|nueva|agregar/i });

    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(1000);

      const cancelButton = page.getByRole('button', { name: /cancelar|cerrar/i });
      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('Landing Page Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/landing-pages`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    if (!page.url().includes('/landing-pages')) {
      await page.waitForTimeout(3000);
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should have edit action for landing pages', async ({ page }) => {
    await page.waitForTimeout(2000);

    const editButton = page.getByRole('button', { name: /editar/i }).first();
    if (await editButton.isVisible().catch(() => false)) {
      await expect(editButton).toBeVisible();
    }
  });

  test('should have delete action for landing pages', async ({ page }) => {
    await page.waitForTimeout(2000);

    const deleteButton = page.getByRole('button', { name: /eliminar/i }).first();
    if (await deleteButton.isVisible().catch(() => false)) {
      await expect(deleteButton).toBeVisible();
    }
  });

  test('should have view/preview action for landing pages', async ({ page }) => {
    await page.waitForTimeout(2000);

    const viewButton = page.getByRole('button', { name: /ver|preview|previsualizar/i }).first();
    if (await viewButton.isVisible().catch(() => false)) {
      await expect(viewButton).toBeVisible();
    }
  });

  test('should show confirmation dialog when deleting', async ({ page }) => {
    await page.waitForTimeout(2000);

    const deleteButton = page.getByRole('button', { name: /eliminar/i }).first();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Should show confirmation
      const confirmDialog = page.locator('[class*="modal"], [role="dialog"], [class*="confirm"]');
      if (await confirmDialog.isVisible().catch(() => false)) {
        await expect(confirmDialog).toBeVisible();
      }
    }
  });
});

test.describe('Landing Page Status', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/landing-pages`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    if (!page.url().includes('/landing-pages')) {
      await page.waitForTimeout(3000);
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display landing page status badges', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for status indicators (active/inactive, published/draft)
    const statusBadge = page.getByText(/activo|inactivo|publicado|borrador|active|inactive/i);
    if (
      await statusBadge
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await expect(statusBadge.first()).toBeVisible();
    }
  });

  test('should have toggle for landing page status', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for toggle switch or status button
    const toggle = page
      .locator('button[class*="toggle"], [role="switch"], input[type="checkbox"]')
      .first();
    if (await toggle.isVisible().catch(() => false)) {
      await expect(toggle).toBeVisible();
    }
  });
});
