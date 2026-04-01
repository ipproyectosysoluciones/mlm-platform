import { test, expect } from '@playwright/test';

test('Landing page loads correctly', async ({ page }) => {
  // Go to the landing page
  await page.goto('https://mlm-platform.vercel.app/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot
  await page.screenshot({ path: 'landing-page.png', fullPage: true });

  // Get page title
  const title = await page.title();
  console.log('Page title:', title);

  // Get page content
  const content = await page.textContent('body');
  console.log('Page content (first 500 chars):', content?.substring(0, 500));

  // Check if we see login form or landing page
  const hasLogin = await page.locator('input[type="email"]').count();
  const hasLanding = await page.locator('h1:has-text("Stream")').count();

  console.log('Has login form:', hasLogin > 0);
  console.log('Has landing heading:', hasLanding > 0);

  // Get current URL
  console.log('Current URL:', page.url());
});

test('Check what component renders', async ({ page }) => {
  await page.goto('https://mlm-platform.vercel.app/');
  await page.waitForLoadState('networkidle');

  // Check for specific elements
  const elements = {
    'Login form': await page.locator('form').count(),
    'Email input': await page.locator('input[type="email"]').count(),
    'Password input': await page.locator('input[type="password"]').count(),
    'H1 heading': await page.locator('h1').count(),
    Navbar: await page.locator('nav').count(),
    'Main content': await page.locator('main').count(),
  };

  console.log('Elements found:');
  for (const [name, count] of Object.entries(elements)) {
    console.log(`  ${name}: ${count}`);
  }

  // Get all h1 texts
  const h1Texts = await page.locator('h1').allTextContents();
  console.log('H1 texts:', h1Texts);
});
