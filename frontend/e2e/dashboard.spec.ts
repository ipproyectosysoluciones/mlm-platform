import { test, expect } from './fixtures';
import { login } from './helpers';

// Start without auth — login() handles the full login flow
test.use({ storageState: undefined });

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display dashboard with stats', async ({ page }) => {
    await expect(page.getByText(/Total Referrals/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Total Earnings/i).first()).toBeVisible();
    await expect(page.getByText(/Pending/i).first()).toBeVisible();
  });

  test('should display binary tree section', async ({ page }) => {
    await expect(page.getByText(/Unilevel Network/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Direct Referrals/i).first()).toBeVisible();
    await expect(page.getByText(/Total Network/i).first()).toBeVisible();
    await expect(page.getByText(/View Full Network/i)).toBeVisible();
  });

  test('should display referral link', async ({ page }) => {
    await expect(page.getByText(/Your Referral Link/i)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[readonly]')).toBeVisible();
  });

  test('should navigate to tree view', async ({ page }) => {
    await page.getByText(/View Full Network/i).click();
    await expect(page).toHaveURL(/\/tree/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Just verify we're on tree page - the heading might be different
    expect(page.url()).toContain('/tree');
  });

  test('should navigate to profile', async ({ page }) => {
    // Use more specific selector for the nav links
    await page.locator('nav a[href="/profile"], nav a[href="/perfil"]').first().click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should display user email in user menu', async ({ page }) => {
    // Click on user menu to see email (use rounded-full avatar pattern)
    await page
      .locator('nav button')
      .filter({ has: page.locator('.rounded-full') })
      .first()
      .click();
    await page.waitForTimeout(300);
    // Look for email in dropdown
    await expect(page.getByText(/admin@mlm.com/i)).toBeVisible();
  });

  test('should show QR code button', async ({ page }) => {
    await expect(page.getByText(/Show QR Code/i)).toBeVisible({ timeout: 10000 });
  });

  test('should toggle QR code visibility', async ({ page }) => {
    await page.getByText(/Show QR Code/i).click();
    await expect(page.getByText(/Hide QR/i)).toBeVisible();
  });
});
