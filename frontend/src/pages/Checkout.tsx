/**
 * @fileoverview Checkout Page - Purchase checkout flow
 * @description Checkout page with order summary, payment form, and confirmation modal
 * @module pages/Checkout
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, ArrowLeft, Check, Lock, X } from 'lucide-react';
import { OrderSummary } from '../components/OrderSummary';
import { CheckoutForm } from '../components/CheckoutForm';
import { EmptyState } from '../components/EmptyState';
import { productService, orderService } from '../services/api';
import type { Product, PaymentMethod } from '../types';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/button';

/**
 * Checkout page component
 * Componente de página de checkout
 */
export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderCreated, setOrderCreated] = useState<string | null>(null);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<PaymentMethod>('simulated');

  /**
   * Load product data
   */
  const loadProduct = useCallback(async () => {
    if (!productId) {
      setError('Product ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const productData = await productService.getProduct(productId);

      if (!productData.isActive) {
        setError(t('checkout.productUnavailable'));
        return;
      }

      setProduct(productData);
    } catch (err) {
      console.error('Failed to load product:', err);
      setError(t('products.error'));
    } finally {
      setIsLoading(false);
    }
  }, [productId, t]);

  // Initial load
  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  /**
   * Handle payment submission
   * MercadoPago redirects directly from CheckoutForm — only simulated/paypal reach this handler
   */
  const handlePayment = async (paymentMethod: PaymentMethod) => {
    if (!product) return;

    // MP redirects directly from CheckoutForm — skip the confirmation modal
    if (paymentMethod === 'mercadopago') return;

    setPendingPaymentMethod(paymentMethod);
    setShowConfirmModal(true);
  };

  /**
   * Handle confirmation modal confirm
   * @param paymentMethod - Payment method used (paypal, simulated, etc.)
   */
  const handleConfirmPurchase = async (paymentMethod: PaymentMethod = pendingPaymentMethod) => {
    if (!product) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const order = await orderService.createOrder({
        productId: product.id,
        paymentMethod,
      });

      setOrderCreated(order.id);

      // Navigate to success page after a short delay
      setTimeout(() => {
        navigate(`/orders/${order.id}/success`);
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to create order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSubmitError(t('checkout.error') + ': ' + errorMessage);
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    if (!isSubmitting) {
      setShowConfirmModal(false);
    }
  };

  /**
   * Handle back to products
   */
  const handleBackToProducts = () => {
    navigate('/products');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-slate-400">{t('products.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 py-8">
        <div className="mx-auto max-w-md">
          <EmptyState
            title={error || t('products.error')}
            description={t('checkout.productNotFound')}
            actionLabel={t('checkout.backToProducts')}
            onAction={handleBackToProducts}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Page Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToProducts}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{t('checkout.title')}</h1>
            <p className="mt-1 text-slate-400">{t('checkout.subtitle')}</p>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <div>
            <OrderSummary product={product} showCommission={true} />
          </div>

          {/* Payment Form */}
          <div className="relative">
            <CheckoutForm
              onSubmit={handlePayment}
              isProcessing={isSubmitting}
              error={submitError}
              total={product.price}
              currency={product.currency}
              onPayPalSuccess={(data) => {
                // Navigate directly to the OrderProcessing page — the webhook
                // handles Purchase + Order creation, so no confirmation modal needed.
                // Se navega directo a la página de procesamiento — el webhook
                // maneja la creación de Purchase + Order, no se necesita modal.
                navigate(
                  '/checkout/success?status=approved&payment_method=paypal&paypal_order_id=' +
                    data.orderId
                );
              }}
              productId={product.id}
              productName={product.name}
            />

            {/* Payment processing overlay / Overlay de procesamiento de pago */}
            {isSubmitting && (
              <div
                data-testid="payment-loading-overlay"
                className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-sm"
              >
                <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-3" />
                <p className="text-sm font-medium text-white">{t('loading.processingPayment')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div
              className={cn(
                'w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-800',
                'shadow-2xl'
              )}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  {t('checkout.confirmPurchase')}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="flex flex-col gap-4 p-6">
                {/* Product Summary */}
                <div className="flex gap-4 rounded-lg bg-slate-700/50 p-4">
                  <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-slate-600">
                    <span className="text-2xl font-bold text-slate-400">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between">
                    <h3 className="font-semibold text-white">{product.name}</h3>
                    <p className="text-sm text-slate-400">
                      {t('products.days', { count: product.durationDays })}
                    </p>
                    <p className="text-lg font-bold text-purple-400">
                      {product.currency} {product.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Simulated Payment Warning */}
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                  <p className="text-sm text-amber-200">{t('checkout.simulatedWarning')}</p>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                  <span className="text-lg font-semibold text-white">{t('checkout.total')}</span>
                  <span className="text-2xl font-bold text-green-400">
                    {product.currency} {product.price.toFixed(2)}
                  </span>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={() => handleConfirmPurchase(pendingPaymentMethod)}
                    disabled={isSubmitting}
                    className="flex-1 gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('checkout.processing')}
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        {t('checkout.confirmPurchase')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Created Success Overlay */}
        {orderCreated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-slate-800 p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-white">{t('checkout.success')}</p>
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
