import { Page, expect } from '@playwright/test';
import { BasePage } from '../pages/base-page';

export class OrderDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading() {
    return this.page.getByRole('heading', { name: /order detail|detalle del pedido/i });
  }

  get orderNumber() {
    return this.page.getByText(/ORD-/);
  }

  get statusBadge() {
    return this.page.locator('[class*="rounded-full"]').first();
  }

  get orderSummary() {
    return this.page.getByText(/order summary|resumen/i);
  }

  get backLink() {
    return this.page.getByRole('link', { name: /back to orders|volver/i });
  }

  async goto(id: string) {
    await super.goto(`/orders/${id}`);
  }

  async verifyLoaded() {
    await expect(this.heading).toBeVisible();
  }
}
