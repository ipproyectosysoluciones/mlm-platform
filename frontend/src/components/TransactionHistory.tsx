/**
 * @fileoverview TransactionHistory Component - List of wallet transactions
 * @description Displays paginated list of wallet transactions with filters
 *              Muestra lista paginada de transacciones del wallet con filtros
 * @module components/TransactionHistory
 * @author MLM Development Team
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCcw,
  Loader2,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { useWalletTransactions } from '../stores/walletStore';
import { cn } from '../utils/cn';
import type { WalletTransactionType } from '../types';

/**
 * TransactionHistory component props
 */
interface TransactionHistoryProps {
  className?: string;
  limit?: number;
}

/**
 * Transaction type icons
 * Iconos de tipo de transacción
 */
const transactionIcons: Record<WalletTransactionType, typeof ArrowDownCircle> = {
  commission: ArrowDownCircle,
  withdrawal: ArrowUpCircle,
  refund: RefreshCcw,
};

/**
 * Transaction type colors
 * Colores de tipo de transacción
 */
const transactionColors: Record<WalletTransactionType, string> = {
  commission: 'text-emerald-500 bg-emerald-50',
  withdrawal: 'text-amber-500 bg-amber-50',
  refund: 'text-blue-500 bg-blue-50',
};

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
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * TransactionHistory - Displays transaction list with pagination
 * TransactionHistory - Muestra lista de transacciones con paginación
 */
export function TransactionHistory({ className, limit = 10 }: TransactionHistoryProps) {
  const { t } = useTranslation();
  const {
    transactions,
    isLoading,
    error,
    hasMore,
    transactionType,
    fetchTransactions,
    setTransactionType,
  } = useWalletTransactions();

  // Initial load
  useEffect(() => {
    fetchTransactions(true);
  }, []);

  // Filter options
  const typeOptions: { value: WalletTransactionType | null; label: string }[] = [
    { value: null, label: t('wallet.allTypes') || 'All Types' },
    { value: 'commission', label: t('wallet.commissions') || 'Commissions' },
    { value: 'withdrawal', label: t('wallet.withdrawals') || 'Withdrawals' },
    { value: 'refund', label: t('wallet.refunds') || 'Refunds' },
  ];

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchTransactions(false);
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-red-500', className)}>
        <p>{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div
        className={cn('flex flex-col items-center justify-center p-8 text-slate-500', className)}
      >
        <ArrowDownCircle className="h-12 w-12 mb-3 text-slate-300" />
        <p>{t('wallet.noTransactions') || 'No transactions yet'}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white', className)}>
      {/* Header with filter */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {t('wallet.transactions') || 'Transactions'}
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={transactionType || ''}
            onChange={(e) =>
              setTransactionType(
                (e.target.value || null) as 'commission' | 'withdrawal' | 'refund' | null
              )
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            {typeOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction list */}
      <div className="divide-y divide-slate-100">
        {transactions.slice(0, limit).map((transaction) => {
          const Icon = transactionIcons[transaction.type];
          const colorClass = transactionColors[transaction.type];
          const isPositive = transaction.type === 'commission' || transaction.type === 'refund';

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  colorClass
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 capitalize">
                  {t(`wallet.${transaction.type}`) || transaction.type}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  {transaction.description || t(`wallet.${transaction.type}Description`) || '-'}
                </p>
              </div>

              {/* Amount & Date */}
              <div className="text-right">
                <p
                  className={cn(
                    'font-semibold',
                    isPositive ? 'text-emerald-600' : 'text-amber-600'
                  )}
                >
                  {isPositive ? '+' : '-'}
                  {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                </p>
                <p className="text-sm text-slate-400">{formatDate(transaction.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center p-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {t('wallet.loadMore') || 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
