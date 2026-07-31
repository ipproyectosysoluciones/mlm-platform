/**
 * @fileoverview StepPayment - Payment method selector step for the reservation wizard
 * @description Fourth step in the reservation flow: select payment method (PayPal, MercadoPago, Wallet)
 *               Cuarto paso del flujo de reserva: seleccionar método de pago (PayPal, MercadoPago, Wallet)
 * @module components/reservation/step-payment
 * @author Nexo Real Development Team
 */

import { useTranslation } from 'react-i18next';
import { Wallet, Shield, Clock, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { formatPrice } from '../../stores/reservationStore';
import type { PriceBreakdown } from '../../types/reservation';
import PriceBreakdownCard from './price-breakdown-card';
import { featureFlags } from '../../utils/featureFlags';
import { cn } from '../../lib/utils';

// ============================================
// Props / Propiedades
// ============================================

export interface StepPaymentProps {
  onDone: () => void;
  onGoToReservations: () => void;
  breakdown: PriceBreakdown | null;

  // From usePayment hook
  processingMethod: string | null;
  isProcessingPayment: boolean;
  paymentError: string | null;
  hasEnoughWalletBalance: boolean;
  walletBalanceDisplay: string;
  onPayPal: () => void;
  onMercadoPago: () => void;
}

// ============================================
// Component / Componente
// ============================================

/**
 * Payment method selection step — wizard step 4, choose PayPal, MercadoPago or Wallet
 * Paso de selección de método de pago — paso 4 del wizard
 */
export default function StepPayment({
  onDone,
  onGoToReservations,
  breakdown,
  processingMethod,
  isProcessingPayment,
  paymentError,
  hasEnoughWalletBalance,
  walletBalanceDisplay,
  onPayPal,
  onMercadoPago,
}: StepPaymentProps) {
  const { t } = useTranslation();

  const totalPrice = breakdown?.totalPrice ?? 0;
  const currency = breakdown?.currency ?? 'USD';

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
      <div className="relative space-y-3">
        {/* PayPal */}
        <Button
          variant="outline"
          onClick={onPayPal}
          disabled={isProcessingPayment}
          className="w-full flex items-center gap-4 p-4 rounded-xl h-auto hover:border-emerald-300 hover:bg-emerald-50/30 group"
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
        </Button>

        {/* MercadoPago */}
        <Button
          variant="outline"
          onClick={onMercadoPago}
          disabled={isProcessingPayment}
          className="w-full flex items-center gap-4 p-4 rounded-xl h-auto hover:border-emerald-300 hover:bg-emerald-50/30 group"
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
        </Button>

        {/* Wallet (hidden when crypto wallet feature is disabled) */}
        {featureFlags.cryptoWallet && (
          <Button
            variant="outline"
            onClick={onDone}
            disabled={!hasEnoughWalletBalance || isProcessingPayment}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl h-auto group',
              hasEnoughWalletBalance
                ? 'hover:border-emerald-300 hover:bg-emerald-50/30'
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
                  hasEnoughWalletBalance
                    ? 'text-slate-800 group-hover:text-emerald-700 transition-colors'
                    : 'text-slate-500'
                )}
              >
                {t('reservation.payWithWallet')}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasEnoughWalletBalance
                  ? t('reservation.walletBalance', {
                      balance: walletBalanceDisplay,
                    })
                  : t('reservation.insufficientBalance')}
              </p>
            </div>
            {hasEnoughWalletBalance ? (
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            ) : (
              <AlertCircle className="w-5 h-5 text-slate-300" />
            )}
          </Button>
        )}

        {/* Payment processing overlay / Overlay de procesamiento de pago */}
        {isProcessingPayment && (
          <div
            data-testid="payment-loading-overlay"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm"
          >
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-sm font-medium text-slate-700">{t('loading.processingPayment')}</p>
          </div>
        )}
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
        <Button
          variant="ghost"
          onClick={onGoToReservations}
          className="gap-2 text-sm text-slate-500 hover:text-emerald-600"
        >
          <Clock className="w-4 h-4" />
          {t('reservation.payLater')}
        </Button>
      </div>
    </div>
  );
}
