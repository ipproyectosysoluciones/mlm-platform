/**
 * @fileoverview ReservationFlowPage - 4-step reservation wizard with price display and payment
 * @description Handles the complete reservation flow: dates → guests → confirmation → payment
 *               Maneja el flujo completo de reserva: fechas → huéspedes → confirmación → pago
 * @module pages/ReservationFlowPage
 * @author Nexo Real Development Team
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Compass,
  Loader2,
  AlertCircle,
  CreditCard,
  Wallet,
  Shield,
  Clock,
} from 'lucide-react';
import { useReservationWizard } from '../stores/reservationStore';
import { computePriceBreakdown, formatPrice } from '../stores/reservationStore';
import type { WizardStep, PriceBreakdown } from '../stores/reservationStore';
import { paymentService } from '../services/paymentService';
import { useWalletBalance } from '../stores/walletStore';
import { cn } from '../lib/utils';

// ============================================
// Constants / Constantes
// ============================================

/**
 * All wizard steps including the new payment step
 * Todos los pasos del wizard incluyendo el nuevo paso de pago
 */
const STEPS: { id: WizardStep; labelKey: string }[] = [
  { id: 'dates', labelKey: 'reservation.dates' },
  { id: 'guests', labelKey: 'reservation.guests' },
  { id: 'confirm', labelKey: 'reservation.confirmation' },
  { id: 'payment', labelKey: 'reservation.payment' },
];

const STEP_ORDER: WizardStep[] = ['dates', 'guests', 'confirm', 'payment'];

// ============================================
// PriceBadge - Inline price indicator
// ============================================

/**
 * Compact price badge shown throughout the wizard
 * Badge compacto de precio mostrado a lo largo del wizard
 */
interface PriceBadgeProps {
  breakdown: PriceBreakdown;
  compact?: boolean;
}

