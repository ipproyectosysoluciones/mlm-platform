import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../pages/base-page';

export class ProductCatalogPage extends BasePage {
  readonly heading: Locator;
  readonly productGrid: Locator;
  readonly platformFilterButtons: Locator;
  readonly allFilterButton: Locator;
  readonly buyNowButtons: Locator;
  readonly viewDetailsButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /product/i });
    this.productGrid = page.locator('.grid');
    this.platformFilterButtons = page.getByRole('button', {
      name: /netflix|spotify|hbo|disney|amazon/i,
    });
    this.allFilterButton = page.getByRole('button', { name: /all|todos/i }).first();
    this.buyNowButtons = page.getByRole('button', { name: /buy now|comprar/i });
    this.viewDetailsButtons = page.getByRole('button', { name: /view details|ver detalles/i });
  }

  async goto(): Promise<void> {
    await super.goto('/products');
  }

  async filterByPlatform(platform: string): Promise<void> {
    const button = this.page.getByRole('button', { name: new RegExp(platform, 'i') });
    await button.click();
    await this.page.waitForTimeout(1000); // wait for filter to apply
  }

  async clearFilter(): Promise<void> {
    await this.allFilterButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickFirstBuyNow(): Promise<void> {
    const firstButton = this.buyNowButtons.first();
    await expect(firstButton).toBeVisible();
    await firstButton.click();
  }

  async clickFirstViewDetails(): Promise<void> {
    const firstButton = this.viewDetailsButtons.first();
    await expect(firstButton).toBeVisible();
    await firstButton.click();
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.productGrid).toBeVisible();
  }

  async verifyPlatformFilterActive(platform: string): Promise<void> {
    const button = this.page.getByRole('button', { name: new RegExp(platform, 'i') });
    await expect(button).toHaveClass(/bg-purple-600/);
  }
}
