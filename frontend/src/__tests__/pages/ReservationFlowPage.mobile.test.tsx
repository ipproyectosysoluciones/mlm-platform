/**
 * @fileoverview ReservationFlowPage mobile responsive tests / Tests de responsividad móvil
 * @description Validates mobile-specific fixes: step indicator overflow, touch-target sizes,
 *              and step label truncation behavior on narrow viewports (375px).
 *              Verifica fixes móviles: overflow del indicador de pasos, tamaños de touch-target,
 *              y comportamiento de truncamiento de etiquetas en viewports estrechos (375px).
 * @module __tests__/pages/ReservationFlowPage.mobile.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('ReservationFlowPage — Mobile responsive (T3.2)', () => {
  beforeEach(() => {
    mockWizardStep = 'guests';
    mockWizardData = MOCK_PROPERTY_WIZARD;
  });

  it('step indicator container has overflow-x-auto for mobile scroll', () => {
    const { container } = renderReservationFlow();

    // The step indicator container is the first flex row with gap-0 and mb-8
    const stepContainer = container.querySelector('.overflow-x-auto.flex.items-center');
    expect(stepContainer).toBeTruthy();
    expect(stepContainer!.className).toContain('overflow-x-auto');
  });

  it('step circles have shrink-0 to prevent shrinking on narrow screens', () => {
    const { container } = renderReservationFlow();

    const stepCircles = container.querySelectorAll(
      '.rounded-full.flex.items-center.justify-center'
    );
    expect(stepCircles.length).toBeGreaterThan(0);

    stepCircles.forEach((circle) => {
      expect(circle.className).toContain('shrink-0');
    });
  });

  it('step labels have min-w-0 to prevent overflow on narrow screens', () => {
    const { container } = renderReservationFlow();

    // Step labels are <span> elements with text-xs and whitespace-nowrap
    const labels = container.querySelectorAll('span.whitespace-nowrap');
    expect(labels.length).toBeGreaterThan(0);

    labels.forEach((label) => {
      expect(label.className).toContain('min-w-0');
    });
  });

  it('guest counter buttons are 44px (h-11 w-11) for WCAG AA touch targets', () => {
    const { container } = renderReservationFlow();

    // Guest counter buttons have the − and + text
    const decrementBtn = screen.getByRole('button', { name: /−/ });
    const incrementBtn = screen.getByRole('button', { name: /\+/ });

    expect(decrementBtn.className).toContain('h-11');
    expect(decrementBtn.className).toContain('w-11');
    expect(incrementBtn.className).toContain('h-11');
    expect(incrementBtn.className).toContain('w-11');
  });
});
