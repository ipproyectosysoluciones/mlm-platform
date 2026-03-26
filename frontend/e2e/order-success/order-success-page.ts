import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../pages/base-page';

export class OrderSuccessPage extends BasePage {
  readonly heading: Locator;
  readonly orderNumberText: Locator;
  readonly statusText: Locator;
  readonly productDetailsSection: Locator;
  readonly commissionSection: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /success|éxito|comprado/i });
    this.orderNumberText = page.getByText(/order number|número de pedido/i);
    this.statusText = page.getByText(/status|estado/i);
    this.productDetailsSection = page.locator('.grid > div').first();
    this.commissionSection = page.getByText(/commission|comisión/i);
    this.continueShoppingButton = page.getByRole('button', {
      name: /continue shopping|seguir comprando/i,
    });
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
