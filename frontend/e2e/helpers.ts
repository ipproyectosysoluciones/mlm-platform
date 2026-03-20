import { Page } from '@playwright/test';

export const baseURL = 'http://localhost:5173';

export const testUser = {
  email: 'admin@mlm.com',
  password: 'admin123',
};

export const regularUser = {
  email: 'user1@mlm.com',
  password: 'user123',
};

export async function login(page: Page) {
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  const emailInput = page.getByPlaceholder(/you@example.com/i);
  const passwordInput = page.getByPlaceholder(/••••••••/i);
  const submitButton = page.getByRole('button', { name: /sign in/i });
  
  await emailInput.fill(testUser.email);
  await passwordInput.fill(testUser.password);
  await submitButton.click();
  
  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Small extra wait for React to render
  await page.waitForTimeout(500);
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.getByPlaceholder(/you@example.com/i).fill(email);
  await page.getByPlaceholder(/••••••••/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

export async function logout(page: Page) {
  const logoutButton = page.getByRole('button', { name: /logout/i }).or(page.getByText(/logout/i));
  await logoutButton.click();
  await page.waitForURL(/\/login/, { timeout: 5000 });
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}
