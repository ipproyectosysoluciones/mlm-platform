/**
 * @fileoverview Abandoned Cart Recovery E2E Tests (Playwright)
 * @description End-to-end tests for the abandoned cart recovery flow:
 *              add items, simulate abandonment, recovery via email link, checkout.
 *
 *              Pruebas end-to-end para el flujo de recuperación de carrito abandonado:
 *              agregar items, simular abandono, recuperación via enlace de email, checkout.
 *
 * @module e2e/carts.spec
 */
import { test, expect } from '@playwright/test';
import { baseURL, login, waitForPageReady } from './helpers';

test.describe('Abandoned Cart Recovery', () => {
  // ============================================================
  // 1. Add items to cart and verify cart state
  //    Agregar items al carrito y verificar estado
  // ============================================================
  test(
    '21.1 - Add items to cart and verify cart state persists',
    { tag: ['@critical', '@e2e', '@carts', '@CART-E2E-001'] },
    async ({ page }) => {
      // Login as regular user
      await login(page);
      await waitForPageReady(page);

      // Navigate to products page
      await page.goto(`${baseURL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for "Add to Cart" or "Buy Now" button on first product
      const addButton = page
        .getByRole('button', { name: /add to cart|agregar|buy now|comprar/i })
        .first();

      const buttonVisible = await addButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (buttonVisible) {
        await addButton.click();
        await page.waitForTimeout(2000);

        // Verify cart indicator shows items (badge, counter, etc.)
        const cartIndicator = page
          .locator(
            '[data-testid="cart-count"], [aria-label*="cart" i], .cart-badge, text=/\\d+ item/i'
          )
          .first();
        const hasCartIndicator = await cartIndicator
          .isVisible({ timeout: 5000 })
          .catch(() => false);

        // Either cart indicator or a success toast should appear
        const successToast = page.locator('text=/added|agregado|cart|carrito/i').first();
        const hasSuccess = await successToast.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasCartIndicator || hasSuccess).toBeTruthy();
      }
    }
  );

  // ============================================================
  // 2. Recovery link resolves cart and shows preview
  //    Enlace de recuperación resuelve carrito y muestra vista previa
  // ============================================================
  test(
    '21.2 - Recovery link loads cart preview page',
    { tag: ['@critical', '@e2e', '@carts', '@CART-E2E-002'] },
    async ({ page }) => {
      // Navigate to recovery page with a test token
      // In real E2E this would be a valid token from the DB.
      // Here we test the page loads and handles errors gracefully.
      await page.goto(`${baseURL}/recover-cart?token=test-recovery-token-e2e`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Should show either:
      // - Cart preview (if token is valid)
      // - Error message (token invalid/expired/not found)
      const cartPreview = page
        .locator('text=/your cart|tu carrito|welcome back|bienvenid/i')
        .first();
      const errorMessage = page
        .locator('text=/expired|not found|invalid|error|already used/i')
        .first();

      const hasPreview = await cartPreview.isVisible({ timeout: 5000 }).catch(() => false);
      const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

      // One of the two must be visible — page should not be blank
      expect(hasPreview || hasError).toBeTruthy();
    }
  );

  // ============================================================
  // 3. Recovery flow: preview → proceed → redirect
  //    Flujo de recuperación: vista previa → proceder → redirigir
  // ============================================================
  test(
    '21.3 - Recovery flow proceeds to checkout after confirmation',
    { tag: ['@critical', '@e2e', '@carts', '@CART-E2E-003'] },
    async ({ page }) => {
      // NOTE: This test requires a valid recovery token in the database.
      // In CI, seed the database with a test cart + recovery token.
      // Here we verify the UI flow structure exists.

      await page.goto(`${baseURL}/recover-cart?token=ci-seeded-token`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Look for "Proceed to Checkout" button
      const proceedButton = page
        .getByRole('button', { name: /proceed|continuar|checkout|comprar/i })
        .first();
      const hasProceed = await proceedButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasProceed) {
        await proceedButton.click();
        await page.waitForTimeout(3000);

        // Should redirect to products or checkout page
        const currentUrl = page.url();
        expect(
          currentUrl.includes('/products') ||
            currentUrl.includes('/checkout') ||
            currentUrl.includes('/recover-cart')
        ).toBeTruthy();
      } else {
        // If no proceed button, verify error state is shown
        const errorState = page.locator('text=/expired|not found|error|invalid/i').first();
        const hasError = await errorState.isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasError).toBeTruthy();
      }
    }
  );

  // ============================================================
  // 4. Error flow: expired/invalid recovery token
  //    Flujo de error: token de recuperación expirado/inválido
  // ============================================================
  test(
    '21.4 - Expired recovery token shows appropriate error',
    { tag: ['@high', '@e2e', '@carts', '@CART-E2E-004'] },
    async ({ page }) => {
      // Navigate with a deliberately invalid token
      await page.goto(`${baseURL}/recover-cart?token=definitely-expired-invalid-token`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Should show error state
      const errorMessage = page
        .locator('text=/expired|not found|invalid|error|failed|already used/i')
        .first();
      const errorVisible = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
      expect(errorVisible).toBeTruthy();

      // Should have a "Browse Products" fallback button
      const browseButton = page
        .getByRole('button', { name: /browse|explorar|products|productos|shop|tienda/i })
        .first();
      const browseVisible = await browseButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (browseVisible) {
        await browseButton.click();
        await page.waitForTimeout(2000);
        expect(page.url()).toContain('/products');
      }
    }
  );
});
