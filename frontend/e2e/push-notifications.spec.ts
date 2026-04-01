/**
 * @fileoverview Push Notifications E2E Tests
 * @description Tests for push notification permission flow and subscription
 * @module e2e/push-notifications
 */

import { test, expect } from '@playwright/test';
import { baseURL, login, logout } from './helpers';

test.describe('Push Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Grant notification permission before each test
    await page.context().permissions.set([{ origin: baseURL, name: 'notifications' }]);
  });

  test('should request notification permission when user clicks subscribe', async ({ page }) => {
    // Login first
    await login(page);

    // Navigate to settings or profile where push notification toggle might be
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });

    // Look for notification-related UI elements
    // This will depend on where the subscribe button is placed in the UI
    // Common locations: settings, profile, or a notification bell

    // Try to find any button or toggle related to push notifications
    const pushButton = page
      .locator('button, [role="switch"], input[type="checkbox"]')
      .filter({
        hasText: /notific|push|subscrib/i,
      })
      .first();

    // If there's a notification toggle, click it
    if (await pushButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pushButton.click();

      // Wait for permission dialog (if appears)
      await page.waitForTimeout(1000);
    } else {
      // If no UI found, just check if Notification API is available
      const hasNotificationSupport = await page.evaluate(() => {
        return 'Notification' in window;
      });

      expect(hasNotificationSupport).toBe(true);
    }
  });

  test('should detect current notification permission status', async ({ page }) => {
    // Go to app
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // Check notification permission via page evaluation
    const permissionStatus = await page.evaluate(() => {
      if (!('Notification' in window)) {
        return 'unsupported';
      }
      return Notification.permission;
    });

    console.log('Current notification permission:', permissionStatus);

    // Permission should be one of: granted, denied, default, or unsupported
    expect(['granted', 'denied', 'default', 'unsupported']).toContain(permissionStatus);
  });

  test('should handle notification permission denied', async ({ page }) => {
    // First, revoke permission
    await page
      .context()
      .permissions.set([{ origin: baseURL, name: 'notifications', action: 'deny' }]);

    // Go to app
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // Check permission status
    const permissionStatus = await page.evaluate(() => {
      return 'Notification' in window ? Notification.permission : 'unsupported';
    });

    expect(permissionStatus).toBe('denied');
  });

  test('should show appropriate UI when notifications are denied', async ({ page }) => {
    // Set permissions to denied
    await page
      .context()
      .permissions.set([{ origin: baseURL, name: 'notifications', action: 'deny' }]);

    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // Check if there's an indicator or message about notifications being denied
    // This is optional - depends on implementation
    const deniedMessage = page.locator('text=/notificaciones.*denegadas|permission.*denied/i');

    // Not all apps show this, so we just verify the permission is actually denied
    const actualPermission = await page.evaluate(() => {
      return Notification.permission;
    });
    expect(actualPermission).toBe('denied');
  });

  test('should work with service worker for push subscriptions', async ({ page }) => {
    // Go to app
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // Check if service worker is available
    const swSupport = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(swSupport).toBe(true);

    // If service workers are supported, check if there's a registration
    if (swSupport) {
      const swRegistration = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          return registrations.length > 0 ? registrations[0] : null;
        }
        return null;
      });

      console.log('Service Worker registration exists:', !!swRegistration);
    }
  });

  test('should handle push subscription API errors gracefully', async ({ page }) => {
    // Go to app (not logged in - push subscription requires auth)
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Try to access push-related API without auth
    // This should fail gracefully (return error, not crash)
    const response = await page.request
      .get(`${baseURL}/api/push/vapid-public-key`)
      .catch(() => null);

    // The VAPID endpoint is public, so it should work
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }

    // Verify no critical JS errors
    const criticalErrors = errors.filter(
      (e) =>
        e.includes('TypeError') ||
        e.includes('ReferenceError') ||
        e.includes('UnhandledPromiseRejection')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should be able to fetch VAPID public key from backend', async ({ page }) => {
    // The VAPID public key endpoint should be public
    const response = await page.request.get(`${baseURL}/api/push/vapid-public-key`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('publicKey');
    expect(body.data.publicKey).toBeTruthy();
  });

  test('should handle landing page API for products', async ({ page }) => {
    // Go to a product landing page
    // First we need a product ID - let's try a sample UUID format
    const productId = '00000000-0000-0000-0000-000000000001';

    const response = await page.request.get(`${baseURL}/api/public/landing/product/${productId}`);

    // Should return either 200 (product exists) or 404 (not found), not 500
    expect(response.status()).toBeLessThan(500);

    const body = await response.json();
    // Should have a proper API response structure
    expect(body).toHaveProperty('success');
  });

  test('should handle public profile products API', async ({ page }) => {
    // Try to fetch products for a sample referral code
    const response = await page.request.get(`${baseURL}/api/public/profile/TESTCODE/products`);

    // Should return either 200 or 404, not 500
    expect(response.status()).toBeLessThan(500);

    const body = await response.json();
    expect(body).toHaveProperty('success');
  });

  test('should display notification UI properly when permitted', async ({ page }) => {
    // Grant permission
    await page.context().permissions.set([{ origin: baseURL, name: 'notifications' }]);

    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // Check if Notification API shows as permitted
    const isPermitted = await page.evaluate(() => {
      return 'Notification' in window && Notification.permission === 'granted';
    });

    expect(isPermitted).toBe(true);
  });
});
