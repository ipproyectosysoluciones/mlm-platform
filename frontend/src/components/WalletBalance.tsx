/**
 * @fileoverview WalletBalance Component - Display wallet balance with formatting
 * @description Shows current balance with currency formatting and last updated time
 *              Muestra balance actual con formato de moneda y última actualización
 * @module components/WalletBalance
 * @author Nexo Real Development Team
 */

import { useTranslation } from 'react-i18next';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';
import { useWalletBalance } from '../stores/walletStore';
import { cn } from '../utils/cn';

/**
 * WalletBalance component props
 */
interface WalletBalanceProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Format currency amount
 * Formatea monto de moneda
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 * Formatea fecha para mostrar
 */
function formatLastUpdated(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * WalletBalance - Displays current wallet balance
 * WalletBalance - Muestra el balance actual del wallet
 */
export function WalletBalance({ className, showDetails = true }: WalletBalanceProps) {
  const { t } = useTranslation();
  const { balance, isLoading, error, fetchBalance } = useWalletBalance();

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-white',
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl bg-red-50 p-8 text-red-600',
          className
        )}
      >
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchBalance()}
          className="mt-2 text-sm font-medium text-red-600 underline"
        >
          {t('common.retry') || 'Retry'}
        </button>
      </div>
    );
  }

  if (!balance) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-slate-100 p-8 text-slate-500',
          className
        )}
      >
        <Wallet className="h-8 w-8 mr-2" />
        <span>{t('wallet.noWallet') || 'No wallet found'}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-8 text-white shadow-xl',
        className
      )}
    >
      {/* Decorative background elements */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 text-emerald-200" />
          <span className="text-sm font-medium text-emerald-100">
            {t('wallet.availableBalance') || 'Available Balance'}
          </span>
        </div>

        <div className="text-4xl font-bold tracking-tight mb-1">
          {formatCurrency(balance.balance, balance.currency)}
        </div>

        {showDetails && (
          <div className="flex items-center gap-4 mt-4 text-sm text-emerald-100">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              {t('wallet.ready') || 'Ready'}
            </span>
            <span className="text-emerald-200/70">
              {t('wallet.lastUpdated') || 'Updated'}: {formatLastUpdated(balance.lastUpdated)}
            </span>
          </div>
        )}

        {/* Currency badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            {balance.currency}
          </span>
        </div>
      </div>
    </div>
  );
}

export default WalletBalance;
