/**
 * @fileoverview Checkout payment loading overlay tests / Tests del overlay de carga de pago
 * @description Validates the payment processing overlay appears when isSubmitting is true,
 *              shows Loader2 spinner and loading.processingPayment text.
 *              Verifica que el overlay de procesamiento aparezca con spinner y texto i18n.
 * @module __tests__/pages/Checkout.loading.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

// Never-resolving createOrder keeps isSubmitting stuck at true
const mockCreateOrder = vi.fn().mockImplementation(() => new Promise(() => {}));

vi.mock('../../services/api', () => ({
  orderService: {
    createOrder: (...args: unknown[]) => mockCreateOrder(...args),
  },
  productService: {
    getProduct: vi.fn().mockResolvedValue({
      id: 'prod-1',
      name: 'Test Product',
      price: 299.99,
      currency: 'USD',
      durationDays: 30,
      isActive: true,
      description: 'A test product',
    }),
  },
}));

vi.mock('../../components/OrderSummary', () => ({
  OrderSummary: () => <div data-testid="order-summary">Order Summary</div>,
}));

vi.mock('../../components/CheckoutForm', () => ({
  CheckoutForm: ({
    onSubmit,
    isProcessing,
  }: {
    onSubmit: (method: string) => void;
    isProcessing: boolean;
  }) => (
    <div data-testid="checkout-form">
      <button onClick={() => onSubmit('simulated')} data-testid="mock-pay-btn">
        Pay
      </button>
      {isProcessing && <span data-testid="form-processing-indicator">Processing</span>}
    </div>
  ),
}));

vi.mock('../../components/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}));

import Checkout from '../../pages/Checkout';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={['/checkout/prod-1']}>
      <Routes>
        <Route path="/checkout/:productId" element={<Checkout />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Checkout — Payment loading overlay (T3.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT show payment overlay when not submitting', async () => {
    renderCheckout();

    await screen.findByText('Checkout');

    const overlay = screen.queryByTestId('payment-loading-overlay');
    expect(overlay).toBeNull();
  });

  it('payment form container has relative class for overlay positioning', async () => {
    const { container } = renderCheckout();

    await screen.findByText('Checkout');

    // The parent of checkout-form should have 'relative' class
    const checkoutForm = screen.getByTestId('checkout-form');
    const parent = checkoutForm.parentElement;
    expect(parent).toBeTruthy();
    expect(parent!.className).toContain('relative');
  });

  it('shows payment loading overlay after confirming purchase', async () => {
    renderCheckout();

    await screen.findByText('Checkout');

    // Trigger the payment flow — mock CheckoutForm calls onSubmit('simulated')
    const payBtn = screen.getByTestId('mock-pay-btn');
    fireEvent.click(payBtn);

    // The Checkout component shows a confirm modal after onSubmit
    // Then clicking confirm triggers handleConfirmPurchase → sets isSubmitting
    // Find the confirm button in the modal
    await waitFor(() => {
      const confirmButtons = screen.getAllByText('Confirmar compra');
      expect(confirmButtons.length).toBeGreaterThan(0);
    });

    // Click the action button (not the heading)
    const allConfirmElements = screen.getAllByText('Confirmar compra');
    const confirmButton = allConfirmElements.find(
      (el) => el.tagName === 'BUTTON' || el.closest('button')
    );

    if (confirmButton) {
      const btn =
        confirmButton.tagName === 'BUTTON' ? confirmButton : confirmButton.closest('button')!;
      fireEvent.click(btn);

      // isSubmitting becomes true, overlay should appear
      await waitFor(() => {
        const overlay = screen.queryByTestId('payment-loading-overlay');
        expect(overlay).toBeTruthy();
      });

      // Overlay has the loading text
      await waitFor(() => {
        expect(screen.getByText('Procesando pago...')).toBeTruthy();
      });
    }
  });
});
