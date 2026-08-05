/**
 * @fileoverview CheckoutForm MercadoPago vendor-context tests (B12 / FE-2 / FE-3)
 * @description Verifies vendorId forwarding, the vendor-not-connected aviso, and
 *              the init_point redirect in the product CheckoutForm.
 * @module test/CheckoutForm.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckoutForm } from '../components/CheckoutForm';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({ children }: { children: React.ReactNode }) => children,
  PayPalButtons: () => null,
}));

const mockCreatePreference = vi.fn();
const mockRedirect = vi.fn();
const mockCreatePayPalOrder = vi.fn();

vi.mock('../services/paymentService', () => ({
  paymentService: {
    createPayPalOrder: (...args: unknown[]) => mockCreatePayPalOrder(...args),
    createMercadoPagoPreference: (...args: unknown[]) => mockCreatePreference(...args),
    redirectToMercadoPago: (...args: unknown[]) => mockRedirect(...args),
  },
  getApiErrorCode: (err: unknown) =>
    (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code,
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

interface RenderOptions {
  vendorId?: string;
  productId?: string;
}

function renderCheckoutForm({ vendorId, productId = 'prod-1' }: RenderOptions = {}) {
  render(
    <CheckoutForm
      onSubmit={vi.fn()}
      total={100}
      currency="USD"
      productId={productId}
      productName="Test Product"
      vendorId={vendorId}
    />
  );
}

async function payWithMercadoPago() {
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Pagar con MercadoPago' }));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CheckoutForm — MercadoPago vendor context (B12 / FE-2 / FE-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends no vendorId for platform products and redirects to the sandbox init_point (FE-3)', async () => {
    mockCreatePreference.mockResolvedValue({
      preferenceId: 'pref-1',
      initPoint: 'https://mercadopago.com/checkout/abc',
      sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout/abc',
    });

    renderCheckoutForm();

    await payWithMercadoPago();

    expect(mockCreatePreference).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'prod-1', unit_price: 100, currency_id: 'USD' }),
      ]),
      undefined,
      undefined,
      undefined
    );
    expect(mockRedirect).toHaveBeenCalledWith('https://sandbox.mercadopago.com/checkout/abc');
  });

  it('forwards vendorId and informs that payment goes to the business account (FE-3)', async () => {
    mockCreatePreference.mockResolvedValue({
      preferenceId: 'pref-2',
      initPoint: 'https://mercadopago.com/checkout/vendor',
      sandboxInitPoint: '',
    });

    renderCheckoutForm({ vendorId: 'vendor-7' });

    // FE-3 MUST inform the payer that the charge goes to the business account
    expect(screen.getByText('El pago se realizará a la cuenta del negocio.')).toBeInTheDocument();

    await payWithMercadoPago();

    expect(mockCreatePreference).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'prod-1' })]),
      undefined,
      undefined,
      'vendor-7'
    );
  });

  it('shows the vendor-not-connected aviso when the vendor has no MP account (FE-2)', async () => {
    mockCreatePreference.mockRejectedValue({
      response: {
        data: {
          success: false,
          error: { code: 'CONNECT_MP_REQUIRED', message: 'vendor must connect MercadoPago' },
        },
        status: 400,
      },
    });

    renderCheckoutForm({ vendorId: 'vendor-7' });

    await payWithMercadoPago();

    expect(await screen.findByText('El negocio aún no conecta MercadoPago.')).toBeInTheDocument();
    expect(screen.queryByText(/No se pudo crear la preferencia/i)).not.toBeInTheDocument();
  });

  it('shows the generic MP error for other failures (FE-3)', async () => {
    mockCreatePreference.mockRejectedValue(new Error('MP service down'));

    renderCheckoutForm({ vendorId: 'vendor-7' });

    await payWithMercadoPago();

    expect(await screen.findByText(/No se pudo crear la preferencia/i)).toBeInTheDocument();
  });
});
