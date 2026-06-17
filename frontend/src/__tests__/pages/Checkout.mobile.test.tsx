/**
 * @fileoverview Checkout mobile responsive tests / Tests de responsividad móvil del Checkout
 * @description Validates mobile column stacking and responsive payment method grid.
 *              Verifica apilamiento de columnas en móvil y grilla responsiva de métodos de pago.
 * @module __tests__/pages/Checkout.mobile.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../services/api', () => ({
  orderService: {
    createOrder: vi.fn().mockResolvedValue({ id: 'order-1' }),
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
    isProcessing,
  }: {
    onSubmit: (method: string) => void;
    isProcessing: boolean;
  }) => (
    <div data-testid="checkout-form" data-processing={isProcessing}>
      <div className="grid gap-3 sm:grid-cols-2" data-testid="payment-methods-grid">
        <label>Method 1</label>
        <label>Method 2</label>
      </div>
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

describe('Checkout — Mobile responsive (T3.3)', () => {
  it('main content grid uses grid-cols-1 with lg:grid-cols-2 for mobile stacking', async () => {
    const { container } = renderCheckout();

    await screen.findByText('Checkout');

    // The main content grid
    const mainGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
    expect(mainGrid).toBeTruthy();
  });

  it('payment form container uses relative positioning for overlay support', async () => {
    const { container } = renderCheckout();

    await screen.findByText('Checkout');

    // The payment form wrapper div should have relative class
    const paymentContainer = container.querySelector('.relative');
    expect(paymentContainer).toBeTruthy();

    // It should contain the CheckoutForm
    const checkoutForm = paymentContainer?.querySelector('[data-testid="checkout-form"]');
    expect(checkoutForm).toBeTruthy();
  });
});
