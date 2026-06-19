import { test, expect } from '@playwright/test';
import { baseURL, login } from '../helpers';
import { ProductCatalogPage } from '../product-catalog/product-catalog-page';
import { CheckoutPage } from '../checkout/checkout-page';
import { OrderSuccessPage } from './order-success-page';

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
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);
      const orderSuccessPage = new OrderSuccessPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.completePurchase();
      await orderSuccessPage.verifyOrderNumberVisible();
    }
  );

  test(
    '11.3.3 - Order success page displays order status',
    { tag: ['@critical', '@e2e', '@orders', '@ORDERS-E2E-003'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);
      const orderSuccessPage = new OrderSuccessPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.completePurchase();
      await orderSuccessPage.verifyStatusVisible();
    }
  );

  test(
    '11.3.4 - Order success page displays product details',
    { tag: ['@high', '@e2e', '@orders', '@ORDERS-E2E-004'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);
      const orderSuccessPage = new OrderSuccessPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.completePurchase();
      await orderSuccessPage.verifyProductDetailsVisible();
    }
  );

  test(
    '11.3.5 - User can access specific order details via URL',
    { tag: ['@high', '@e2e', '@orders', '@ORDERS-E2E-005'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);
      const orderSuccessPage = new OrderSuccessPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.completePurchase();

      // Get order ID from current URL
      const currentUrl = page.url();
      const orderId = currentUrl.match(/\/orders\/([^/]+)\/success/)?.[1];
      expect(orderId).toBeTruthy();

      // Navigate again to same order success page
      await orderSuccessPage.goto(orderId!);
      await orderSuccessPage.verifyOrderNumberVisible();
    }
  );

  test(
    '11.3.6 - Order success page displays commission breakdown',
    { tag: ['@medium', '@e2e', '@orders', '@ORDERS-E2E-006'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);
      const orderSuccessPage = new OrderSuccessPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.completePurchase();
      await orderSuccessPage.verifyCommissionVisible();
    }
  );
});
