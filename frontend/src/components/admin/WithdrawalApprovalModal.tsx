/**
 * @fileoverview WithdrawalApprovalModal — Admin modal for reviewing withdrawal requests
 * @description Shows destination prominently, allows approve/reject with optional comment
 *
 * @module components/admin/WithdrawalApprovalModal
 */
import { useState } from 'react';
import { X, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { walletService } from '../../services/api';
import type { WithdrawalRequest } from '../../types';

interface WithdrawalApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: WithdrawalRequest;
  onComplete: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function WithdrawalApprovalModal({
  isOpen,
  onClose,
  withdrawal,
  onComplete,
}: WithdrawalApprovalModalProps) {
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await walletService.adminApproveWithdrawal(withdrawal.id, {
        comment: comment || undefined,
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setError('Rejection reason is required');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      await walletService.adminRejectWithdrawal(withdrawal.id, { reason: comment });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setComment('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-slate-900 mb-6">Review Withdrawal Request</h2>

        {/* Destination — PROMINENT */}
        {withdrawal.destination ? (
          <div className="mb-6 rounded-xl bg-blue-50 p-5 border-2 border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
              <Mail className="h-5 w-5" />
              <span className="font-semibold uppercase tracking-wide">PayPal Destination</span>
            </div>
            <p className="text-xl font-bold text-blue-900">{withdrawal.destination.email}</p>
          </div>
        ) : (
          <div className="mb-6 rounded-xl bg-slate-50 p-5 border border-slate-200">
            <p className="text-slate-500 text-sm">No destination set</p>
          </div>
        )}

        {/* Amount details */}
        <div className="mb-6 rounded-lg bg-slate-50 p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Requested Amount</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(withdrawal.requestedAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Fee</span>
            <span className="font-medium text-amber-600">
              -{formatCurrency(withdrawal.feeAmount)}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="font-medium text-slate-700">Net Amount</span>
            <span className="text-lg font-bold text-emerald-600">
              {formatCurrency(withdrawal.netAmount)}
            </span>
          </div>
        </div>

        {/* Gateway info */}
        {withdrawal.gatewayPayoutId && (
          <div className="mb-4 text-sm text-slate-500">
            Gateway ID:{' '}
            <span className="font-mono text-slate-700">{withdrawal.gatewayPayoutId}</span>
          </div>
        )}

        {/* Comment / rejection reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Comment {withdrawal.status === 'pending' ? '(required for rejection)' : '(optional)'}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Add a comment or rejection reason..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 rounded-lg border border-slate-200 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 rounded-lg py-3 font-medium text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex-1 rounded-lg py-3 font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
