import { test, expect } from '@playwright/test';

test('debug login with exact credentials', async ({ page }) => {
  // Capturar logs de consola
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.log('PAGE ERROR:', err.message);
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');

  console.log('Filling form...');
  await page.fill('input[type="email"]', 'admin@mlm.com');
  await page.fill('input[type="password"]', 'admin123');

  console.log('Submitting...');
  await page.click('button[type="submit"]');

  // Esperar para ver resultado
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());

  // Tomar screenshot
  await page.screenshot({ path: '/tmp/login-debug.png', fullPage: true });

  // Verificar URL
  await expect(page).toHaveURL(/\/dashboard/);
});
