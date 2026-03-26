import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForNotification(): Promise<void> {
    await this.page.waitForSelector('[role="status"]');
  }

  async verifyNotificationMessage(message: string): Promise<void> {
    const notification = this.page.locator('[role="status"]');
    await expect(notification).toContainText(message);
  }

  async waitForPageReady(timeout = 3000): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(timeout);
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
  }

  // Common selectors
  get heading(): Locator {
    return this.page.getByRole('heading');
  }

  // Utility to get button by name (supports multiple languages)
  getButton(name: string | RegExp): Locator {
    return this.page.getByRole('button', { name });
  }

  // Utility to get link by name
  getLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name });
  }

  // Utility to get input by label
  getInput(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }
}
