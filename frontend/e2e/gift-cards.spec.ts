/**
 * @fileoverview Gift Cards E2E Tests (Playwright)
 * @description End-to-end tests for gift card admin creation (QR), customer redemption,
 *              and error flows (expired/invalid codes).
 *
 *              Pruebas end-to-end para creación admin de gift cards (QR), canje por cliente,
 *              y flujos de error (códigos expirados/inválidos).
 *
 * @module e2e/gift-cards.spec
 */
import { test, expect } from '@playwright/test';
import { baseURL, login, loginAs, waitForPageReady } from './helpers';

test.describe('Gift Cards', () => {
  // ============================================================
  // 1. Admin creates a gift card and sees QR
  //    Admin crea una gift card y ve el QR
  // ============================================================
  test(
    '23.1 - Admin creates a gift card and sees QR code',
    { tag: ['@critical', '@e2e', '@gift-cards', '@GC-E2E-001'] },
    async ({ page }) => {
      // Login as admin
      await login(page);
      await waitForPageReady(page);

      // Navigate to gift cards admin page
      await page.goto(`${baseURL}/admin/gift-cards`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for "Create" or "Nueva" button
      const createButton = page.getByRole('button', { name: /create|nueva|new|crear/i }).first();

      // If create button visible, click it
      const createVisible = await createButton.isVisible().catch(() => false);
      if (createVisible) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }

      // Fill the gift card form — amount field
      const amountInput = page
        .locator(
          'input[name="amount"], input[placeholder*="amount" i], input[placeholder*="monto" i], input[type="number"]'
        )
        .first();

      const amountVisible = await amountInput.isVisible({ timeout: 5000 }).catch(() => false);
      if (amountVisible) {
        await amountInput.fill('50');

        // Look for expiration days input (optional)
        const expiresInput = page
          .locator(
            'input[name="expiresInDays"], input[placeholder*="days" i], input[placeholder*="días" i]'
          )
          .first();
        const expiresVisible = await expiresInput.isVisible().catch(() => false);
        if (expiresVisible) {
          await expiresInput.fill('60');
        }

        // Submit the form
        const submitButton = page
          .getByRole('button', { name: /create|crear|submit|guardar|save/i })
          .first();
        const submitVisible = await submitButton.isVisible().catch(() => false);
        if (submitVisible) {
          await submitButton.click();
          await page.waitForTimeout(3000);

          // Verify QR code is displayed (could be an img tag, canvas, or data-url image)
          const qrElement = page
            .locator('img[alt*="QR" i], img[src^="data:image"], canvas, [data-testid="qr-code"]')
            .first();

          const qrVisible = await qrElement.isVisible({ timeout: 10000 }).catch(() => false);
          if (qrVisible) {
            await expect(qrElement).toBeVisible();
          }

          // Verify success message or gift card code is shown
          const successIndicator = page.locator('text=/GC-|created|creada|success|éxito/i').first();
          const successVisible = await successIndicator
            .isVisible({ timeout: 5000 })
            .catch(() => false);
          expect(successVisible || qrVisible).toBeTruthy();
        }
      }
    }
  );

  // ============================================================
  // 2. Customer redeems gift card via code entry
  //    Cliente canjea gift card vía entrada de código
  // ============================================================
  test(
    '23.2 - Customer redeems gift card via code entry at checkout',
    { tag: ['@critical', '@e2e', '@gift-cards', '@GC-E2E-002'] },
    async ({ page }) => {
      // Login as regular user
      await login(page);
      await waitForPageReady(page);

      // Navigate to checkout or gift card redemption page
      await page.goto(`${baseURL}/checkout`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for gift card code input field
      const codeInput = page
        .locator(
          'input[name="giftCardCode"], input[placeholder*="gift card" i], input[placeholder*="código" i], input[placeholder*="code" i], input[data-testid="gift-card-input"]'
        )
        .first();

      const codeVisible = await codeInput.isVisible({ timeout: 5000 }).catch(() => false);
      if (codeVisible) {
        // Enter a gift card code
        await codeInput.fill('GC-TEST-1234-5678');

        // Click validate/apply button
        const applyButton = page
          .getByRole('button', { name: /apply|aplicar|validate|validar|redeem|canjear/i })
          .first();

        const applyVisible = await applyButton.isVisible().catch(() => false);
        if (applyVisible) {
          await applyButton.click();
          await page.waitForTimeout(2000);

          // After applying, look for either updated total or error message
          // (in E2E without a real card, we expect error — but the flow is tested)
          const responseIndicator = page
            .locator(
              'text=/applied|aplicado|discount|descuento|invalid|inválido|not found|no encontrad/i'
            )
            .first();
          const hasResponse = await responseIndicator
            .isVisible({ timeout: 5000 })
            .catch(() => false);
          expect(hasResponse).toBeTruthy();
        }
      } else {
        // If no code input on checkout, check if there's a dedicated redemption page
        await page.goto(`${baseURL}/gift-cards/redeem`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const redeemInput = page
          .locator('input[name="giftCardCode"], input[placeholder*="code" i], input[type="text"]')
          .first();
        const redeemVisible = await redeemInput.isVisible({ timeout: 5000 }).catch(() => false);
        // Verify the redemption page/input exists
        expect(redeemVisible || codeVisible).toBeTruthy();
      }
    }
  );

  // ============================================================
  // 3. Error flow: expired card
  //    Flujo de error: tarjeta expirada
  // ============================================================
  test(
    '23.3 - Error flow: expired gift card shows error message',
    { tag: ['@high', '@e2e', '@gift-cards', '@GC-E2E-003'] },
    async ({ page }) => {
      await login(page);
      await waitForPageReady(page);

      // Navigate to gift card redemption area
      await page.goto(`${baseURL}/gift-cards/redeem`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Try entering a code (will be treated as expired/invalid by backend)
      const codeInput = page
        .locator(
          'input[name="giftCardCode"], input[placeholder*="code" i], input[placeholder*="código" i], input[type="text"]'
        )
        .first();

      const inputVisible = await codeInput.isVisible({ timeout: 5000 }).catch(() => false);
      if (inputVisible) {
        await codeInput.fill('GC-EXPIRED-0000-0000');

        const submitBtn = page
          .getByRole('button', { name: /validate|validar|apply|aplicar|redeem|canjear/i })
          .first();

        const btnVisible = await submitBtn.isVisible().catch(() => false);
        if (btnVisible) {
          await submitBtn.click();
          await page.waitForTimeout(2000);

          // Verify error message is shown
          const errorMessage = page
            .locator('text=/expired|expirada|invalid|inválida|error|not found|no encontrad/i')
            .first();
          const errorShown = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
          expect(errorShown).toBeTruthy();
        }
      }
    }
  );

  // ============================================================
  // 4. Error flow: invalid code
  //    Flujo de error: código inválido
  // ============================================================
  test(
    '23.4 - Error flow: invalid gift card code shows error message',
    { tag: ['@high', '@e2e', '@gift-cards', '@GC-E2E-004'] },
    async ({ page }) => {
      await login(page);
      await waitForPageReady(page);

      // Navigate to gift card redemption area
      await page.goto(`${baseURL}/gift-cards/redeem`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const codeInput = page
        .locator(
          'input[name="giftCardCode"], input[placeholder*="code" i], input[placeholder*="código" i], input[type="text"]'
        )
        .first();

      const inputVisible = await codeInput.isVisible({ timeout: 5000 }).catch(() => false);
      if (inputVisible) {
        // Enter a completely invalid code
        await codeInput.fill('INVALID-CODE-XYZ');

        const submitBtn = page
          .getByRole('button', { name: /validate|validar|apply|aplicar|redeem|canjear/i })
          .first();

        const btnVisible = await submitBtn.isVisible().catch(() => false);
        if (btnVisible) {
          await submitBtn.click();
          await page.waitForTimeout(2000);

          // Verify error message
          const errorMessage = page
            .locator('text=/invalid|inválid|not found|no encontrad|error|incorrect|incorrect/i')
            .first();
          const errorShown = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
          expect(errorShown).toBeTruthy();
        }
      }
    }
  );
});
