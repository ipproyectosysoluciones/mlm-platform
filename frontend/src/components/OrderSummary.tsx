/**
 * @fileoverview OrderSummary Component - Order details card
 * @description Card component displaying order details with product, price breakdown, and total
 * @module components/OrderSummary
 */

import { useTranslation } from 'react-i18next';
import { ShoppingBag, Calendar } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';
import { PriceDisplay } from './PriceDisplay';
import type { Product, Order } from '../types';
import { cn } from '../utils/cn';

/**
 * OrderSummary props
 */
interface OrderSummaryProps {
  product?: Product;
  order?: Order;
  showCommission?: boolean;
  className?: string;
}

/**
 * Calculate commission amount (10% sponsor)
 */
function calculateCommission(amount: number): number {
  return amount * 0.1;
}

/**
 * OrderSummary component - Displays order details card
 * Componente de resumen de orden - Muestra tarjeta de detalles de la orden
 */
export function OrderSummary({
  product,
  order,
  showCommission = true,
  className,
}: OrderSummaryProps) {
  const { t } = useTranslation();

  // If we have an order, use its data; otherwise use product data
  const displayAmount = order?.amount ?? product?.price ?? 0;
  const displayCurrency = order?.currency ?? product?.currency ?? 'USD';
  const displayProduct = order?.product ?? product;
  const commission = showCommission ? calculateCommission(displayAmount) : 0;
  const total = displayAmount;

  // If nothing to display, return null
  if (!displayProduct) return null;

  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-slate-700 bg-slate-800', className)}
    >
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 px-5 py-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <ShoppingBag className="h-5 w-5 text-purple-400" />
          {t('checkout.orderSummary')}
        </h3>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 p-5">
        {/* Product Info */}
        <div className="flex gap-4">
          {/* Product Image Placeholder */}
          <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-slate-700">
            <span className="text-2xl font-bold text-slate-500">
              {displayProduct.name.charAt(0)}
            </span>
          </div>

          {/* Product Details */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <h4 className="font-semibold text-white">{displayProduct.name}</h4>
              <div className="mt-1">
                <PlatformBadge platform={displayProduct.platform} size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t('products.days', { count: displayProduct.durationDays })}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700" />

        {/* Price Breakdown */}
        <div className="flex flex-col gap-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{t('checkout.subtotal')}</span>
            <PriceDisplay
              amount={displayAmount}
              currency={displayCurrency}
              size="sm"
              className="text-white"
            />
          </div>

          {/* Commission (if shown) */}
          {showCommission && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                {t('checkout.commission')}
                <span className="ml-1 text-xs text-green-400">(10%)</span>
              </span>
              <PriceDisplay
                amount={commission}
                currency={displayCurrency}
                size="sm"
                className="text-green-400"
              />
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-700 pt-3" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-white">{t('checkout.total')}</span>
            <PriceDisplay
              amount={total}
              currency={displayCurrency}
              size="lg"
              className="text-green-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;
