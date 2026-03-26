import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test(
    '11.2.1 - User selects product and navigates to checkout',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-001'] },
    async ({ page }) => {
      await page.goto(`${baseURL}/products`);
      await page.waitForLoadState('networkidle');

      const buyNowButtons = page.getByRole('button', { name: /buy now|comprar/i });
      await buyNowButtons.first().click();

      await expect(page).toHaveURL(/\/checkout\//);
      await expect(page.getByRole('heading', { name: /checkout|pedido/i })).toBeVisible();
    }
  );

  test(
    '11.2.2 - Checkout displays order summary',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-002'] },
    async ({ page }) => {
      await page.goto(`${baseURL}/products`);
      await page.waitForLoadState('networkidle');

      const buyNowButtons = page.getByRole('button', { name: /buy now|comprar/i });
      await buyNowButtons.first().click();

      await expect(page.locator('text=order summary|resumen del pedido')).toBeVisible();
    }
  );

  test(
    '11.2.3 - Checkout shows payment method selection',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-003'] },
    async ({ page }) => {
      await page.goto(`${baseURL}/products`);
      await page.waitForLoadState('networkidle');

      const buyNowButtons = page.getByRole('button', { name: /buy now|comprar/i });
      await buyNowButtons.first().click();

      await expect(page.getByText(/payment method|método de pago/i)).toBeVisible();
    }
  );

  test(
    '11.2.4 - Checkout requires terms agreement',
    { tag: ['@high', '@e2e', '@checkout', '@CHECKOUT-E2E-004'] },
    async ({ page }) => {
      await page.goto(`${baseURL}/products`);
      await page.waitForLoadState('networkidle');

      const buyNowButtons = page.getByRole('button', { name: /buy now|comprar/i });
      await buyNowButtons.first().click();

      const confirmButton = page.getByRole('button', {
        name: /confirm purchase|confirmar compra/i,
      });
      await expect(confirmButton).toBeDisabled();
    }
  );

  test(
    '11.2.5 - User completes checkout flow - select product → checkout → confirm → success',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-005'] },
    async ({ page }) => {
      await page.goto(`${baseURL}/products`);
      await page.waitForLoadState('networkidle');

      const buyNowButtons = page.getByRole('button', { name: /buy now|comprar/i });
      await buyNowButtons.first().click();

      await expect(page).toHaveURL(/\/checkout\//);

      const termsCheckbox = page.locator('input[type="checkbox"]');
      await termsCheckbox.check();

      const confirmButton = page.getByRole('button', {
        name: /confirm purchase|confirmar compra/i,
      });
      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();

      await page.waitForURL(/\/orders\/.+\/success/, { timeout: 10000 });

      await expect(page.getByText(/success|éxito|comprado/i)).toBeVisible({ timeout: 10000 });
    }
  );

  test(
    '11.2.6 - Order success page displays order details',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-006'] },
    async ({ page }) => {
      await page.goto(`${baseURL}/products`);
      await page.waitForLoadState('networkidle');

      const buyNowButtons = page.getByRole('button', { name: /buy now|comprar/i });
      await buyNowButtons.first().click();

      const termsCheckbox = page.locator('input[type="checkbox"]');
      await termsCheckbox.check();

      const confirmButton = page.getByRole('button', {
        name: /confirm purchase|confirmar compra/i,
      });
      await confirmButton.click();

      await page.waitForURL(/\/orders\/.+\/success/, { timeout: 10000 });

      await expect(page.getByText(/order number|número de pedido/i)).toBeVisible();
      await expect(page.getByText(/status|estado/i)).toBeVisible();
    }
  );

  test(
    '11.2.7 - User can continue shopping from success page',
    { tag: ['@medium', '@e2e', '@checkout', '@CHECKOUT-E2E-007'] },
    async ({ page }) => {
      await page.goto(`${baseURL}/products`);
      await page.waitForLoadState('networkidle');

      const buyNowButtons = page.getByRole('button', { name: /buy now|comprar/i });
      await buyNowButtons.first().click();

      const termsCheckbox = page.locator('input[type="checkbox"]');
      await termsCheckbox.check();

      const confirmButton = page.getByRole('button', {
        name: /confirm purchase|confirmar compra/i,
      });
      await confirmButton.click();

      await page.waitForURL(/\/orders\/.+\/success/, { timeout: 10000 });

      const continueShoppingButton = page.getByRole('button', {
        name: /continue shopping|seguir comprando/i,
      });
      await continueShoppingButton.click();

      await expect(page).toHaveURL(/\/products/);
    }
  );
});
