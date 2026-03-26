import { test, expect } from '@playwright/test';
import { baseURL, login } from '../helpers';
import { ProductCatalogPage } from '../product-catalog/product-catalog-page';
import { CheckoutPage } from './checkout-page';
import { OrderSuccessPage } from '../order-success/order-success-page';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test(
    '11.2.1 - User selects product and navigates to checkout',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-001'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();

      await expect(page).toHaveURL(/\/checkout\//);
      await checkoutPage.verifyPageLoaded();
    }
  );

  test(
    '11.2.2 - Checkout displays order summary',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-002'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.verifyOrderSummaryVisible();
    }
  );

  test(
    '11.2.3 - Checkout shows payment method selection',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-003'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.verifyPaymentMethodVisible();
    }
  );

  test(
    '11.2.4 - Checkout requires terms agreement',
    { tag: ['@high', '@e2e', '@checkout', '@CHECKOUT-E2E-004'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.verifyConfirmButtonDisabled();
    }
  );

  test(
    '11.2.5 - User completes checkout flow - select product → checkout → confirm → success',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-005'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);
      const orderSuccessPage = new OrderSuccessPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.verifyPageLoaded();
      await checkoutPage.completePurchase();
      await orderSuccessPage.verifyPageLoaded();
    }
  );

  test(
    '11.2.6 - Order success page displays order details',
    { tag: ['@critical', '@e2e', '@checkout', '@CHECKOUT-E2E-006'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);
      const orderSuccessPage = new OrderSuccessPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.completePurchase();
      await orderSuccessPage.verifyOrderNumberVisible();
      await orderSuccessPage.verifyStatusVisible();
    }
  );

  test(
    '11.2.7 - User can continue shopping from success page',
    { tag: ['@medium', '@e2e', '@checkout', '@CHECKOUT-E2E-007'] },
    async ({ page }) => {
      const productCatalogPage = new ProductCatalogPage(page);
      const checkoutPage = new CheckoutPage(page);
      const orderSuccessPage = new OrderSuccessPage(page);

      await productCatalogPage.goto();
      await productCatalogPage.clickFirstBuyNow();
      await checkoutPage.completePurchase();
      await orderSuccessPage.continueShopping();
      await expect(page).toHaveURL(/\/products/);
    }
  );
});
