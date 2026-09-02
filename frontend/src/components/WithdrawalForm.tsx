/**
 * @fileoverview WithdrawalForm Component - Form for withdrawal requests
 * @description Config-driven form with PayPal destination, fee preview, and validation
 *              Formulario con destino PayPal, preview de comisión y validación
 * @module components/WithdrawalForm
 * @author Nexo Real Development Team
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calculator, AlertCircle, Loader2, Mail } from 'lucide-react';
import { useWalletStore, useWalletConfig } from '../stores/walletStore';
import { cn } from '../utils/cn';

interface WithdrawalFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

/** Error code mapping from backend to user-friendly messages */
const ERROR_MAP: Record<string, string> = {
  INVALID_DESTINATION: 'Invalid PayPal email address',
  LIMIT_EXCEEDED: 'Daily withdrawal limit exceeded',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
  MINIMUM_AMOUNT: 'Below minimum withdrawal amount',
  DAILY_LIMIT_EXCEEDED: 'Daily withdrawal limit exceeded',
  MAXIMUM_EXCEEDED: 'Amount exceeds maximum withdrawal limit',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function WithdrawalForm({ onSuccess, onError, className }: WithdrawalFormProps) {
  const { t } = useTranslation();
  const { balance, createWithdrawal, isLoadingWithdrawals, withdrawalError, clearError } =
    useWalletStore();
  const { config, fetchConfig } = useWalletConfig();

  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const parsedAmount = parseFloat(amount) || 0;
  const feePercentage = config?.feePercentage ?? 5;
  const minimumWithdrawal = config?.minimumWithdrawal ?? 20;
  const maximumWithdrawal = config?.maximumWithdrawal ?? 500;
  const feeAmount = parsedAmount * (feePercentage / 100);
  const netAmount = parsedAmount - feeAmount;
  const availableBalance = balance?.balance || 0;

  // Reset success when amount changes
  useEffect(() => {
    if (isSuccess && amount) setIsSuccess(false);
  }, [amount, isSuccess]);

  // Clear errors when inputs change
  useEffect(() => {
    if (validationError || withdrawalError) {
      setValidationError(null);
      clearError();
    }
  }, [amount, email]);

  const validate = (): string | null => {
    const num = parseFloat(amount);

    if (!amount || isNaN(num)) return t('wallet.enterAmount') || 'Please enter an amount';

    if (num < minimumWithdrawal) {
      return `Minimum withdrawal is ${formatCurrency(minimumWithdrawal)}`;
    }

    if (num > maximumWithdrawal) {
      return `Maximum withdrawal is ${formatCurrency(maximumWithdrawal)}`;
    }

    if (num > availableBalance) {
      return t('wallet.insufficientBalance') || 'Insufficient balance';
    }

    if (!email || !isValidEmail(email)) {
      return 'Please enter a valid PayPal email address';
    }

    return null;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !/^\d*\.?\d{0,2}$/.test(value)) return;
    setAmount(value);
    if (value) {
      const error = validate();
      setValidationError(error);
    } else {
      setValidationError(null);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      await createWithdrawal(parsedAmount, { method: 'paypal', email });
      setIsSuccess(true);
      setAmount('');
      setEmail('');
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('wallet.withdrawalFailed') || 'Withdrawal failed';
      // Try to map backend error code
      const code = message.split(':').pop()?.trim() || message;
      setValidationError(ERROR_MAP[code] || message);
      onError?.(message);
    }
  };

  const canSubmit =
    parsedAmount >= minimumWithdrawal &&
    parsedAmount <= maximumWithdrawal &&
    parsedAmount <= availableBalance &&
    isValidEmail(email) &&
    !isLoadingWithdrawals;

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-6', className)}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {t('wallet.requestWithdrawal') || 'Request Withdrawal'}
      </h3>

      {isSuccess && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-emerald-700 border border-emerald-200">
          <p className="font-medium">
            {t('wallet.withdrawalSuccess') || 'Withdrawal request created successfully!'}
          </p>
        </div>
      )}

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

        {/* PayPal email destination */}
        <div>
          <label htmlFor="paypal-email" className="block text-sm font-medium text-slate-700 mb-2">
            PayPal Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="email"
              id="paypal-email"
              value={email}
              onChange={handleEmailChange}
              placeholder="you@example.com"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-lg border',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                email && !isValidEmail(email)
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
                {t('wallet.fee')} ({feePercentage}%)
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

        {validationError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Config limits */}
        {config && (
          <p className="text-xs text-slate-400">
            Min: {formatCurrency(config.minimumWithdrawal)} · Max:{' '}
            {formatCurrency(config.maximumWithdrawal)} · Fee: {config.feePercentage}%
          </p>
        )}

        <div className="text-sm text-slate-500">
          {t('wallet.available') || 'Available'}:{' '}
          <span className="font-medium text-slate-700">{formatCurrency(availableBalance)}</span>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-lg py-3 text-white font-medium',
            'transition-colors',
            canSubmit ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-300 cursor-not-allowed'
          )}
        >
          {isLoadingWithdrawals ? (
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
