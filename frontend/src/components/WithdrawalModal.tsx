/**
 * @fileoverview WithdrawalModal Component - Confirmation modal for withdrawals
 * @description Modal that shows withdrawal details for user confirmation
 *              Modal que muestra detalles del retiro para confirmación del usuario
 * @module components/WithdrawalModal
 * @author Nexo Real Development Team
 */

import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { cn } from '../utils/cn';

/**
 * WithdrawalModal component props
 */
interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  feePercentage?: number;
}

/**
 * Default fee percentage
 */
const DEFAULT_FEE_PERCENTAGE = 5;

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
 * WithdrawalModal - Confirmation modal for withdrawal requests
 * WithdrawalModal - Modal de confirmación para solicitudes de retiro
 */
export function WithdrawalModal({
  isOpen,
  onClose,
  amount,
  feePercentage = DEFAULT_FEE_PERCENTAGE,
}: WithdrawalModalProps) {
  const { t } = useTranslation();
  const { createWithdrawal, isLoadingWithdrawals, withdrawalError, clearError } = useWalletStore();

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Calculate amounts
  const feeAmount = amount * (feePercentage / 100);
  const netAmount = amount - feeAmount;

  /**
   * Handle confirmation
   * Maneja confirmación
   */
  const handleConfirm = async () => {
    if (isLoadingWithdrawals) return;

    setIsConfirmed(true);

    try {
      await createWithdrawal(amount);
      setIsSuccess(true);

      // Close modal after success
      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
    } catch {
      setIsConfirmed(false);
    }
  };

  /**
   * Handle close
   * Maneja cierre
   */
  const handleClose = () => {
    resetState();
    onClose();
  };

  /**
   * Reset state
   * Resetea estado
   */
  const resetState = () => {
    setIsConfirmed(false);
    setIsSuccess(false);
    clearError();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success state */}
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
            <h3 className="text-xl font-semibold text-slate-900">
              {t('wallet.withdrawalRequested') || 'Withdrawal Requested!'}
            </h3>
            <p className="mt-2 text-slate-500">
              {t('wallet.withdrawalPending') || 'Your request is pending approval.'}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 text-center">
                {t('wallet.confirmWithdrawal') || 'Confirm Withdrawal'}
              </h3>
            </div>

            {/* API Error */}
            {withdrawalError && (
              <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
                <p className="text-sm">{withdrawalError}</p>
              </div>
            )}

            {/* Amount details */}
            <div className="mb-6 rounded-lg bg-slate-50 p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">{t('wallet.requestedAmount') || 'Amount'}</span>
                <span className="font-medium text-slate-900">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {t('wallet.fee')} ({feePercentage}%)
                </span>
                <span className="font-medium text-amber-600">-{formatCurrency(feeAmount)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-medium text-slate-700">
                  {t('wallet.netAmount') || 'You will receive'}
                </span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(netAmount)}
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="mb-6 text-sm text-slate-500">
              <p>
                {t('wallet.withdrawalWarning') ||
                  'This action cannot be undone. Your withdrawal request will be reviewed by an administrator.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isLoadingWithdrawals}
                className={cn(
                  'flex-1 rounded-lg border border-slate-200 py-3 font-medium text-slate-700',
                  'hover:bg-slate-50 transition-colors disabled:opacity-50'
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
                  'disabled:bg-slate-300 disabled:cursor-not-allowed',
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
