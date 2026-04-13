/**
 * @fileoverview OrderSuccess button migration tests / Tests de migración de botones en OrderSuccess
 * @description Validates all raw <button> elements are replaced with shadcn <Button>
 *              Verifica que todos los <button> crudos se reemplazaron con <Button> de shadcn
 * @module __tests__/pages/OrderSuccess.buttons.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../services/api', () => ({
  orderService: {
    getOrder: vi.fn().mockResolvedValue({
      id: 'order-1',
      orderNumber: 'NXR-1234',
      status: 'completed',
      amount: 5000,
      currency: 'USD',
      commissionTotal: 500,
      items: [{ id: 'item-1', name: 'Test Product', price: 5000, quantity: 1 }],
    }),
  },
  productService: {
    getProduct: vi.fn(),
  },
}));

vi.mock('../../components/OrderSummary', () => ({
  OrderSummary: () => <div data-testid="order-summary">Order Summary</div>,
}));

vi.mock('../../components/OrderStatus', () => ({
  OrderStatus: ({ status }: { status: string }) => <span data-testid="order-status">{status}</span>,
}));

import OrderSuccess from '../../pages/OrderSuccess';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderOrderSuccess() {
  return render(
    <MemoryRouter initialEntries={['/orders/order-1/success']}>
      <Routes>
        <Route path="/orders/:orderId/success" element={<OrderSuccess />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('OrderSuccess — Button migration (T1.6)', () => {
  it('renders NO raw <button> — all buttons use shadcn Button component', async () => {
    const { container } = renderOrderSuccess();

    // Wait for order to load
    await screen.findByText('NXR-1234');

    const allButtons = container.querySelectorAll('button');
    const shadcnBaseFragment = 'ring-offset-background';

    expect(allButtons.length).toBeGreaterThan(0);
    allButtons.forEach((btn) => {
      expect(
        btn.className.includes(shadcnBaseFragment),
        `Button "${btn.textContent?.trim()}" is missing shadcn buttonVariants class`
      ).toBe(true);
    });
  });

  it('"Continue Shopping" uses outline variant (secondary)', async () => {
    renderOrderSuccess();
    await screen.findByText('NXR-1234');

    const shopBtn = screen.getByRole('button', { name: /orders\.continueShopping/i });
    expect(shopBtn.className).toContain('border');
  });

  it('"Go to Dashboard" uses default variant (primary)', async () => {
    renderOrderSuccess();
    await screen.findByText('NXR-1234');

    const dashBtn = screen.getByRole('button', { name: /orders\.goToDashboard/i });
    expect(dashBtn.className).toContain('bg-primary');
  });

  it('copy order number button uses ghost variant (icon action)', async () => {
    renderOrderSuccess();
    await screen.findByText('NXR-1234');

    // The copy button is a ghost/icon button
    const copyBtn = screen.getByTitle('common.copy');
    expect(copyBtn.tagName).toBe('BUTTON');
    expect(copyBtn.className).toContain('ring-offset-background');
  });
});
