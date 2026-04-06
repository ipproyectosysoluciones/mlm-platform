/**
 * @fileoverview WithdrawalForm Component - Form for withdrawal requests
 * @description Form with amount input, fee preview, and validation
 *              Formulario con input de monto, preview de comisión y validación
 * @module components/WithdrawalForm
 * @author Nexo Real Development Team
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calculator, AlertCircle, Loader2 } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { cn } from '../utils/cn';

/**
 * WithdrawalForm component props
 */
interface WithdrawalFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Minimum withdrawal amount
 */
const MIN_WITHDRAWAL = 20;

/**
 * Withdrawal fee percentage
 */
const FEE_PERCENTAGE = 5;

/**
 * Format currency amount
 * Formatea monto de moneda
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * WithdrawalForm - Form for creating withdrawal requests
 * WithdrawalForm - Formulario para crear solicitudes de retiro
 */
export function WithdrawalForm({ onSuccess, onError, className }: WithdrawalFormProps) {
  const { t } = useTranslation();
  const { balance, createWithdrawal, isLoadingWithdrawals, withdrawalError, clearError } =
    useWalletStore();

  const [amount, setAmount] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Calculate fee and net amount
  const parsedAmount = parseFloat(amount) || 0;
  const feeAmount = parsedAmount * (FEE_PERCENTAGE / 100);
  const netAmount = parsedAmount - feeAmount;
  const availableBalance = balance?.balance || 0;

  // Reset success state when amount changes
  useEffect(() => {
    if (isSuccess && amount) {
      setIsSuccess(false);
    }
  }, [amount, isSuccess]);

  // Clear errors when amount changes
  useEffect(() => {
    if (validationError || withdrawalError) {
      setValidationError(null);
      clearError();
    }
  }, [amount]);

  /**
   * Validate amount input
   * Valida input de monto
   */
  const validateAmount = (value: string): string | null => {
    const num = parseFloat(value);

    if (!value || isNaN(num)) {
      return t('wallet.enterAmount') || 'Please enter an amount';
    }

    if (num < MIN_WITHDRAWAL) {
      return (
        t('wallet.minWithdrawal', { amount: MIN_WITHDRAWAL }) ||
        `Minimum withdrawal is ${formatCurrency(MIN_WITHDRAWAL)}`
      );
    }

    if (num > availableBalance) {
      return t('wallet.insufficientBalance') || 'Insufficient balance';
    }

    return null;
  };

  /**
   * Handle amount input change
   * Maneja cambio de input de monto
   */
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only allow numbers and one decimal point
    if (value && !/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }

    setAmount(value);

    // Validate in real-time
    if (value) {
      const error = validateAmount(value);
      setValidationError(error);
    } else {
      setValidationError(null);
    }
  };

  /**
   * Handle form submission
   * Maneja envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation
    const error = validateAmount(amount);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsValidating(true);

    try {
      await createWithdrawal(parsedAmount);
      setIsSuccess(true);
      setAmount('');
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('wallet.withdrawalFailed') || 'Withdrawal failed';
      setValidationError(message);
      onError?.(message);
    } finally {
      setIsValidating(false);
    }
  };

  const canSubmit =
    parsedAmount >= MIN_WITHDRAWAL && parsedAmount <= availableBalance && !isValidating;

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-6', className)}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {t('wallet.requestWithdrawal') || 'Request Withdrawal'}
      </h3>

      {/* Success message */}
      {isSuccess && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-emerald-700 border border-emerald-200">
          <p className="font-medium">
            {t('wallet.withdrawalSuccess') || 'Withdrawal request created successfully!'}
          </p>
        </div>
      )}

      {/* API Error */}
      {withdrawalError && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{withdrawalError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount input */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
            {t('wallet.amount') || 'Amount'} (USD)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-lg border text-lg font-semibold',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                validationError
                  ? 'border-red-300 bg-red-50 text-red-900'
                  : 'border-slate-200 bg-slate-50 text-slate-900'
              )}
              disabled={isLoadingWithdrawals}
            />
          </div>
        </div>

        {/* Fee preview */}
        {parsedAmount > 0 && (
          <div className="rounded-lg bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                {t('wallet.requestedAmount') || 'Requested Amount'}
              </span>
              <span className="font-medium text-slate-900">{formatCurrency(parsedAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                {t('wallet.fee')} ({FEE_PERCENTAGE}%)
              </span>
              <span className="font-medium text-amber-600">-{formatCurrency(feeAmount)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="text-sm font-medium text-slate-700">
                {t('wallet.netAmount') || 'Net Amount'}
              </span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(netAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Balance info */}
        <div className="text-sm text-slate-500">
          {t('wallet.available') || 'Available'}:{' '}
          <span className="font-medium text-slate-700">{formatCurrency(availableBalance)}</span>
        </div>

        {/* Minimum note */}
        <p className="text-xs text-slate-400">
          {t('wallet.minNote', { amount: MIN_WITHDRAWAL }) ||
            `Minimum withdrawal: ${formatCurrency(MIN_WITHDRAWAL)}`}
        </p>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!canSubmit || isValidating}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-lg py-3 text-white font-medium',
            'transition-colors',
            canSubmit && !isValidating
              ? 'bg-emerald-600 hover:bg-emerald-500'
              : 'bg-slate-300 cursor-not-allowed'
          )}
        >
          {isValidating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('wallet.processing') || 'Processing...'}
            </>
          ) : (
            <>
              <Calculator className="h-5 w-5" />
              {t('wallet.requestWithdrawal') || 'Request Withdrawal'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default WithdrawalForm;
