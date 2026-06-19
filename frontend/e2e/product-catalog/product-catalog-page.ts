import { Page, expect } from '@playwright/test';
import { BasePage } from '../pages/base-page';

export class ProductCatalogPage extends BasePage {
  get heading() {
    return this.page.getByRole('heading', { name: /product/i });
  }

  get productGrid() {
    return this.page.locator('.grid');
  }

  get platformFilterButtons() {
    return this.page.getByRole('button', {
      name: /netflix|spotify|hbo|disney|amazon/i,
    });
  }

  get allFilterButton() {
    return this.page.getByRole('button', { name: /all|todos/i }).first();
  }

  get buyNowButtons() {
    return this.page.getByRole('button', { name: /buy now|comprar/i });
  }

  get viewDetailsButtons() {
    return this.page.getByRole('button', { name: /view details|ver detalles/i });
  }

  constructor(page: Page) {
    super(page);
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
