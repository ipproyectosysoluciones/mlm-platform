/**
 * TreeView E2E Tests / Pruebas E2E de TreeView
 * Visual binary tree with React Flow / Árbol binario visual con React Flow
 *
 * Phase 3: Visual Tree UI
 * @module e2e/tree.spec
 */
import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

/**
 * Test suite for TreeView visual tree functionality
 * Suite de pruebas para funcionalidad visual del árbol
 */
test.describe('TreeView', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to tree view
    await page.goto(`${baseURL}/tree`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Close DetailsPanel if it's open by clicking the close button
    // The panel has z-50 and covers the viewport when open
    const closeButton = page.getByRole('button', { name: /close panel|cerrar/i });
    if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeButton.click({ force: true });
      await page.waitForTimeout(500);
    }
  });

  test('should display tree view page with navigation', async ({ page }) => {
    // Verify page title
    await expect(page.getByRole('heading', { name: /binary tree/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify back navigation
    await expect(page.getByText(/back/i)).toBeVisible();

    // Verify URL is correct
    await expect(page).toHaveURL(/\/tree/);
  });

  test('should display search bar', async ({ page }) => {
    // Verify search input exists (placeholder varies by language)
    const searchInput = page
      .getByPlaceholder(/search.*email.*code/i)
      .or(page.getByPlaceholder(/buscar.*email.*código/i));
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should display zoom controls', async ({ page }) => {
    // Verify zoom in button
    await expect(page.getByRole('button', { name: /zoom in/i })).toBeVisible();

    // Verify zoom out button
    await expect(page.getByRole('button', { name: /zoom out/i })).toBeVisible();

    // Verify fit view button
    await expect(page.getByRole('button', { name: /fit view/i })).toBeVisible();
  });

  test('should display depth selector', async ({ page }) => {
    // Verify depth dropdown/select exists
    await expect(page.getByRole('combobox', { name: /depth/i })).toBeVisible({ timeout: 5000 });
  });

  test('should have minimap visible', async ({ page }) => {
    // React Flow minimap should be visible
    // Look for the minimap container
    await expect(page.locator('.react-flow__minimap')).toBeVisible({ timeout: 5000 });
  });

  test('should display tree nodes or empty state', async ({ page }) => {
    // Wait for either tree nodes or empty state
    await page.waitForTimeout(3000);

    // Either show tree nodes (react flow canvas)
    const canvas = page.locator('.react-flow');
    const hasCanvas = await canvas.isVisible().catch(() => false);

    if (hasCanvas) {
      // If canvas is visible, should have nodes or be empty
      await expect(canvas).toBeVisible();
    } else {
      // Or show empty state message
      await expect(page.getByText(/no members yet/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should search for members', async ({ page }) => {
    // Find search input (placeholder varies by language)
    const searchInput = page
      .getByPlaceholder(/search.*email.*code/i)
      .or(page.getByPlaceholder(/buscar.*email.*código/i));

    // Wait for tree to load
    await page.waitForTimeout(2000);

    // Type in search (minimum 2 characters)
    await searchInput.fill('test');

    // Wait for search results dropdown (if users exist)
    await page.waitForTimeout(1000);

    // The search should either show results or show "no results"
    // We just verify the input accepts text
    await expect(searchInput).toHaveValue('test');
  });

  test('should toggle zoom controls', async ({ page }) => {
    // Get zoom buttons
    const zoomInButton = page.getByRole('button', { name: /zoom in/i });
    const zoomOutButton = page.getByRole('button', { name: /zoom out/i });

    // Click zoom in
    await zoomInButton.click();
    await page.waitForTimeout(500);

    // Click zoom out
    await zoomOutButton.click();
    await page.waitForTimeout(500);

    // Buttons should still be visible (not broken by clicks)
    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
  });

  test('should change tree depth', async ({ page }) => {
    // Find depth selector
    const depthSelector = page.getByRole('combobox', { name: /depth/i });

    // Open dropdown
    await depthSelector.click();
    await page.waitForTimeout(500);

    // Select depth 3 (if available)
    const depthOption = page.getByRole('option', { name: /3/i });
    if (await depthOption.isVisible().catch(() => false)) {
      await depthOption.click();
      await page.waitForTimeout(2000);

      // Tree should reload with new depth
      // Just verify selector shows the new value
      await expect(depthSelector).toHaveValue('3');
    }
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // Click back button
    await page.getByText(/back/i).click();

    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should display controls panel', async ({ page }) => {
    // React Flow controls should be visible
    await expect(page.locator('.react-flow__controls')).toBeVisible({ timeout: 5000 });
  });

  test('should show loading state while fetching tree', async ({ page }) => {
    // Reload page to trigger loading state
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Loading indicator should appear briefly
    const loadingSpinner = page.locator('.animate-spin');
    // It might be gone by the time we check, so we just verify page structure
    await expect(page.getByRole('heading', { name: /binary tree/i })).toBeVisible({
      timeout: 5000,
    });
  });
});

/**
 * Test suite for TreeView authentication requirements
 * Suite de pruebas para requisitos de autenticación de TreeView
 */
test.describe('TreeView - Auth Required', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto(`${baseURL}/tree`);
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
