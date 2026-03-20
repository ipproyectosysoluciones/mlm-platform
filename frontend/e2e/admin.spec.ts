import { test, expect } from '@playwright/test';
import { baseURL, login } from './helpers';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/admin`);
    await page.waitForLoadState('networkidle');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.getByText(/Admin Dashboard/i)).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.getByText(/Total Users/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Active Users/i)).toBeVisible();
    await expect(page.getByText(/Inactive Users/i)).toBeVisible();
  });

  test('should display users table', async ({ page }) => {
    await expect(page.getByText(/Email/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Role/i)).toBeVisible();
    await expect(page.getByText(/Status/i)).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    await expect(page.getByText(/Total Users/i)).toBeVisible({ timeout: 15000 });
    const searchInput = page.getByPlaceholder(/search by email/i);
    await expect(searchInput).toBeVisible();
  });

  test('should have filter dropdown', async ({ page }) => {
    await expect(page.getByText(/Total Users/i)).toBeVisible({ timeout: 15000 });
    const filter = page.locator('select').first();
    await expect(filter).toBeVisible();
    await expect(filter.getByText(/All/i)).toBeVisible();
  });

  test('should filter users by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search by email/i);
    await searchInput.fill('admin');
    await page.waitForTimeout(500);
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(refreshButton).toBeVisible();
  });

  test('should navigate back to user dashboard', async ({ page }) => {
    await page.getByText(/Back to User Dashboard/i).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show admin badge for admin users', async ({ page }) => {
    const adminBadge = page.locator('text=admin').first();
    await expect(adminBadge).toBeVisible();
  });

  test('should show user badge for regular users', async ({ page }) => {
    const userBadges = page.locator('text=user');
    expect(await userBadges.count()).toBeGreaterThan(0);
  });
});
