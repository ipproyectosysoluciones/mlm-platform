/**
 * @fileoverview CheckoutForm Component - Payment form
 * @description Form component for payment with PayPal and simulated payment options, terms checkbox, and confirm button
 * @module components/CheckoutForm
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CreditCard, AlertTriangle, Loader2, Check } from 'lucide-react';
import type { PaymentMethod } from '../types';
import { cn } from '../utils/cn';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

/**
 * CheckoutForm props
 */
interface CheckoutFormProps {
  onSubmit: (paymentMethod: PaymentMethod) => Promise<void>;
  isProcessing?: boolean;
  error?: string | null;
  className?: string;
  total?: number;
  currency?: string;
  onPayPalSuccess?: (paymentMethod: PaymentMethod) => void;
}

/**
 * PayPalButton Props
 */
interface PayPalButtonProps {
  isProcessing: boolean;
  agreedToTerms: boolean;
  currency: string;
  total: number;
  onPayPalSuccess?: (paymentMethod: PaymentMethod) => void;
  onError?: (error: string) => void;
}

/**
 * PayPalButton - Moved outside CheckoutForm to prevent remount on re-render
 */
const PayPalButton = React.memo(function PayPalButton({
  isProcessing,
  agreedToTerms,
  currency,
  total,
  onPayPalSuccess,
  onError,
}: PayPalButtonProps) {
  const { t } = useTranslation();
  const isPayPalAvailable = !!PAYPAL_CLIENT_ID;

  if (!isPayPalAvailable) {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
        <p className="text-sm text-yellow-200">{t('checkout.paypalNotConfigured')}</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: currency,
        intent: 'capture',
      }}
    >
      <PayPalButtons
        style={{ layout: 'vertical', color: 'blue', shape: 'rect' }}
        disabled={isProcessing || !agreedToTerms}
        createOrder={(_data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: currency,
                  value: total.toFixed(2),
                },
                description: t('checkout.paypalDescription'),
              },
            ],
          });
        }}
        onApprove={async (_data, actions) => {
          try {
            const details = await actions.order?.capture();
            if (details) {
              onPayPalSuccess?.('paypal');
            }
          } catch (err) {
            console.error('PayPal capture error:', err);
            onError?.(t('checkout.paypalCaptureError'));
          }
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          onError?.(t('checkout.paypalError'));
        }}
      />
    </PayPalScriptProvider>
  );
});

/**
 * Payment methods
 */
const paymentMethods: { value: PaymentMethod; icon: React.ReactNode; label: string }[] = [
  { value: 'paypal', icon: <span className="text-lg font-bold">P</span>, label: 'PayPal' },
  { value: 'simulated', icon: <CreditCard className="h-5 w-5" />, label: 'Simulated' },
];

/**
 * CheckoutForm component - Payment form with PayPal and simulated payment
 * Componente de formulario de pago - Formulario de pago con PayPal y opción simulada
 */
export function CheckoutForm({
  onSubmit,
  isProcessing = false,
  error,
  className,
  total = 0,
  currency = 'USD',
  onPayPalSuccess,
}: CheckoutFormProps) {
  const { t } = useTranslation();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('paypal');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate terms
    if (!agreedToTerms) {
      setTermsError(true);
      return;
    }

    setTermsError(false);
    await onSubmit(selectedPayment);
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreedToTerms(e.target.checked);
    if (e.target.checked) {
      setTermsError(false);
    }
  };

  // Check if PayPal is available
  const isPayPalAvailable = !!PAYPAL_CLIENT_ID;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('overflow-hidden rounded-xl border border-slate-700 bg-slate-800', className)}
    >
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 px-5 py-4">
        <h3 className="text-lg font-semibold text-white">{t('checkout.paymentMethod')}</h3>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 p-5">
        {/* Payment Method Selection */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-300">
            {t('checkout.selectPayment')}
          </label>

          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <label
                key={method.value}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all',
                  selectedPayment === method.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500',
                  method.value === 'paypal' && !isPayPalAvailable && 'opacity-50'
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={selectedPayment === method.value}
                  onChange={() => setSelectedPayment(method.value)}
                  className="sr-only"
                  disabled={isProcessing || (method.value === 'paypal' && !isPayPalAvailable)}
                />
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2',
                    selectedPayment === method.value
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-slate-500'
                  )}
                >
                  {selectedPayment === method.value && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>
                <span className="flex items-center gap-3 text-white">
                  {method.icon}
                  {method.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* PayPal Button */}
        {selectedPayment === 'paypal' && (
          <div className="flex flex-col gap-2">
            <PayPalButton
              isProcessing={isProcessing}
              agreedToTerms={agreedToTerms}
              currency={currency}
              total={total}
              onPayPalSuccess={onPayPalSuccess}
              onError={setPaypalError}
            />
            {paypalError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <p className="text-sm text-red-300">{paypalError}</p>
              </div>
            )}
          </div>
        )}

        {/* Simulated Payment Warning */}
        {selectedPayment === 'simulated' && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-200">{t('checkout.simulatedWarning')}</p>
          </div>
        )}

        {/* Terms Checkbox */}
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={handleTermsChange}
              disabled={isProcessing}
              className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-800"
            />
            <span className={cn('text-sm', termsError ? 'text-red-400' : 'text-slate-300')}>
              {t('checkout.terms')}
            </span>
          </label>
          {termsError && <p className="text-sm text-red-400">{t('checkout.termsError')}</p>}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Submit Button (for simulated payment) */}
        {selectedPayment === 'simulated' && (
          <button
            type="submit"
            disabled={isProcessing || !agreedToTerms}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-lg font-semibold',
              'bg-purple-600 text-white transition-all',
              'hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25',
              'disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('checkout.processing')}
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                {t('checkout.confirmPurchase')}
              </>
            )}
          </button>
        )}

        {/* Back to Products Link */}
        <button
          type="button"
          onClick={() => window.history.back()}
          disabled={isProcessing}
          className={cn(
            'text-center text-sm text-slate-400 transition-colors',
            'hover:text-white disabled:opacity-50'
          )}
        >
          {t('checkout.backToProducts')}
        </button>
      </div>
    </form>
  );
}

export default CheckoutForm;
