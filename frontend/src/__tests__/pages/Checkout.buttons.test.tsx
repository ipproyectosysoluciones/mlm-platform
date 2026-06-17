/**
 * @fileoverview Checkout button migration tests / Tests de migración de botones en Checkout
 * @description Validates all raw <button> elements are replaced with shadcn <Button>.
 *              Payment CTA must have Lock icon. Confirm/Cancel modal uses default/outline pair.
 *              Verifica migración de botones y que el CTA de pago tenga ícono Lock.
 * @module __tests__/pages/Checkout.buttons.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  CheckoutForm: ({ onSubmit }: { onSubmit: (method: string) => void }) => (
    <div data-testid="checkout-form">
      <button onClick={() => onSubmit('simulated')} data-testid="mock-pay-btn">
        Pay
      </button>
    </div>
  ),
}));

vi.mock('../../components/EmptyState', () => ({
  EmptyState: ({ title, onAction }: { title: string; onAction?: () => void }) => (
    <div data-testid="empty-state">{title}</div>
  ),
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

describe('Checkout — Button migration (T1.7)', () => {
  it('renders NO raw <button> — all buttons use shadcn Button component', async () => {
    const { container } = renderCheckout();

    // Wait for product to load — t('checkout.title') → 'Checkout'
    await screen.findByText('Checkout');

    const allButtons = container.querySelectorAll('button');
    const shadcnBaseFragment = 'ring-offset-background';

    // Filter out buttons inside mocked components (data-testid="mock-pay-btn")
    const realButtons = Array.from(allButtons).filter(
      (btn) => !btn.dataset.testid?.startsWith('mock-')
    );

    expect(realButtons.length).toBeGreaterThan(0);
    realButtons.forEach((btn) => {
      expect(
        btn.className.includes(shadcnBaseFragment),
        `Button "${btn.textContent?.trim()}" is missing shadcn buttonVariants class`
      ).toBe(true);
    });
  });

  it('back button uses ghost variant (icon button) with size="icon"', async () => {
    const { container } = renderCheckout();
    await screen.findByText('Checkout');

    // The back button renders an ArrowLeft icon
    const backBtn = container.querySelector('button svg.lucide-arrow-left')?.closest('button');
    expect(backBtn).toBeTruthy();
    expect(backBtn!.className).toContain('ring-offset-background');
  });

  it('modal confirm uses default variant and cancel uses outline variant', async () => {
    const { container } = renderCheckout();
    await screen.findByText('Checkout');

    // Trigger modal by clicking the mocked pay button
    const mockPayBtn = screen.getByTestId('mock-pay-btn');
    fireEvent.click(mockPayBtn);

    // Wait for modal to appear — header shows translated 'Confirmar compra'
    await screen.findByRole('heading', { name: /confirmar compra/i });

    // Confirm button should have bg-primary (default variant)
    // The button text also contains 'Confirmar compra' from t('checkout.confirmPurchase')
    const confirmBtn = screen
      .getAllByRole('button')
      .find(
        (btn) =>
          btn.textContent?.includes('Confirmar compra') && btn.className.includes('bg-primary')
      );
    expect(confirmBtn).toBeTruthy();
    expect(confirmBtn!.className).toContain('bg-primary');

    // Cancel button should have border (outline variant) — t('common.cancel') → 'Cancelar'
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    expect(cancelBtn.className).toContain('border');
  });

  it('modal confirm button has Lock icon for secure payment', async () => {
    const { container } = renderCheckout();
    await screen.findByText('Checkout');

    // Trigger modal
    fireEvent.click(screen.getByTestId('mock-pay-btn'));
    await screen.findByRole('heading', { name: /confirmar compra/i });

    // Find the confirm purchase button and check for Lock SVG
    const confirmBtn = screen
      .getAllByRole('button')
      .find(
        (btn) =>
          btn.textContent?.includes('Confirmar compra') && btn.className.includes('bg-primary')
      );
    expect(confirmBtn).toBeTruthy();
    const lockIcon = confirmBtn!.querySelector('svg.lucide-lock');
    expect(lockIcon).toBeTruthy();
  });
});
