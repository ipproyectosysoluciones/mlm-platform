import { test, expect, Page } from '@playwright/test';
import { baseURL, testUser } from './helpers';

test.describe('Auth Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    await page.getByPlaceholder(/you@example.com/i).fill(testUser.email);
    await page.getByPlaceholder(/••••••••/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/mlm dashboard/i)).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    await page.getByPlaceholder(/you@example.com/i).fill('invalid@mlm.com');
    await page.getByPlaceholder(/••••••••/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page.getByText(/login failed/i)).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    await page.getByPlaceholder(/you@example.com/i).fill(testUser.email);
    await page.getByPlaceholder(/••••••••/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto(`${baseURL}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to register from login', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.getByText(/sign up/i).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should register new user with unique email', async ({ page }) => {
    const uniqueEmail = `newuser_${Date.now()}@mlm.com`;
    
    await page.goto(`${baseURL}/register`);
    
    await page.getByPlaceholder(/you@example.com/i).fill(uniqueEmail);
    await page.getByPlaceholder(/min 6 characters/i).fill('NewUser123!');
    await page.getByPlaceholder(/confirm password/i).fill('NewUser123!');
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/mlm dashboard/i)).toBeVisible();
  });
});