function PriceBadge({ breakdown, compact = false }: PriceBadgeProps) {
  const { t } = useTranslation();

  if (breakdown.totalPrice <= 0 && breakdown.isProperty) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-emerald-200 bg-emerald-50/50',
        compact ? 'px-3 py-2' : 'px-4 py-3'
      )}
    >
      {breakdown.isProperty ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            {t('reservation.pricePerNight')}:{' '}
            <span className="font-semibold text-slate-800">
              {formatPrice(breakdown.pricePerUnit, breakdown.currency)}
            </span>
          </span>
          {breakdown.totalNights > 0 && (
            <span className="text-sm font-bold text-emerald-600">
              {t('reservation.total')}: {formatPrice(breakdown.totalPrice, breakdown.currency)}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            {t('reservation.pricePerPerson')}:{' '}
            <span className="font-semibold text-slate-800">
              {formatPrice(breakdown.pricePerUnit, breakdown.currency)}
            </span>
          </span>
          <span className="text-sm font-bold text-emerald-600">
            {t('reservation.total')}: {formatPrice(breakdown.totalPrice, breakdown.currency)}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// PriceBreakdownCard - Full breakdown for confirmation
// ============================================

/**
 * Detailed price breakdown card for the confirmation/payment steps
 * Tarjeta de desglose de precio detallado para pasos de confirmación/pago
 */
interface PriceBreakdownCardProps {
  breakdown: PriceBreakdown;
}

function PriceBreakdownCard({ breakdown }: PriceBreakdownCardProps) {
  const { t } = useTranslation();
  const { currency } = breakdown;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-emerald-500" />
        {t('reservation.priceBreakdown')}
      </h3>

      <div className="space-y-2 text-sm">
        {/* Price per unit */}
        <div className="flex justify-between text-slate-600">
          <span>
            {breakdown.isProperty
              ? t('reservation.pricePerNight')
              : t('reservation.pricePerPerson')}
          </span>
          <span className="font-medium text-slate-800">
            {formatPrice(breakdown.pricePerUnit, currency)}
          </span>
        </div>

        {/* Nights (only for properties) */}
        {breakdown.isProperty && (
          <div className="flex justify-between text-slate-600">
            <span>{t('reservation.totalNights', { count: breakdown.totalNights })}</span>
            <span className="font-medium text-slate-800">× {breakdown.totalNights}</span>
          </div>
        )}

        {/* Subtotal */}
        {breakdown.isProperty && breakdown.guestCount > 1 && (
          <div className="flex justify-between text-slate-600">
            <span>{t('reservation.subtotal')}</span>
            <span className="font-medium text-slate-800">
              {formatPrice(breakdown.subtotal, currency)}
            </span>
          </div>
        )}

        {/* Guests */}
        {breakdown.guestCount > 1 && (
          <div className="flex justify-between text-slate-600">
            <span>{t('reservation.totalGuests', { count: breakdown.guestCount })}</span>
            <span className="font-medium text-slate-800">× {breakdown.guestCount}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 pt-2 mt-2">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-slate-800">{t('reservation.total')}</span>
            <span className="text-lg font-bold text-emerald-600">
              {formatPrice(breakdown.totalPrice, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Step indicator / Indicador de pasos
// ============================================

interface StepIndicatorProps {
  currentStep: WizardStep;
  /** Steps to show (tour skips 'dates') / Pasos a mostrar (tour omite 'dates') */
  visibleSteps: typeof STEPS;
}

function StepIndicator({ currentStep, visibleSteps }: StepIndicatorProps) {
  const { t } = useTranslation();
  const visibleOrder = visibleSteps.map((s) => s.id);
  const currentIndex = visibleOrder.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {visibleSteps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                  isDone && 'bg-emerald-500 border-emerald-500 text-white',
                  isCurrent && 'bg-white border-emerald-500 text-emerald-600',
                  !isDone && !isCurrent && 'bg-white border-slate-200 text-slate-400'
                )}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 whitespace-nowrap',
                  isCurrent ? 'text-emerald-600 font-medium' : 'text-slate-400'
                )}
              >
                {t(step.labelKey)}
              </span>
            </div>
            {i < visibleSteps.length - 1 && (
              <div
                className={cn(
                  'w-12 sm:w-16 h-0.5 mb-4 mx-1 transition-all',
                  i < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Step 1: Dates (property only)
// ============================================

function StepDates() {
  const { t } = useTranslation();
  const { wizardData, updateWizardData, setWizardStep } = useReservationWizard();

  const breakdown = useMemo(() => computePriceBreakdown(wizardData), [wizardData]);

  if (!wizardData || wizardData.type !== 'property') return null;

  const canContinue = wizardData.checkIn && wizardData.checkOut;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">{t('reservation.selectDates')}</h2>
        <p className="text-slate-500 text-sm">
          {t('reservation.property')}:{' '}
          <span className="font-medium text-slate-700">{wizardData.property.title}</span>
        </p>
      </div>

      {/* Price per night indicator */}
      {breakdown && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <span className="text-sm text-slate-600">
            {t('reservation.pricePerNight')}:{' '}
            <span className="font-bold text-emerald-600">
              {formatPrice(breakdown.pricePerUnit, breakdown.currency)}
            </span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('reservation.checkIn')}
          </label>
          <input
            type="date"
            value={wizardData.checkIn}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => updateWizardData({ checkIn: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('reservation.checkOut')}
          </label>
          <input
            type="date"
            value={wizardData.checkOut}
            min={wizardData.checkIn || new Date().toISOString().split('T')[0]}
            onChange={(e) => updateWizardData({ checkOut: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Running total after selecting dates */}
      {breakdown && breakdown.totalNights > 0 && <PriceBadge breakdown={breakdown} />}

      <button
        onClick={() => setWizardStep('guests')}
        disabled={!canContinue}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('reservation.continue')}
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ============================================
// Step 2: Guests
// ============================================

function StepGuests() {
  const { t } = useTranslation();
  const {
    wizardData,
    updateWizardData,
    setWizardStep,
    isCreating,
    createError,
    confirmReservation,
  } = useReservationWizard();

  const breakdown = useMemo(() => computePriceBreakdown(wizardData), [wizardData]);

  if (!wizardData) return null;

  const maxGuests = wizardData.type === 'tour' ? wizardData.availability.availableSpots : 20;

  const handleConfirm = async () => {
    try {
      await confirmReservation();
    } catch {
      // Error is already captured in createError state by the store.
      // El store captura el error en createError — no se necesita manejo adicional aquí.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">{t('reservation.howManyGuests')}</h2>
        {wizardData.type === 'property' ? (
          <p className="text-slate-500 text-sm">
            {t('reservation.property')}:{' '}
            <span className="font-medium text-slate-700">{wizardData.property.title}</span>
          </p>
        ) : (
          <p className="text-slate-500 text-sm">
            {t('reservation.tour')}:{' '}
            <span className="font-medium text-slate-700">{wizardData.tour.title}</span>
            {' · '}
            {new Date(wizardData.availability.date).toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        )}
      </div>

      {/* Guest counter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" />
          {t('reservation.numberOfGuests')}
        </label>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => updateWizardData({ guests: Math.max(1, wizardData.guests - 1) })}
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-lg font-medium"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold text-lg text-slate-800">
            {wizardData.guests}
          </span>
          <button
            onClick={() => updateWizardData({ guests: Math.min(maxGuests, wizardData.guests + 1) })}
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-lg font-medium"
          >
            +
          </button>
        </div>
      </div>

      {/* Running price total */}
      {breakdown && breakdown.totalPrice > 0 && <PriceBadge breakdown={breakdown} />}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t('reservation.additionalNotes')}{' '}
          <span className="text-slate-400 font-normal">({t('reservation.optional')})</span>
        </label>
        <textarea
          value={wizardData.notes}
          onChange={(e) => updateWizardData({ notes: e.target.value })}
          placeholder={t('reservation.additionalNotesHint')}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 resize-none"
        />
      </div>

      {/* Error */}
      {createError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {createError}
        </div>
      )}

      <div className="flex gap-3">
        {wizardData.type === 'property' && (
          <button
            onClick={() => setWizardStep('dates')}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('reservation.back')}
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={isCreating}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('reservation.confirming')}
            </>
          ) : (
            <>
              {t('reservation.confirmReservation')}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 3: Confirmation (success + proceed to payment)
// ============================================

interface StepConfirmProps {
  onGoToPayment: () => void;
  onGoToReservations: () => void;
  breakdown: PriceBreakdown | null;
}

function StepConfirm({ onGoToPayment, onGoToReservations, breakdown }: StepConfirmProps) {
  const { t } = useTranslation();
  const { createdReservation, wizardData } = useReservationWizard();

  return (
    <div className="space-y-6 py-2">
      {/* Success header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {t('reservation.reservationConfirmed')}
        </h2>
        <p className="text-slate-500 text-sm">{t('reservation.reservationConfirmedDesc')}</p>
      </div>

      {/* Reservation details */}
      {createdReservation && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{t('reservation.reservationId')}:</span>{' '}
            <span className="font-mono text-xs">{createdReservation.id}</span>
          </p>
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{t('reservation.status')}:</span>{' '}
            <span className="capitalize">{createdReservation.status}</span>
          </p>
          {wizardData?.type === 'property' && (
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{t('reservation.property')}:</span>{' '}
              {wizardData.property.title}
            </p>
          )}
          {wizardData?.type === 'tour' && (
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{t('reservation.tour')}:</span>{' '}
              {wizardData.tour.title}
            </p>
          )}
        </div>
      )}

      {/* Price breakdown card */}
      {breakdown && breakdown.totalPrice > 0 && <PriceBreakdownCard breakdown={breakdown} />}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onGoToPayment}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          <CreditCard className="w-5 h-5" />
          {t('reservation.selectPayment')}
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={onGoToReservations}
          className="w-full py-3 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm"
        >
          {t('reservation.payLater')}
          <span className="ml-2 text-slate-400">— {t('reservation.payLaterHint')}</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 4: Payment method selector
// ============================================

interface StepPaymentProps {
  onDone: () => void;
  onGoToReservations: () => void;
  breakdown: PriceBreakdown | null;
}

function StepPayment({ onDone, onGoToReservations, breakdown }: StepPaymentProps) {
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

  const walletBalance = balance?.balance ?? 0;
  const walletCurrency = balance?.currency ?? 'USD';
  const totalPrice = breakdown?.totalPrice ?? 0;
  const currency = breakdown?.currency ?? 'USD';
  const hasEnoughBalance = walletBalance >= totalPrice && totalPrice > 0;

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
        createdReservation.id
      );

      paymentService.redirectToMercadoPago(result.initPoint);
    } catch {
      setPaymentError(t('reservation.paymentError'));
    } finally {
      setPaymentProcessing(false);
      setProcessingMethod(null);
    }
  }, [createdReservation, breakdown, setPaymentProcessing, setPaymentError, t]);

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-1">{t('reservation.selectPayment')}</h2>
        <p className="text-slate-500 text-sm">{t('reservation.selectPaymentDesc')}</p>
      </div>

      {/* Total amount card */}
      {breakdown && breakdown.totalPrice > 0 && <PriceBreakdownCard breakdown={breakdown} />}

      {/* Payment error */}
      {paymentError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {paymentError}
        </div>
      )}

      {/* Payment methods */}
      <div className="space-y-3">
        {/* PayPal */}
        <button
          onClick={handlePayPal}
          disabled={isProcessingPayment}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-bold text-lg">PP</span>
          </div>
          <div className="flex-1 text-left">
            <span className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
              {t('reservation.payWithPaypal')}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">{formatPrice(totalPrice, currency)}</p>
          </div>
          {processingMethod === 'paypal' ? (
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          )}
        </button>

        {/* MercadoPago */}
        <button
          onClick={handleMercadoPago}
          disabled={isProcessingPayment}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-sky-600 font-bold text-lg">MP</span>
          </div>
          <div className="flex-1 text-left">
            <span className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
              {t('reservation.payWithMercadopago')}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">{formatPrice(totalPrice, currency)}</p>
          </div>
          {processingMethod === 'mercadopago' ? (
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          )}
        </button>

        {/* Wallet */}
        <button
          onClick={onDone}
          disabled={!hasEnoughBalance || isProcessingPayment}
          className={cn(
            'w-full flex items-center gap-4 p-4 rounded-xl border transition-all group',
            hasEnoughBalance
              ? 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
              : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
          )}
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 text-left">
            <span
              className={cn(
                'font-semibold',
                hasEnoughBalance
                  ? 'text-slate-800 group-hover:text-emerald-700 transition-colors'
                  : 'text-slate-500'
              )}
            >
              {t('reservation.payWithWallet')}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasEnoughBalance
                ? t('reservation.walletBalance', {
                    balance: formatPrice(walletBalance, walletCurrency),
                  })
                : t('reservation.insufficientBalance')}
            </p>
          </div>
          {hasEnoughBalance ? (
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          ) : (
            <AlertCircle className="w-5 h-5 text-slate-300" />
          )}
        </button>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 justify-center text-xs text-slate-400">
        <Shield className="w-3.5 h-3.5" />
        <span>
          {t('reservation.secure')} — {t('reservation.secureDesc')}
        </span>
      </div>

      {/* Pay later link */}
      <div className="text-center">
        <button
          onClick={onGoToReservations}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <Clock className="w-4 h-4" />
          {t('reservation.payLater')}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Page / Página principal
// ============================================

/**
 * ReservationFlowPage component — 4-step wizard: dates → guests → confirm → payment
 * Componente de página de flujo de reserva (wizard de 4 pasos)
 */
export default function ReservationFlowPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { wizardData, wizardStep, closeWizard, setWizardStep } = useReservationWizard();

  const breakdown = useMemo(() => computePriceBreakdown(wizardData), [wizardData]);

  // If no wizard data, redirect home
  useEffect(() => {
    if (!wizardData) {
      navigate('/', { replace: true });
    }
  }, [wizardData, navigate]);

  if (!wizardData) return null;

  // Tour skips the dates step — jump directly to guests
  const effectiveStep =
    wizardData.type === 'tour' && wizardStep === 'dates' ? 'guests' : wizardStep;

  // Visible steps: tours skip 'dates'
  const visibleSteps = wizardData.type === 'tour' ? STEPS.filter((s) => s.id !== 'dates') : STEPS;

  const handleCancel = () => {
    closeWizard();
    navigate(-1);
  };

  const contextIcon =
    wizardData.type === 'property' ? (
      <MapPin className="w-5 h-5 text-emerald-500" />
    ) : (
      <Compass className="w-5 h-5 text-emerald-500" />
    );

  const contextLabel =
    wizardData.type === 'property' ? wizardData.property.title : wizardData.tour.title;

  const showCancelBtn = effectiveStep !== 'confirm' && effectiveStep !== 'payment';

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {contextIcon}
            <span className="font-medium line-clamp-1">{contextLabel}</span>
          </div>
          {showCancelBtn && (
            <button
              onClick={handleCancel}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {t('reservation.cancel')}
            </button>
          )}
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={effectiveStep} visibleSteps={visibleSteps} />

        {/* Step content */}
        {effectiveStep === 'dates' && <StepDates />}
        {effectiveStep === 'guests' && <StepGuests />}
        {effectiveStep === 'confirm' && (
          <StepConfirm
            onGoToPayment={() => setWizardStep('payment')}
            onGoToReservations={() => {
              closeWizard();
              navigate('/mis-reservas');
            }}
            breakdown={breakdown}
          />
        )}
        {effectiveStep === 'payment' && (
          <StepPayment
            onDone={() => {
              closeWizard();
              navigate(wizardData.type === 'property' ? '/properties' : '/tours');
            }}
            onGoToReservations={() => {
              closeWizard();
              navigate('/mis-reservas');
            }}
            breakdown={breakdown}
          />
        )}
      </div>
    </div>
  );
}
