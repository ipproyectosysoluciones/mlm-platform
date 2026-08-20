/**
 * @fileoverview usePayment Hook Unit Tests
 * @description Tests for the usePayment hook covering payment processing, wallet checks, and error states
 * @module hooks/__tests__/usePayment.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePayment } from '../usePayment';
import type { PriceBreakdown } from '../../types/reservation';

// ── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_BREAKDOWN: PriceBreakdown = {
  pricePerUnit: 200,
  currency: 'USD',
  totalNights: 4,
  guestCount: 2,
  subtotal: 800,
  totalPrice: 1600,
  isProperty: true,
};

const MOCK_RESERVATION = {
  id: 'res-123',
  propertyId: 'prop-456',
  userId: 'user-1',
  status: 'pending' as const,
  paymentStatus: 'pending' as const,
  guests: 2,
  totalAmount: 1600,
  currency: 'USD',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ── Mutable Mock State ──────────────────────────────────────────────────────
// These variables are referenced by the vi.mock closures below.
// Changing them between tests controls what the mocked modules return.

let mockBalanceValue: { balance: number; currency: string } | null = {
  balance: 5000,
  currency: 'USD',
};
let mockCreatedReservationValue: typeof MOCK_RESERVATION | null = MOCK_RESERVATION;

const mockSetPaymentProcessing = vi.fn();
const mockSetPaymentError = vi.fn();

// ── Mock Modules ────────────────────────────────────────────────────────────

vi.mock('../../stores/reservationStore', () => ({
  useReservationWizard: () => ({
    createdReservation: mockCreatedReservationValue,
    isProcessingPayment: false,
    paymentError: null,
    setPaymentProcessing: mockSetPaymentProcessing,
    setPaymentError: mockSetPaymentError,
  }),
  formatPrice: (amount: number, currency: string) => `${currency} ${amount}`,
}));

vi.mock('../../stores/walletStore', () => ({
  useWalletBalance: () => ({
    balance: mockBalanceValue,
  }),
}));

vi.mock('../../services/paymentService', () => ({
  paymentService: {
    createPayPalOrder: vi.fn(),
    createMercadoPagoPreference: vi.fn(),
    redirectToMercadoPago: vi.fn(),
  },
  getApiErrorCode: (err: unknown) =>
    (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code,
}));

// Bring in mocked modules for assertions
import { paymentService } from '../../services/paymentService';

const mockPaymentService = paymentService as {
  createPayPalOrder: ReturnType<typeof vi.fn>;
  createMercadoPagoPreference: ReturnType<typeof vi.fn>;
  redirectToMercadoPago: ReturnType<typeof vi.fn>;
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('usePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mutable mock state
    mockBalanceValue = { balance: 5000, currency: 'USD' };
    mockCreatedReservationValue = MOCK_RESERVATION;
    mockSetPaymentProcessing.mockClear();
    mockSetPaymentError.mockClear();
  });

  // ── Initial State ───────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should return default values when not processing', () => {
      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      expect(result.current.processingMethod).toBeNull();
      expect(result.current.isProcessingPayment).toBe(false);
      expect(result.current.paymentError).toBeNull();
      expect(result.current.hasEnoughWalletBalance).toBe(true);
      expect(result.current.walletBalanceDisplay).toBe('USD 5000');
    });

    it('should return not enough balance when wallet is low', () => {
      mockBalanceValue = { balance: 500, currency: 'USD' };
      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      expect(result.current.hasEnoughWalletBalance).toBe(false);
    });

    it('should handle null breakdown gracefully — insufficient because totalPrice=0 fails totalPrice>0 guard', () => {
      const { result } = renderHook(() => usePayment(null));

      // totalPrice defaults to 0, so the guard totalPrice > 0 makes hasEnoughWalletBalance false
      expect(result.current.hasEnoughWalletBalance).toBe(false);
      expect(result.current.walletBalanceDisplay).toBe('USD 5000');
      expect(result.current.isProcessingPayment).toBe(false);
    });

    it('should handle null balance gracefully', () => {
      mockBalanceValue = null;
      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      // When balance is null, walletBalance defaults to 0, so insufficient
      expect(result.current.hasEnoughWalletBalance).toBe(false);
      expect(result.current.walletBalanceDisplay).toBe('USD 0');
    });
  });

  // ── PayPal Flow ─────────────────────────────────────────────────────────

  describe('handlePayPal', () => {
    it('should call createPayPalOrder with correct params and redirect', async () => {
      const approvalUrl = 'https://paypal.com/checkout/abc123';
      mockPaymentService.createPayPalOrder.mockResolvedValue({
        success: true,
        data: { orderId: 'pp-order-1', status: 'created', approvalUrl },
      });

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handlePayPal();
      });

      expect(mockPaymentService.createPayPalOrder).toHaveBeenCalledTimes(1);
      expect(mockPaymentService.createPayPalOrder).toHaveBeenCalledWith({
        amount: 1600,
        currency: 'USD',
        description: 'Nexo Real - Reservation res-123',
        orderId: 'res-123',
      });
      // setPaymentProcessing(true) then setPaymentProcessing(false)
      expect(mockSetPaymentProcessing).toHaveBeenCalledWith(true);
      expect(mockSetPaymentProcessing).toHaveBeenCalledWith(false);
      expect(mockSetPaymentError).toHaveBeenCalledWith(null);
    });

    it('should handle missing reservation gracefully — do nothing', async () => {
      mockCreatedReservationValue = null;
      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handlePayPal();
      });

      expect(mockPaymentService.createPayPalOrder).not.toHaveBeenCalled();
    });

    it('should handle API error and set payment error', async () => {
      mockPaymentService.createPayPalOrder.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handlePayPal();
      });

      // paymentError on the hook comes from the store — we mock it as null
      // so the error is communicated via setPaymentError
      expect(mockSetPaymentError).toHaveBeenCalledWith('Error al procesar el pago');
      expect(mockSetPaymentProcessing).toHaveBeenCalledWith(true);
      expect(mockSetPaymentProcessing).toHaveBeenCalledWith(false);
    });

    it('should handle missing approval URL gracefully — no crash', async () => {
      mockPaymentService.createPayPalOrder.mockResolvedValue({
        success: true,
        data: { orderId: 'pp-order-1', status: 'created', approvalUrl: undefined },
      });

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handlePayPal();
      });

      expect(mockPaymentService.createPayPalOrder).toHaveBeenCalledTimes(1);
    });
  });

  // ── MercadoPago Flow ────────────────────────────────────────────────────

  describe('handleMercadoPago', () => {
    it('should create MP preference and redirect', async () => {
      mockPaymentService.createMercadoPagoPreference.mockResolvedValue({
        preferenceId: 'mp-pref-1',
        initPoint: 'https://mercadopago.com/checkout/abc',
        sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout/abc',
      });

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handleMercadoPago();
      });

      expect(mockPaymentService.createMercadoPagoPreference).toHaveBeenCalledTimes(1);
      expect(mockPaymentService.createMercadoPagoPreference).toHaveBeenCalledWith(
        [
          {
            id: 'res-123',
            title: 'Nexo Real - Property Reservation',
            quantity: 1,
            unit_price: 1600,
            currency_id: 'USD',
          },
        ],
        undefined,
        'res-123',
        undefined
      );
      expect(mockPaymentService.redirectToMercadoPago).toHaveBeenCalledWith(
        'https://mercadopago.com/checkout/abc'
      );
    });

    it('should handle missing reservation gracefully — do nothing', async () => {
      mockCreatedReservationValue = null;
      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handleMercadoPago();
      });

      expect(mockPaymentService.createMercadoPagoPreference).not.toHaveBeenCalled();
    });

    it('should use tour reservation title when no propertyId', async () => {
      mockCreatedReservationValue = {
        ...MOCK_RESERVATION,
        propertyId: undefined,
        tourPackageId: 'tour-789',
      };

      mockPaymentService.createMercadoPagoPreference.mockResolvedValue({
        preferenceId: 'mp-pref-2',
        initPoint: 'https://mercadopago.com/checkout/tour',
        sandboxInitPoint: '',
      });

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handleMercadoPago();
      });

      expect(mockPaymentService.createMercadoPagoPreference).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Nexo Real - Tour Reservation',
          }),
        ]),
        undefined,
        'res-123',
        undefined
      );
    });

    it('should forward the reservation vendorId to createMercadoPagoPreference (FE-2)', async () => {
      mockCreatedReservationValue = {
        ...MOCK_RESERVATION,
        vendorId: 'vendor-42',
      };

      mockPaymentService.createMercadoPagoPreference.mockResolvedValue({
        preferenceId: 'mp-pref-vendor',
        initPoint: 'https://mercadopago.com/checkout/vendor',
        sandboxInitPoint: '',
      });

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handleMercadoPago();
      });

      expect(mockPaymentService.createMercadoPagoPreference).toHaveBeenCalledWith(
        expect.any(Array),
        undefined,
        'res-123',
        'vendor-42'
      );
      expect(mockPaymentService.redirectToMercadoPago).toHaveBeenCalledWith(
        'https://mercadopago.com/checkout/vendor'
      );
    });

    it('should pass undefined vendorId for reservations without a vendor (FE-2)', async () => {
      mockPaymentService.createMercadoPagoPreference.mockResolvedValue({
        preferenceId: 'mp-pref-1',
        initPoint: 'https://mercadopago.com/checkout/abc',
        sandboxInitPoint: '',
      });

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handleMercadoPago();
      });

      expect(mockPaymentService.createMercadoPagoPreference).toHaveBeenCalledWith(
        expect.any(Array),
        undefined,
        'res-123',
        undefined
      );
    });

    it('should show the vendor-not-connected aviso on CONNECT_MP_REQUIRED (FE-2)', async () => {
      mockCreatedReservationValue = {
        ...MOCK_RESERVATION,
        vendorId: 'vendor-42',
      };

      mockPaymentService.createMercadoPagoPreference.mockRejectedValue({
        response: {
          data: {
            success: false,
            error: {
              code: 'CONNECT_MP_REQUIRED',
              message: 'vendor must connect MercadoPago first',
            },
          },
          status: 400,
        },
      });

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handleMercadoPago();
      });

      expect(mockSetPaymentError).toHaveBeenCalledWith(
        'El negocio aún no conecta MercadoPago. Podés pagar con PayPal o con tu billetera.'
      );
    });

    it('should handle API error for MercadoPago', async () => {
      mockPaymentService.createMercadoPagoPreference.mockRejectedValue(
        new Error('MP service down')
      );

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      await act(async () => {
        await result.current.handleMercadoPago();
      });

      expect(mockSetPaymentError).toHaveBeenCalledWith('Error al procesar el pago');
    });
  });

  // ── Processing State ─────────────────────────────────────────────────────

  describe('processing state', () => {
    it('should set processing method to paypal during PayPal flow', async () => {
      // Keep the promise unresolved to check intermediate state
      mockPaymentService.createPayPalOrder.mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      // Start the payment but don't await it
      act(() => {
        result.current.handlePayPal();
      });

      expect(result.current.processingMethod).toBe('paypal');
    });

    it('should set processing method to mercadopago during MP flow', async () => {
      mockPaymentService.createMercadoPagoPreference.mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      const { result } = renderHook(() => usePayment(MOCK_BREAKDOWN));

      act(() => {
        result.current.handleMercadoPago();
      });

      expect(result.current.processingMethod).toBe('mercadopago');
    });
  });
});
