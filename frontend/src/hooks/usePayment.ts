/**
 * @fileoverview usePayment - Custom hook for payment processing in the reservation flow
 * @description Encapsulates payment state, wallet checks, PayPal and MercadoPago handlers
 *              Encapsula estado de pago, verificación de wallet, handlers de PayPal y MercadoPago
 * @module hooks/usePayment
 * @author Nexo Real Development Team
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useReservationWizard, formatPrice } from '../stores/reservationStore';
import type { PriceBreakdown } from '../types/reservation';
import { paymentService, getApiErrorCode } from '../services/paymentService';
import { useWalletBalance } from '../stores/walletStore';

// ============================================
// Hook / Hook
// ============================================

/**
 * usePayment — encapsulates payment processing logic for the reservation flow
 * usePayment — encapsula la lógica de procesamiento de pagos para el flujo de reserva
 *
 * @param breakdown - Current price breakdown / Desglose de precio actual
 * @returns Payment state and handlers / Estado y handlers de pago
 */
export function usePayment(breakdown: PriceBreakdown | null) {
  const { t } = useTranslation();
  const {
    createdReservation,
    isProcessingPayment,
    paymentError,
    setPaymentProcessing,
    setPaymentError,
  } = useReservationWizard();
  const { balance } = useWalletBalance();
  const [processingMethod, setProcessingMethod] = useState<string | null>(null);

  // ── Derived state / Estado derivado ──────────────────────────────────────

  const walletBalance = balance?.balance ?? 0;
  const walletCurrency = balance?.currency ?? 'USD';
  const totalPrice = breakdown?.totalPrice ?? 0;
  const hasEnoughWalletBalance = walletBalance >= totalPrice && totalPrice > 0;
  const walletBalanceDisplay = formatPrice(walletBalance, walletCurrency);

  // ── Handlers / Manejadores ───────────────────────────────────────────────

  /**
   * Handle PayPal payment / Manejar pago con PayPal
   * Creates a PayPal order and redirects the user to the approval URL
   * Crea una orden de PayPal y redirige al usuario a la URL de aprobación
   */
  const handlePayPal = useCallback(async () => {
    if (!createdReservation || !breakdown) return;
    setProcessingMethod('paypal');
    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const result = await paymentService.createPayPalOrder({
        amount: breakdown.totalPrice,
        currency: breakdown.currency,
        description: `Nexo Real - Reservation ${createdReservation.id}`,
        orderId: createdReservation.id,
      });

      if (result.data.approvalUrl) {
        window.location.href = result.data.approvalUrl;
      }
    } catch {
      setPaymentError(t('reservation.paymentError'));
    } finally {
      setPaymentProcessing(false);
      setProcessingMethod(null);
    }
  }, [createdReservation, breakdown, setPaymentProcessing, setPaymentError, t]);

  /**
   * Handle MercadoPago payment / Manejar pago con MercadoPago
   * Creates a MercadoPago preference and redirects the user to the hosted checkout
   * Crea una preferencia de MercadoPago y redirige al usuario al checkout
   */
  const handleMercadoPago = useCallback(async () => {
    if (!createdReservation || !breakdown) return;
    setProcessingMethod('mercadopago');
    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const itemTitle = createdReservation.propertyId
        ? `Nexo Real - Property Reservation`
        : `Nexo Real - Tour Reservation`;

      const result = await paymentService.createMercadoPagoPreference(
        [
          {
            id: createdReservation.id,
            title: itemTitle,
            quantity: 1,
            unit_price: breakdown.totalPrice,
            currency_id: breakdown.currency,
          },
        ],
        undefined,
        createdReservation.id,
        // B12 (FE-2): forward the vendor so the backend charges the business
        // account (MarketplaceSplitService.resolveToken). Absent vendor → platform flow.
        createdReservation.vendorId
      );

      paymentService.redirectToMercadoPago(result.initPoint);
    } catch (err) {
      // B12 (FE-2): a vendor without a connected MercadoPago account is a
      // distinct, actionable case — surface a dedicated aviso instead of the
      // generic error so the guest can choose PayPal or wallet.
      if (getApiErrorCode(err) === 'CONNECT_MP_REQUIRED') {
        setPaymentError(t('reservation.mpVendorNotConnected'));
      } else {
        setPaymentError(t('reservation.paymentError'));
      }
    } finally {
      setPaymentProcessing(false);
      setProcessingMethod(null);
    }
  }, [createdReservation, breakdown, setPaymentProcessing, setPaymentError, t]);

  // ── Return / Retorno ─────────────────────────────────────────────────────

  return {
    /** Which payment method is currently processing (null if none) */
    processingMethod,
    /** Whether any payment is being processed */
    isProcessingPayment,
    /** Payment error message, if any */
    paymentError,
    /** Whether wallet balance covers the total price */
    hasEnoughWalletBalance,
    /** Formatted wallet balance display string */
    walletBalanceDisplay,
    /** Trigger PayPal payment flow */
    handlePayPal,
    /** Trigger MercadoPago payment flow */
    handleMercadoPago,
  } as const;
}
