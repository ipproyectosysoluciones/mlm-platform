/**
 * @fileoverview WithdrawalModal Component - Confirmation modal for withdrawals
 * @description Modal that shows withdrawal details including PayPal destination
 *              Modal que muestra detalles del retiro incluyendo destino PayPal
 * @module components/WithdrawalModal
 * @author Nexo Real Development Team
 */

import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2, X, Mail } from 'lucide-react';
import { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { cn } from '../utils/cn';
import type { WithdrawalDestination } from '../types';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  destination: WithdrawalDestination;
  feePercentage?: number;
}

const DEFAULT_FEE_PERCENTAGE = 5;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function WithdrawalModal({
  isOpen,
  onClose,
  amount,
  destination,
  feePercentage = DEFAULT_FEE_PERCENTAGE,
}: WithdrawalModalProps) {
  const { t } = useTranslation();
  const { createWithdrawal, isLoadingWithdrawals, withdrawalError, clearError } = useWalletStore();

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const feeAmount = amount * (feePercentage / 100);
  const netAmount = amount - feeAmount;

  const handleConfirm = async () => {
    if (isLoadingWithdrawals) return;

    setIsConfirmed(true);

    try {
      await createWithdrawal(amount, destination);
      setIsSuccess(true);

      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
    } catch {
      setIsConfirmed(false);
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const resetState = () => {
    setIsConfirmed(false);
    setIsSuccess(false);
    clearError();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-[var(--color-card)] p-6 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground-muted)]"
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-8 w-8 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
              {t('wallet.withdrawalRequested') || 'Withdrawal Requested!'}
            </h3>
            <p className="mt-2 text-[var(--color-foreground-muted)]">
              {t('wallet.withdrawalPending') || 'Your request is pending approval.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] text-center">
                {t('wallet.confirmWithdrawal') || 'Confirm Withdrawal'}
              </h3>
            </div>

            {withdrawalError && (
              <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
                <p className="text-sm">{withdrawalError}</p>
              </div>
            )}

            {/* Destination display */}
            <div className="mb-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Mail className="h-4 w-4" />
                <span className="font-medium">PayPal Destination</span>
              </div>
              <p className="mt-1 text-sm text-blue-900 font-semibold">{destination.email}</p>
            </div>

            <div className="mb-6 rounded-lg bg-[var(--color-secondary)] p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--color-foreground-muted)]">{t('wallet.requestedAmount') || 'Amount'}</span>
                <span className="font-medium text-[var(--color-foreground)]">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-foreground-muted)]">
                  {t('wallet.fee')} ({feePercentage}%)
                </span>
                <span className="font-medium text-amber-600">-{formatCurrency(feeAmount)}</span>
              </div>
              <div className="border-t border-[var(--color-border)] pt-3 flex justify-between">
                <span className="font-medium text-[var(--color-foreground)]">
                  {t('wallet.netAmount') || 'You will receive'}
                </span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(netAmount)}
                </span>
              </div>
            </div>

            <div className="mb-6 text-sm text-[var(--color-foreground-muted)]">
              <p>
                {t('wallet.withdrawalWarning') ||
                  'This action cannot be undone. Your withdrawal request will be reviewed by an administrator.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isLoadingWithdrawals}
                className={cn(
                  'flex-1 rounded-lg border border-[var(--color-border)] py-3 font-medium text-[var(--color-foreground)]',
                  'hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50'
                )}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoadingWithdrawals || isConfirmed}
                className={cn(
                  'flex-1 rounded-lg py-3 font-medium text-white',
                  'bg-emerald-600 hover:bg-emerald-500 transition-colors',
                  'disabled:bg-[var(--color-secondary)] disabled:cursor-not-allowed',
                  isConfirmed && 'relative'
                )}
              >
                {isLoadingWithdrawals || isConfirmed ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                ) : (
                  t('wallet.confirm') || 'Confirm'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WithdrawalModal;
