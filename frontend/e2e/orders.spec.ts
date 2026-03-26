import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('Order History & Details', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test(
    '11.3.1 - LIMITATION: No /orders route exists',
    { tag: ['@e2e', '@orders', '@ORDERS-E2E-001'] },
    async ({ page }) => {
      const response = await page.goto(`${baseURL}/orders`);
      expect(response?.status()).toBe(404);
    }
  );

  test(
    '11.3.2 - Order success page displays order number',
    { tag: ['@critical', '@e2e', '@orders', '@ORDERS-E2E-002'] },
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

      const orderNumberElement = page.getByText(/order number|número de pedido/i);
      await expect(orderNumberElement).toBeVisible();
    }
  );

  test(
    '11.3.3 - Order success page displays order status',
    { tag: ['@critical', '@e2e', '@orders', '@ORDERS-E2E-003'] },
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

      const statusElement = page.getByText(/status|estado/i);
      await expect(statusElement).toBeVisible();
    }
  );

  test(
    '11.3.4 - Order success page displays product details',
    { tag: ['@high', '@e2e', '@orders', '@ORDERS-E2E-004'] },
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

      const orderSummary = page.locator('.grid > div').first();
      await expect(orderSummary).toBeVisible();
    }
  );

  test(
    '11.3.5 - User can access specific order details via URL',
    { tag: ['@high', '@e2e', '@orders', '@ORDERS-E2E-005'] },
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

      const currentUrl = page.url();
      const orderId = currentUrl.match(/\/orders\/([^/]+)\/success/)?.[1];

      await page.goto(`${baseURL}/orders/${orderId}/success`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/order number|número de pedido/i)).toBeVisible();
    }
  );

  test(
    '11.3.6 - Order success page displays commission breakdown',
    { tag: ['@medium', '@e2e', '@orders', '@ORDERS-E2E-006'] },
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

      const commissionSection = page.getByText(/commission|comisión/i);
      await expect(commissionSection).toBeVisible();
    }
  );
});
