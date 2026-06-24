import { Page, expect } from '@playwright/test';
import { BasePage } from '../pages/base-page';

export class OrdersListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading() {
    return this.page.getByRole('heading', { name: /my orders|mis pedidos/i });
  }

  get table() {
    return this.page.locator('table');
  }

  get rows() {
    return this.page.locator('table tbody tr');
  }

  get statusFilter() {
    return this.page.getByLabel(/status|estado/i);
  }

  get pagination() {
    return this.page.getByRole('navigation', { name: /pagination|paginación/i });
  }

  get emptyState() {
    return this.page.getByText(/no orders|sin pedidos/i);
  }

  get errorState() {
    return this.page.getByRole('alert');
  }

  get retryButton() {
    return this.page.getByRole('button', { name: /retry|reintentar/i });
  }

  get loadingSkeleton() {
    return this.page.locator('[class*="animate-pulse"]');
  }

  async goto() {
    await super.goto('/orders');
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForTimeout(500);
  }

  async goToPage(pageNum: number) {
    await this.page.getByRole('button', { name: String(pageNum) }).click();
  }

  async clickOrderRow(index: number) {
    await this.rows.nth(index).click();
  }

  async verifyPageLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.table).toBeVisible();
  }
}
