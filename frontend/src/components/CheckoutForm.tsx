/**
 * @fileoverview CheckoutForm Component - Payment form
 * @description Form component for payment with PayPal, MercadoPago, and simulated payment options, terms checkbox, and confirm button
 * @module components/CheckoutForm
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CreditCard, AlertTriangle, Loader2, Check, ExternalLink } from 'lucide-react';
import type { PaymentMethod } from '../types';
import { cn } from '../utils/cn';
import { paymentService } from '../services/paymentService';
import type { MPItem } from '../services/paymentService';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
const MP_SANDBOX = import.meta.env.VITE_MP_SANDBOX === 'true' || import.meta.env.DEV;

/**
 * Data returned after a successful PayPal capture
 * Datos devueltos después de una captura exitosa de PayPal
 */
interface PayPalSuccessData {
  orderId: string;
  internalOrderId?: string;
}

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
  onPayPalSuccess?: (data: PayPalSuccessData) => void;
  /** Product data needed to build MP preference items */
  productId?: string;
  productName?: string;
}

/**
 * PayPalButton Props
 */
interface PayPalButtonProps {
  isProcessing: boolean;
  agreedToTerms: boolean;
  currency: string;
  total: number;
  onPayPalSuccess?: (data: PayPalSuccessData) => void;
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
        createOrder={async () => {
          // Route through our backend so custom_id (userId) is set on the PayPal order.
          // Without this, the webhook cannot identify the user.
          // Se enruta por nuestro backend para que custom_id (userId) se establezca en la orden de PayPal.
          const response = await paymentService.createPayPalOrder({
            amount: total,
            currency,
            description: t('checkout.paypalDescription'),
          });
          return response.data.orderId;
        }}
        onApprove={async (data, _actions) => {
          try {
            // Capture must go through our backend for validation.
            // Never trust a client-side capture result — the backend verifies
            // the payment status with PayPal before updating the order.
            const result = await paymentService.completeWithPayPal({
              orderId: data.orderID,
            });
            if (result.success) {
              onPayPalSuccess?.({
                orderId: result.data.orderId,
                internalOrderId: result.data.internalOrderId,
              });
            } else {
              onError?.(t('checkout.paypalCaptureError'));
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
 * Available payment methods
 */
const paymentMethods: { value: PaymentMethod; icon: React.ReactNode; labelKey: string }[] = [
  {
    value: 'mercadopago',
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-extrabold text-white bg-[#009ee3]">
        MP
      </span>
    ),
    labelKey: 'checkout.paymentMethods.mercadopago',
  },
  {
    value: 'paypal',
    icon: <span className="text-lg font-bold">P</span>,
    labelKey: 'checkout.paymentMethods.paypal',
  },
  {
    value: 'simulated',
    icon: <CreditCard className="h-5 w-5" />,
    labelKey: 'checkout.paymentMethods.simulated',
  },
];

/**
 * CheckoutForm component - Payment form with PayPal, MercadoPago, and simulated payment
 * Componente de formulario de pago - Formulario de pago con PayPal, MercadoPago y opción simulada
 */
export function CheckoutForm({
  onSubmit,
  isProcessing = false,
  error,
  className,
  total = 0,
  currency = 'USD',
  onPayPalSuccess,
  productId,
  productName,
}: CheckoutFormProps) {
  const { t } = useTranslation();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('mercadopago');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);

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

  /**
   * Handles MercadoPago redirect flow:
   * 1. Creates a Checkout Pro preference via backend
   * 2. Redirects to sandboxInitPoint (dev) or initPoint (prod)
   */
  const handleMercadoPagoPayment = async () => {
    if (!agreedToTerms) {
      setTermsError(true);
      return;
    }

    setTermsError(false);
    setMpError(null);
    setMpLoading(true);

    try {
      const items: MPItem[] = [
        {
          id: productId ?? 'product',
          title: productName ?? t('checkout.paypalDescription'),
          quantity: 1,
          unit_price: total,
          currency_id: currency,
        },
      ];

      const preference = await paymentService.createMercadoPagoPreference(items);
      const redirectUrl = MP_SANDBOX ? preference.sandboxInitPoint : preference.initPoint;
      paymentService.redirectToMercadoPago(redirectUrl);
    } catch (err) {
      console.error('MercadoPago preference creation failed:', err);
      setMpError(t('checkout.mpError'));
    } finally {
      setMpLoading(false);
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
                  {t(method.labelKey)}
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

        {/* MercadoPago Info Banner */}
        {selectedPayment === 'mercadopago' && (
          <div className="flex items-start gap-3 rounded-lg border border-[#009ee3]/30 bg-[#009ee3]/10 p-4">
            <ExternalLink className="h-5 w-5 shrink-0 text-[#009ee3]" />
            <p className="text-sm text-slate-200">{t('checkout.mpRedirectInfo')}</p>
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

        {/* MercadoPago Error */}
        {mpError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-sm text-red-300">{mpError}</p>
          </div>
        )}

        {/* MercadoPago Button */}
        {selectedPayment === 'mercadopago' && (
          <button
            type="button"
            onClick={handleMercadoPagoPayment}
            disabled={isProcessing || mpLoading || !agreedToTerms}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-lg font-semibold',
              'bg-[#009ee3] text-white transition-all',
              'hover:bg-[#0082c4] hover:shadow-lg hover:shadow-[#009ee3]/25',
              'disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-[#009ee3] focus:ring-offset-2 focus:ring-offset-slate-800'
            )}
          >
            {mpLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('checkout.processing')}
              </>
            ) : (
              <>
                <ExternalLink className="h-5 w-5" />
                {t('checkout.payWithMercadoPago')}
              </>
            )}
          </button>
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
