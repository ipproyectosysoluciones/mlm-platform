/**
 * @fileoverview OrderStatus Component - Status badge
 * @description Badge component displaying order status (pending, completed, failed)
 * @module components/OrderStatus
 */

import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import type { OrderStatus as OrderStatusType } from '../types';
import { cn } from '../utils/cn';

/**
 * OrderStatus props
 */
export interface OrderStatusProps {
  status: OrderStatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Status configuration mapping
 */
const statusConfig: Record<
  OrderStatusType,
  {
    icon: React.ComponentType<{ className?: string }>;
    labelKey: string;
    bgClass: string;
    textClass: string;
    iconClass: string;
  }
> = {
  pending: {
    icon: Clock,
    labelKey: 'orders.statuses.pending',
    bgClass: 'bg-yellow-500/10',
    textClass: 'text-yellow-400',
    iconClass: 'text-yellow-400',
  },
  completed: {
    icon: CheckCircle,
    labelKey: 'orders.statuses.completed',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-400',
    iconClass: 'text-green-400',
  },
  failed: {
    icon: XCircle,
    labelKey: 'orders.statuses.failed',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    iconClass: 'text-red-400',
  },
  cancelled: {
    icon: Ban,
    labelKey: 'orders.statuses.cancelled',
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    iconClass: 'text-slate-400',
  },
};

/**
 * Size configurations
 */
const sizeClasses = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'w-5 h-5',
  },
};

/**
 * OrderStatus component - Displays order status badge
 * Componente de estado de orden - Muestra insignia de estado de orden
 */
export function OrderStatus({
  status,
  size = 'md',
  showLabel = true,
  className,
}: OrderStatusProps) {
  const { t } = useTranslation();

  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeConfig = sizeClasses[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bgClass,
        config.textClass,
        sizeConfig.badge,
        className
      )}
    >
      <Icon className={cn(sizeConfig.icon, config.iconClass)} />
      {showLabel && <span>{t(config.labelKey)}</span>}
    </span>
  );
}

export default OrderStatus;
