import { Page, expect } from '@playwright/test';
import { BasePage } from '../pages/base-page';

export class OrderSuccessPage extends BasePage {
  get heading() {
    return this.page.getByRole('heading', { name: /success|éxito|comprado/i });
  }

  get orderNumberText() {
    return this.page.getByText(/order number|número de pedido/i);
  }

  get statusText() {
    return this.page.getByText(/status|estado/i);
  }

  get productDetailsSection() {
    return this.page.locator('.grid > div').first();
  }

  get commissionSection() {
    return this.page.getByText(/commission|comisión/i);
  }

  get continueShoppingButton() {
    return this.page.getByRole('button', {
      name: /continue shopping|seguir comprando/i,
    });
  }

  constructor(page: Page) {
    super(page);
  }

  async goto(orderId: string): Promise<void> {
    await super.goto(`/orders/${orderId}/success`);
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async verifyOrderNumberVisible(): Promise<void> {
    await expect(this.orderNumberText).toBeVisible();
  }

  async verifyStatusVisible(): Promise<void> {
    await expect(this.statusText).toBeVisible();
  }

  async verifyProductDetailsVisible(): Promise<void> {
    await expect(this.productDetailsSection).toBeVisible();
  }

  async verifyCommissionVisible(): Promise<void> {
    await expect(this.commissionSection).toBeVisible();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async getOrderNumber(): Promise<string> {
    // Extract order number from the page - assuming format "Order Number: XXXXX"
    const text = await this.orderNumberText.textContent();
    const match = text?.match(/:\s*([A-Z0-9]+)/);
    return match ? match[1] : '';
  }
}
