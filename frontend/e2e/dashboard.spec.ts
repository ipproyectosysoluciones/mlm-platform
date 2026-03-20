import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard with stats', async ({ page }) => {
    await expect(page.getByText(/Total Referrals/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Total Earnings/i)).toBeVisible();
    await expect(page.getByText(/Pending/i)).toBeVisible();
  });

  test('should display binary tree section', async ({ page }) => {
    await expect(page.getByText(/Binary Tree/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Left Leg/i)).toBeVisible();
    await expect(page.getByText(/Right Leg/i)).toBeVisible();
    await expect(page.getByText(/View Full Tree/i)).toBeVisible();
  });

  test('should display referral link', async ({ page }) => {
    await expect(page.getByText(/Your Referral Link/i)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[readonly]')).toBeVisible();
  });

  test('should navigate to tree view', async ({ page }) => {
    await page.getByText(/View Full Tree/i).click();
    await expect(page).toHaveURL(/\/tree/);
    await expect(page.getByText(/Binary Tree/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to profile', async ({ page }) => {
    await page.getByText(/Profile/i).first().click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should display user email in nav', async ({ page }) => {
    await expect(page.getByText(/admin@mlm.com/i)).toBeVisible();
  });

  test('should show QR code button', async ({ page }) => {
    await expect(page.getByText(/Show QR Code/i)).toBeVisible({ timeout: 10000 });
  });

  test('should toggle QR code visibility', async ({ page }) => {
    await page.getByText(/Show QR Code/i).click();
    await expect(page.getByText(/Hide QR Code/i)).toBeVisible();
  });
});
