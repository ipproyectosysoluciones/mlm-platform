/**
 * @fileoverview ReservationFlowPage payment loading overlay tests
 * @description Validates the payment processing overlay in the StepPayment component
 *              when isProcessingPayment is true. Checks for spinner, text, and data-testid.
 *              Verifica overlay de procesamiento de pago con spinner y texto i18n.
 * @module __tests__/pages/ReservationFlowPage.loading.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

let mockIsProcessingPayment = false;

const mockSetWizardStep = vi.fn();
const mockCloseWizard = vi.fn();
const mockUpdateWizardData = vi.fn();
const mockConfirmReservation = vi.fn().mockResolvedValue(undefined);

const MOCK_PROPERTY_WIZARD = {
  type: 'property' as const,
  property: { title: 'Beach Villa', city: 'Mar del Plata', pricePerNight: 200 },
  checkIn: '2026-06-01',
  checkOut: '2026-06-05',
  guests: 2,
  notes: '',
  currency: 'USD',
};

vi.mock('../../stores/reservationStore', () => ({
  useReservationWizard: () => ({
    wizardData: MOCK_PROPERTY_WIZARD,
    wizardStep: 'payment',
    setWizardStep: mockSetWizardStep,
    closeWizard: mockCloseWizard,
    updateWizardData: mockUpdateWizardData,
    confirmReservation: mockConfirmReservation,
    createdReservation: { id: 'res-1', propertyId: 'prop-1' },
    isCreating: false,
    createError: null,
    isProcessingPayment: mockIsProcessingPayment,
    paymentError: null,
    setPaymentProcessing: vi.fn(),
    setPaymentError: vi.fn(),
  }),
  computePriceBreakdown: () => ({
    pricePerUnit: 200,
    totalNights: 4,
    guestCount: 2,
    subtotal: 800,
    totalPrice: 800,
    currency: 'USD',
    isProperty: true,
  }),
  formatPrice: (amount: number, currency: string) => `${currency} ${amount}`,
}));

vi.mock('../../stores/walletStore', () => ({
  useWalletBalance: () => ({
    balance: { balance: 1000, currency: 'USD' },
  }),
}));

vi.mock('../../services/paymentService', () => ({
  paymentService: {
    createPayPalOrder: vi.fn(),
    createMercadoPagoPreference: vi.fn(),
    redirectToMercadoPago: vi.fn(),
  },
}));

vi.mock('../../utils/featureFlags', () => ({
  featureFlags: { cryptoWallet: false },
}));

import ReservationFlowPage from '../../pages/ReservationFlowPage';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderPaymentStep() {
  return render(
    <MemoryRouter>
      <ReservationFlowPage />
    </MemoryRouter>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ReservationFlowPage — Payment loading overlay (T3.5)', () => {
  beforeEach(() => {
    mockIsProcessingPayment = false;
    vi.clearAllMocks();
  });

  it('does NOT show payment overlay when not processing', () => {
    mockIsProcessingPayment = false;
    renderPaymentStep();

    const overlay = screen.queryByTestId('payment-loading-overlay');
    expect(overlay).toBeNull();
  });

  it('shows payment loading overlay when isProcessingPayment is true', () => {
    mockIsProcessingPayment = true;
    renderPaymentStep();

    const overlay = screen.queryByTestId('payment-loading-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay!.className).toContain('absolute');
    expect(overlay!.className).toContain('backdrop-blur');
  });

  it('overlay contains spinner and loading text', () => {
    mockIsProcessingPayment = true;
    renderPaymentStep();

    const overlay = screen.getByTestId('payment-loading-overlay');

    // Should have spinner (animate-spin)
    const spinner = overlay.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();

    // Should have loading text
    expect(overlay.textContent).toContain('Procesando pago');
  });

  it('payment methods container has relative positioning for overlay', () => {
    mockIsProcessingPayment = false;
    const { container } = renderPaymentStep();

    // The payment methods container should have `relative` class
    const paymentContainer = container.querySelector('.relative.space-y-3');
    expect(paymentContainer).toBeTruthy();
  });
});
