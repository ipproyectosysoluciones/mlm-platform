/**
 * @fileoverview ReservationFlowPage button migration tests / Tests de migración de botones en ReservationFlowPage
 * @description Validates all raw <button> elements are replaced with shadcn <Button>.
 *              Next=default, Back=outline, payment methods=outline, pay later=ghost.
 *              Verifica migración de botones del wizard de reserva de 4 pasos.
 * @module __tests__/pages/ReservationFlowPage.buttons.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

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

let mockWizardStep = 'guests';
let mockWizardData: typeof MOCK_PROPERTY_WIZARD | null = MOCK_PROPERTY_WIZARD;

vi.mock('../../stores/reservationStore', () => ({
  useReservationWizard: () => ({
    wizardData: mockWizardData,
    wizardStep: mockWizardStep,
    setWizardStep: mockSetWizardStep,
    closeWizard: mockCloseWizard,
    updateWizardData: mockUpdateWizardData,
    confirmReservation: mockConfirmReservation,
    createdReservation: null,
    isCreating: false,
    createError: null,
    isProcessingPayment: false,
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

function renderReservationFlow() {
  return render(
    <MemoryRouter>
      <ReservationFlowPage />
    </MemoryRouter>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ReservationFlowPage — Button migration (T1.7)', () => {
  beforeEach(() => {
    mockWizardStep = 'guests';
    mockWizardData = MOCK_PROPERTY_WIZARD;
    mockSetWizardStep.mockReset();
    mockCloseWizard.mockReset();
    mockUpdateWizardData.mockReset();
    mockConfirmReservation.mockReset().mockResolvedValue(undefined);
  });

  it('renders NO raw <button> on guests step — all use shadcn Button', () => {
    const { container } = renderReservationFlow();

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

  it('"Back" button uses outline variant', () => {
    renderReservationFlow();

    // On guests step with property, there should be a Back button
    // mockT translates 'reservation.back' → 'Atrás'
    const backBtn = screen.getByRole('button', { name: /atrás/i });
    expect(backBtn.className).toContain('border');
  });

  it('"Confirm reservation" button uses default variant (primary action)', () => {
    renderReservationFlow();

    // mockT translates 'reservation.confirmReservation' → 'Confirmar reserva'
    const confirmBtn = screen.getByRole('button', { name: /confirmar reserva/i });
    expect(confirmBtn.className).toContain('bg-primary');
  });

  it('guest counter +/- buttons use outline variant', () => {
    renderReservationFlow();

    // The counter buttons contain − and +
    const minusBtn = screen.getByRole('button', { name: /−/ });
    const plusBtn = screen.getByRole('button', { name: /\+/ });

    expect(minusBtn.className).toContain('border');
    expect(plusBtn.className).toContain('border');
  });

  it('cancel button in header uses ghost variant', () => {
    renderReservationFlow();

    // mockT translates 'reservation.cancel' → 'Cancelar'
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    // ghost variant doesn't have 'border' or 'bg-primary' — just base classes
    expect(cancelBtn.className).toContain('ring-offset-background');
    expect(cancelBtn.className).not.toContain('bg-primary');
    expect(cancelBtn.className).not.toContain('border-input');
  });
});
