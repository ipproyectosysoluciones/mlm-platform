import { Page, expect } from '@playwright/test';
import { BasePage } from '../pages/base-page';

export class CheckoutPage extends BasePage {
  get heading() {
    return this.page.getByRole('heading', { name: /checkout|pedido/i });
  }

  get orderSummarySection() {
    return this.page.getByText(/order summary|resumen del pedido/i);
  }

  get paymentMethodSection() {
    return this.page.getByRole('heading', { name: /payment method|método de pago/i });
  }

  get termsCheckbox() {
    return this.page.locator('input[type="checkbox"]');
  }

  get confirmButton() {
    return this.page.getByRole('button', { name: /confirm purchase|confirmar compra/i });
  }

  get continueShoppingButton() {
    return this.page.getByRole('button', {
      name: /continue shopping|seguir comprando/i,
    });
  }

  constructor(page: Page) {
    super(page);
  }

  async goto(productId: string): Promise<void> {
    await super.goto(`/checkout/${productId}`);
  }

  async selectSimulatedPayment(): Promise<void> {
    // The simulated radio button is `sr-only`; click the label instead
    await this.page.getByText(/simulated|simulado/i).click();
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async verifyOrderSummaryVisible(): Promise<void> {
    await expect(this.orderSummarySection).toBeVisible();
  }

  async verifyPaymentMethodVisible(): Promise<void> {
    await expect(this.paymentMethodSection).toBeVisible();
  }

  async acceptTerms(): Promise<void> {
    await this.termsCheckbox.check();
  }

  async confirmPurchase(): Promise<void> {
    await this.confirmButton.click();
  }

  async completePurchase(): Promise<void> {
    await this.selectSimulatedPayment();
    await this.acceptTerms();
    // First click: form's "Confirm Purchase" button → opens confirmation modal
    await this.confirmButton.click();
    // Second click: modal's "Confirm Purchase" button (last matching button)
    // eslint-disable-next-line playwright/no-force-option
    await this.confirmButton.last().click();
    await this.page.waitForURL(/\/orders\/.+\/success/, { timeout: 10000 });
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async verifyConfirmButtonDisabled(): Promise<void> {
    await expect(this.confirmButton).toBeDisabled();
  }

  async verifyConfirmButtonEnabled(): Promise<void> {
    await expect(this.confirmButton).toBeEnabled();
  }
}
