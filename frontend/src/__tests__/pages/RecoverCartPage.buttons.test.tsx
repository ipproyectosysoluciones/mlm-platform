/**
 * @fileoverview RecoverCartPage button migration tests / Tests de migración de botones en RecoverCartPage
 * @description Validates all raw <button> elements are replaced with shadcn <Button>
 *              Verifica que todos los <button> crudos se reemplazaron con <Button> de shadcn
 * @module __tests__/pages/RecoverCartPage.buttons.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockPreviewRecoveryCart = vi.fn();
const mockConfirmRecovery = vi.fn();
const mockClearRecovery = vi.fn();

vi.mock('../../stores/cartStore', () => ({
  useCartRecovery: () => ({
    recoveryCart: {
      id: 'cart-1',
      items: [{ id: 'item-1', name: 'Test Product', price: 100, quantity: 1 }],
      total: 100,
    },
    recoveryError: null,
    isLoadingRecovery: false,
    isRecovering: false,
    previewRecoveryCart: mockPreviewRecoveryCart,
    confirmRecovery: mockConfirmRecovery,
    clearRecovery: mockClearRecovery,
  }),
}));

vi.mock('../../components/Cart/CartPreview', () => ({
  CartPreview: ({ cart }: { cart: unknown }) => <div data-testid="cart-preview">Cart Preview</div>,
}));

// Must mock useSearchParams to provide the token
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams('token=test-token-123'), vi.fn()],
  };
});

import { RecoverCartPage } from '../../pages/RecoverCartPage';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderRecoverCartPage() {
  return render(
    <MemoryRouter>
      <RecoverCartPage />
    </MemoryRouter>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('RecoverCartPage — Button migration (T1.6)', () => {
  beforeEach(() => {
    mockPreviewRecoveryCart.mockReset();
    mockConfirmRecovery.mockReset();
    mockClearRecovery.mockReset();
  });

  it('renders NO raw <button> — all buttons use shadcn Button component', () => {
    const { container } = renderRecoverCartPage();

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

  it('primary CTA "Proceed to Checkout" uses default variant', () => {
    renderRecoverCartPage();

    const proceedBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    expect(proceedBtn).toBeTruthy();
    expect(proceedBtn.className).toContain('bg-primary');
  });

  it('secondary "Continue Browsing" uses outline variant', () => {
    renderRecoverCartPage();

    const browseBtn = screen.getByRole('button', { name: /continue browsing/i });
    expect(browseBtn).toBeTruthy();
    expect(browseBtn.className).toContain('border');
  });
});
