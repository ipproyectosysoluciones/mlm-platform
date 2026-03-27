/**
 * @fileoverview PriceDisplay Component - Formatted price with currency
 * @description Displays formatted price with currency symbol / Muestra precio formateado con símbolo de moneda
 * @module components/PriceDisplay
 */

import { cn } from '../utils/cn';

/**
 * PriceDisplay props
 */
interface PriceDisplayProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCurrency?: boolean;
  className?: string;
}

/**
 * Currency symbol mapping
 */
const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  MXN: '$',
  COP: '$',
  ARS: '$',
};

/**
 * PriceDisplay component - Displays formatted price
 * Componente de precio - Muestra el precio formateado
 */
export function PriceDisplay({
  amount,
  currency = 'USD',
  size = 'md',
  showCurrency = true,
  className,
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <span className={cn('font-bold text-green-400', sizeClasses[size], className)}>
      {showCurrency && currencySymbols[currency]}
      {amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}

export default PriceDisplay;
