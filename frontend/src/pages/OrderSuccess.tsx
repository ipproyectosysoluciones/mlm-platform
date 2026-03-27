/**
 * @fileoverview OrderSuccess Page - Purchase confirmation
 * @description Purchase success page with checkmark animation, order details, commission info, and CTA buttons
 * @module pages/OrderSuccess
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Check,
  ShoppingBag,
  Home,
  FileText,
  Copy,
  Check as CheckCopied,
} from 'lucide-react';
import { OrderSummary } from '../components/OrderSummary';
import { OrderStatus } from '../components/OrderStatus';
import { orderService } from '../services/api';
import type { Order } from '../types';
import { cn } from '../utils/cn';

/**
 * Commission breakdown by level
 */
interface CommissionBreakdown {
  level: number;
  percentage: number;
  amount: number;
  description: string;
}

/**
 * Animated checkmark component
 */
function AnimatedCheckmark() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      {/* Outer circle */}
      <div className="absolute inset-0 rounded-full border-4 border-green-500/30" />

      {/* Animated circle fill */}
      <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />

      {/* Inner circle */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
        <Check className="h-10 w-10 animate-in zoom-in text-white duration-300" />
      </div>

      {/* Success particles */}
      <div
        className="absolute h-2 w-2 animate-ping rounded-full bg-green-400"
        style={{ top: '10%', left: '20%', animationDelay: '0ms' }}
      />
      <div
        className="absolute h-2 w-2 animate-ping rounded-full bg-green-400"
        style={{ top: '15%', right: '20%', animationDelay: '150ms' }}
      />
      <div
        className="absolute h-2 w-2 animate-ping rounded-full bg-green-400"
        style={{ bottom: '20%', left: '15%', animationDelay: '300ms' }}
      />
      <div
        className="absolute h-2 w-2 animate-ping rounded-full bg-green-400"
        style={{ bottom: '15%', right: '20%', animationDelay: '450ms' }}
      />
    </div>
  );
}

/**
 * Commission breakdown card
 */
function CommissionBreakdownCard({
  commissions,
  currency,
}: {
  commissions: CommissionBreakdown[];
  currency: string;
}) {
  const { t } = useTranslation();
  const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      <div className="border-b border-slate-700 bg-slate-800/50 px-5 py-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <FileText className="h-5 w-5 text-green-400" />
          {t('checkout.commissionBreakdown')}
        </h3>
      </div>
      <div className="flex flex-col gap-3 p-5">
        {commissions.map((commission) => (
          <div key={commission.level} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  commission.level === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-white'
                )}
              >
                {commission.level + 1}
              </div>
              <span className="text-sm text-slate-300">{commission.description}</span>
            </div>
            <span className="font-medium text-green-400">
              {currency} {commission.amount.toFixed(2)}
            </span>
          </div>
        ))}

        {/* Divider */}
        <div className="border-t border-slate-700 pt-3" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white">{t('checkout.totalCommission')}</span>
          <span className="text-lg font-bold text-green-400">
            {currency} {totalCommission.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * OrderSuccess page component
 * Componente de página de éxito de orden
 */
export default function OrderSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  /**
   * Calculate commission breakdown
   */
  const calculateCommissionBreakdown = useCallback(
    (amount: number): CommissionBreakdown[] => {
      const commissions: CommissionBreakdown[] = [
        {
          level: 0,
          percentage: 10,
          amount: amount * 0.1,
          description: t('commission.sponsor'),
        },
        {
          level: 1,
          percentage: 5,
          amount: amount * 0.05,
          description: t('commission.level1'),
        },
        {
          level: 2,
          percentage: 3,
          amount: amount * 0.03,
          description: t('commission.level2'),
        },
        {
          level: 3,
          percentage: 2,
          amount: amount * 0.02,
          description: t('commission.level3'),
        },
        {
          level: 4,
          percentage: 1,
          amount: amount * 0.01,
          description: t('commission.level4'),
        },
      ];
      return commissions;
    },
    [t]
  );

  /**
   * Load order data
   */
  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError('Order ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const orderData = await orderService.getOrder(orderId);
      setOrder(orderData);
    } catch (err) {
      console.error('Failed to load order:', err);
      setError(t('orders.error'));
    } finally {
      setIsLoading(false);
    }
  }, [orderId, t]);

  // Initial load
  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  /**
   * Handle copy order number
   */
  const handleCopyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopiedOrderNumber(true);
      setTimeout(() => setCopiedOrderNumber(false), 2000);
    }
  };

  /**
   * Handle continue shopping
   */
  const handleContinueShopping = () => {
    navigate('/products');
  };

  /**
   * Handle go to dashboard
   */
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-slate-400">{t('orders.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold text-white">{error || t('orders.error')}</h1>
          <button
            onClick={handleContinueShopping}
            className="mt-6 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-500"
          >
            {t('checkout.backToProducts')}
          </button>
        </div>
      </div>
    );
  }

  const commissions = calculateCommissionBreakdown(order.amount);

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Success Animation */}
        <div className="mb-8 text-center">
          <AnimatedCheckmark />
          <h1 className="mt-6 text-3xl font-bold text-white">{t('checkout.success')}!</h1>
          <p className="mt-2 text-slate-400">{t('orders.successMessage')}</p>
        </div>

        {/* Order Info Card */}
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-purple-400" />
              <span className="font-semibold text-white">{t('orders.orderNumber')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg text-white">{order.orderNumber}</span>
              <button
                onClick={handleCopyOrderNumber}
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                title={t('common.copy')}
              >
                {copiedOrderNumber ? (
                  <CheckCopied className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-slate-400">{t('orders.status')}</span>
            <OrderStatus status={order.status} />
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-6">
          <OrderSummary order={order} showCommission={false} />
        </div>

        {/* Commission Breakdown */}
        {order.commissionTotal !== undefined && order.commissionTotal > 0 && (
          <div className="mb-8">
            <CommissionBreakdownCard commissions={commissions} currency={order.currency} />
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleContinueShopping}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-semibold',
              'border border-slate-600 text-white transition-colors hover:bg-slate-800'
            )}
          >
            <ShoppingBag className="h-5 w-5" />
            {t('orders.continueShopping')}
          </button>
          <button
            onClick={handleGoToDashboard}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-semibold',
              'bg-purple-600 text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25'
            )}
          >
            <Home className="h-5 w-5" />
            {t('orders.goToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
}
