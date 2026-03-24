const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Go to login page
  await page.goto('http://localhost:5173/login');

  // Login
  await page.fill('input[type="email"]', 'admin@mlm.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/dashboard.png', fullPage: true });

  console.log('Screenshot saved to /tmp/dashboard.png');

  // Check for chart dimensions
  const charts = await page.$$('.recharts-wrapper');
  console.log(`Found ${charts.length} charts`);

  for (let i = 0; i < charts.length; i++) {
    const box = await charts[i].boundingBox();
    console.log(`Chart ${i + 1}: width=${box.width}, height=${box.height}`);
  }

  await browser.close();
})();
