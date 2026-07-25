/**
 * @fileoverview OrderDetailPage - Read-only order detail view
 * @description Displays full order details including order number (copyable),
 *              status badge, product summary, payment method, and commission info.
 *              Separate from OrderSuccess — no celebration animation.
 * @module pages/orders/OrderDetailPage
 *
 * OrderDetailPage - Vista de detalle de orden solo lectura
 * @description Muestra los detalles completos de la orden incluyendo número de orden
 *              (copiable), badge de estado, resumen del producto, método de pago
 *              e información de comisión. Separada de OrderSuccess — sin animación.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Copy, Check, ShoppingBag, CreditCard } from 'lucide-react';
import { orderService } from '@/services/api';
import type { Order } from '@/types';
import { OrderStatus } from '@/components/OrderStatus';
import { OrderSummary } from '@/components/OrderSummary';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * CardSkeleton - Loading placeholder for order detail
 * CardSkeleton - Placeholder de carga para detalle de orden
 */
function CardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40" />
          <div className="border-t border-slate-700 pt-4">
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Get a human-readable label for a payment method
 * Obtener una etiqueta legible para un método de pago
 */
function getPaymentMethodLabel(method: string, t: (key: string) => string): string {
  const labels: Record<string, string> = {
    credit_card: t('checkout.paymentMethods.credit_card') || 'Credit Card',
    debit_card: t('checkout.paymentMethods.debit_card') || 'Debit Card',
    simulated: t('checkout.paymentMethods.simulated') || 'Simulated',
    paypal: t('checkout.paymentMethods.paypal') || 'PayPal',
    mercadopago: t('checkout.paymentMethods.mercadopago') || 'Mercado Pago',
  };
  return labels[method] || method;
}

/**
 * Get an icon name hint for a payment method
 * Obtener un icono representativo para un método de pago
 */
function getPaymentMethodColor(method: string): string {
  const colors: Record<string, string> = {
    credit_card: 'text-blue-400',
    debit_card: 'text-blue-400',
    simulated: 'text-yellow-400',
    paypal: 'text-blue-500',
    mercadopago: 'text-sky-400',
  };
  return colors[method] || 'text-slate-400';
}

/**
 * OrderDetailPage component - Read-only order detail
 * Componente OrderDetailPage - Detalle de orden solo lectura
 */
export function OrderDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /**
   * Fetch order data
   * Obtener datos de la orden
   */
  const fetchOrder = useCallback(async () => {
    if (!id) {
      setError(t('orders.error'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const orderData = await orderService.getOrder(id);
      setOrder(orderData);
    } catch (err) {
      console.error('Failed to load order:', err);
      setError(t('orders.error'));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  // Initial load
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /**
   * Copy order number to clipboard
   * Copiar número de orden al portapapeles
   */
  const handleCopyOrderNumber = useCallback(() => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [order]);

  // -- Loading state --
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // -- Error / Not found state --
  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 py-8" aria-live="polite">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">
            {t('orders.orderNotFound') || 'Order not found'}
          </h1>
          <p className="mb-6 text-slate-400">
            {t('orders.orderNotFoundHint') ||
              "The order you're looking for doesn't exist or you don't have access to it."}
          </p>
          <Button onClick={() => navigate('/orders')} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('orders.backToOrders') || 'Back to Orders'}
          </Button>
        </div>
      </div>
    );
  }

  // -- Data state --
  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          to="/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('orders.backToOrders') || 'Back to Orders'}
        </Link>

        {/* Order detail card */}
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShoppingBag className="h-5 w-5 text-purple-400" />
              {t('orders.details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order number (copyable) */}
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t('orders.orderNumber')}
                </p>
                <p className="mt-1 font-mono text-lg text-white">#{order.orderNumber}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyOrderNumber}
                title={t('common.copy')}
                className="text-slate-400 hover:text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Status badge */}
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {t('orders.status')}
              </p>
              <OrderStatus status={order.status} />
            </div>

            {/* Payment method */}
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {t('orders.paymentMethod')}
              </p>
              <div className="flex items-center gap-2">
                <CreditCard className={cn('h-4 w-4', getPaymentMethodColor(order.paymentMethod))} />
                <span className="text-sm text-white">
                  {getPaymentMethodLabel(order.paymentMethod, t)}
                </span>
              </div>
            </div>

            {/* Order Summary with commission */}
            <div className="pt-2">
              <OrderSummary order={order} showCommission={true} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OrderDetailPage;
