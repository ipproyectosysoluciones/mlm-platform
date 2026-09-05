/**
 * Wallet E2E Tests / Pruebas E2E de Wallet Digital
 * Wallet balance, transactions, and withdrawal flow
 *
 * @module e2e/wallet.spec
 */
import { test, expect } from './fixtures';
import { baseURL } from './helpers';

test.describe('Wallet Digital', () => {
  test.beforeEach(async ({ page }) => {
    // NOTE: intentionally do NOT call login() here. login() installs an
    // addInitScript that strips the auth token on every full page navigation
    // (see helpers.ts), which breaks the page.goto('/wallet') and
    // page.goto('/dashboard') calls below: ProtectedRoute would lose
    // isAuthenticated, redirect to /login, and WalletPage would never mount —
    // so balance/transactions never fetch and the content assertions fail.
    // Auth state is already present via the `page` fixture's storageState
    // (e2e/.auth/admin.json, injected by global-setup) and the mock API is
    // auto-applied by the same `page` fixture in fixtures.ts.
    await page.goto(`${baseURL}/dashboard`);
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');
  });

  test('should display wallet card on dashboard', async ({ page }) => {
    // Wait for wallet card to load (may show loading state first)
    await page.waitForTimeout(1500);

    // Check for wallet balance text on dashboard card
    // cryptoWallet flag makes /wallet appear BOTH in nav AND as a dashboard
    // card, so a bare `a[href="/wallet"]` locator is ambiguous (strict-mode
    // violation). Scope to the dashboard card, which carries the balance text.
    const walletCard = page
      .locator('a[href="/wallet"]')
      .filter({ has: page.locator('text=/Wallet Balance|Saldo de Wallet|wallet\\.balance/i') })
      .first();
    await expect(walletCard).toBeVisible({ timeout: 10000 });

    // Verify it shows wallet balance label
    await expect(page.getByText(/Wallet Balance|Saldo de Wallet/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to wallet page', async ({ page }) => {
    // Click on wallet card in dashboard
    // cryptoWallet flag renders /wallet BOTH as a nav link and as a dashboard
    // card; scope to the card (carries the balance text) to avoid the strict-mode
    // ambiguity that a bare `a[href="/wallet"]` locator would hit.
    const walletLink = page
      .locator('a[href="/wallet"]')
      .filter({ has: page.locator('text=/Wallet Balance|Saldo de Wallet|wallet\\.balance/i') })
      .first();
    await walletLink.click();

    // Wait for navigation and page load
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Verify we're on wallet page (check URL)
    await expect(page).toHaveURL(/\/wallet/);
  });

  test('should display wallet balance on wallet page', async ({ page }) => {
    // Navigate to wallet page
    await page.goto(`${baseURL}/wallet`);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Check for balance display (may show $0.00 if no wallet yet)
    const balanceLocator = page.locator('text=/\\$[\\d,]+\\.?\\d*/').first();
    await expect(balanceLocator).toBeVisible({ timeout: 5000 });

    // Just verify page loaded - balance depends on user data
    await expect(page.getByText(/Balance|Saldo/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display transaction history section', async ({ page }) => {
    await page.goto(`${baseURL}/wallet`);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Check for transaction/transactions text
    const transactionText = page.locator('text=/Transacciones|Transactions/i').first();
    await expect(transactionText).toBeVisible({ timeout: 5000 });
  });

  test('should display withdrawal form section', async ({ page }) => {
    await page.goto(`${baseURL}/wallet`);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Check for withdrawal request form
    const withdrawalForm = page.locator('text=/Retiro|Withdrawal|Solicitar/i').first();
    await expect(withdrawalForm).toBeVisible({ timeout: 5000 });
  });

  test('should show minimum withdrawal amount info', async ({ page }) => {
    await page.goto(`${baseURL}/wallet`);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Check for minimum amount information ($20 minimum)
    const minInfo = page.locator('text=/\\$20|20 USD|minimum|minimo/i').first();
    await expect(minInfo).toBeVisible({ timeout: 5000 });

    // The amount input is a text input (currency, $ prefix icon) with id="amount".
    // It is NOT type="number" — deliberate, to avoid spinner/keyboard pitfalls for money.
    await expect(page.locator('#amount')).toBeVisible({ timeout: 5000 });
  });

  test('should validate withdrawal amount (reject below minimum)', async ({ page }) => {
    await page.goto(`${baseURL}/wallet`);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Try to find and fill amount input
    const amountInput = page.locator('#amount').first();
    await expect(amountInput).toBeVisible({ timeout: 5000 });

    // Enter amount below $20
    await amountInput.fill('10');
    await page.waitForTimeout(500);

    // Submit button should be disabled because amount is below minimum
    const submitButton = page
      .getByRole('button', { name: /Solicitar|Request|Submit|Enviar/i })
      .first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeDisabled();

    // Form validation prevents submission — minimum info should still be visible
    const minInfo = page.locator('text=/\\$20|minimum/i').first();
    await expect(minInfo).toBeVisible({ timeout: 5000 });
  });

  test('should create withdrawal with PayPal destination', async ({ page }) => {
    await page.goto(`${baseURL}/wallet`);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Fill in valid amount
    const amountInput = page.locator('#amount').first();
    await expect(amountInput).toBeVisible({ timeout: 5000 });
    await amountInput.fill('30');

    // Fill in PayPal email
    const emailInput = page.locator('#paypal-email').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('test@example.com');

    // Click submit button
    const submitButton = page
      .getByRole('button', { name: /Solicitar|Request|Submit|Enviar/i })
      .first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();

    // Wait for success message
    await page.waitForTimeout(2000);

    // Verify success message appears
    const successMessage = page.locator('text=/success|éxito|created|creado/i').first();
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should have wallet in navigation menu', async ({ page }) => {
    // Check that wallet appears in the navigation
    await page.goto(`${baseURL}/dashboard`);
    await page.waitForTimeout(2000);

    // Check for wallet in nav (may show as "Billetera" in Spanish or "Wallet" in English)
    const navWallet = page.locator('nav a[href="/wallet"], header a[href="/wallet"]');

    // Try English first, then Spanish
    const hasEnglish = await navWallet.filter({ hasText: /Wallet/i }).isVisible();
    const hasSpanish = await navWallet.filter({ hasText: /Billetera|Wallet/i }).isVisible();

    expect(hasEnglish || hasSpanish).toBeTruthy();
  });
});
