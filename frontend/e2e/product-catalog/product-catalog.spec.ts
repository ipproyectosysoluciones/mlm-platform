import { test, expect } from '@playwright/test';
import { login } from '../helpers';
import { ProductCatalogPage } from './product-catalog-page';

test.describe('Product Catalog', () => {
  let productCatalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await login(page);
    productCatalogPage = new ProductCatalogPage(page);
    await productCatalogPage.goto();
  });

  test(
    '11.1.1 - User browses product catalog',
    { tag: ['@critical', '@e2e', '@products', '@PRODUCTS-E2E-001'] },
    async () => {
      await productCatalogPage.verifyPageLoaded();
    }
  );

  test(
    '11.1.2 - User filters products by Netflix platform',
    { tag: ['@critical', '@e2e', '@products', '@PRODUCTS-E2E-002'] },
    async () => {
      await productCatalogPage.filterByPlatform('netflix');
      await productCatalogPage.verifyPlatformFilterActive('netflix');
    }
  );

  test(
    '11.1.3 - User filters products by Spotify platform',
    { tag: ['@high', '@e2e', '@products', '@PRODUCTS-E2E-003'] },
    async () => {
      await productCatalogPage.filterByPlatform('spotify');
      await productCatalogPage.verifyPlatformFilterActive('spotify');
    }
  );

  test(
    '11.1.4 - User clears platform filter',
    { tag: ['@medium', '@e2e', '@products', '@PRODUCTS-E2E-004'] },
    async () => {
      await productCatalogPage.filterByPlatform('netflix');
      await productCatalogPage.clearFilter();
    }
  );

  test(
    '11.1.5 - User views product details via Buy Now button',
    { tag: ['@critical', '@e2e', '@products', '@PRODUCTS-E2E-005'] },
    async ({ page }) => {
      await productCatalogPage.clickFirstBuyNow();
      await expect(page).toHaveURL(/\/checkout\//);
    }
  );

  test(
    '11.1.6 - User views product details via View Details button',
    { tag: ['@high', '@e2e', '@products', '@PRODUCTS-E2E-006'] },
    async ({ page }) => {
      await productCatalogPage.clickFirstViewDetails();
      await expect(page).toHaveURL(/\/checkout\//);
    }
  );
});
