import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('Product Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/products`);
    await page.waitForLoadState('networkidle');
  });

  test(
    '11.1.1 - User browses product catalog',
    { tag: ['@critical', '@e2e', '@products', '@PRODUCTS-E2E-001'] },
    async ({ page }) => {
      await expect(page.getByRole('heading', { name: /product/i })).toBeVisible();
      await expect(page.locator('.grid')).toBeVisible();
    }
  );

  test(
    '11.1.2 - User filters products by Netflix platform',
    { tag: ['@critical', '@e2e', '@products', '@PRODUCTS-E2E-002'] },
    async ({ page }) => {
      const netflixButton = page.getByRole('button', { name: /netflix/i });
      await netflixButton.click();
      await page.waitForTimeout(1000);
      await expect(netflixButton).toHaveClass(/bg-purple-600/);
    }
  );

  test(
    '11.1.3 - User filters products by Spotify platform',
    { tag: ['@high', '@e2e', '@products', '@PRODUCTS-E2E-003'] },
    async ({ page }) => {
      const spotifyButton = page.getByRole('button', { name: /spotify/i });
      await spotifyButton.click();
      await page.waitForTimeout(1000);
      await expect(spotifyButton).toHaveClass(/bg-purple-600/);
    }
  );

  test(
    '11.1.4 - User clears platform filter',
    { tag: ['@medium', '@e2e', '@products', '@PRODUCTS-E2E-004'] },
    async ({ page }) => {
      await page.getByRole('button', { name: /netflix/i }).click();
      await page.waitForTimeout(500);
      const allButton = page.getByRole('button', { name: /all|todos/i }).first();
      await allButton.click();
      await page.waitForTimeout(500);
    }
  );

  test(
    '11.1.5 - User views product details via Buy Now button',
    { tag: ['@critical', '@e2e', '@products', '@PRODUCTS-E2E-005'] },
    async ({ page }) => {
      const buyNowButtons = page.getByRole('button', { name: /buy now|comprar/i });
      const firstButton = buyNowButtons.first();
      await expect(firstButton).toBeVisible();
      await firstButton.click();
      await expect(page).toHaveURL(/\/checkout\//);
    }
  );

  test(
    '11.1.6 - User views product details via View Details button',
    { tag: ['@high', '@e2e', '@products', '@PRODUCTS-E2E-006'] },
    async ({ page }) => {
      const viewDetailsButtons = page.getByRole('button', { name: /view details|ver detalles/i });
      const firstButton = viewDetailsButtons.first();
      await expect(firstButton).toBeVisible();
      await firstButton.click();
      await expect(page).toHaveURL(/\/checkout\//);
    }
  );
});
