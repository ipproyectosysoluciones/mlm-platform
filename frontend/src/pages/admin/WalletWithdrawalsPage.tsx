/**
 * @fileoverview WalletWithdrawalsPage — Admin paginated table for withdrawal requests
 * @description Lists all withdrawal requests with status filters and approval actions
 *
 * @module pages/admin/WalletWithdrawalsPage
 */
import { useState, useEffect, useCallback } from 'react';
import { DollarSign, CheckCircle, Mail, RefreshCw } from 'lucide-react';
import { walletService } from '../../services/api';
import WithdrawalApprovalModal from '../../components/admin/WithdrawalApprovalModal';
import type { WithdrawalRequest, WithdrawalStatus, AdminListWithdrawalsParams } from '../../types';

const STATUS_OPTIONS: { value: WithdrawalStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-700 bg-amber-100',
  approved: 'text-blue-700 bg-blue-100',
  rejected: 'text-red-700 bg-red-100',
  paid: 'text-emerald-700 bg-emerald-100',
  failed: 'text-red-700 bg-red-100',
  cancelled: 'text-[var(--color-foreground)] bg-[var(--color-secondary)]',
  processed: 'text-emerald-700 bg-emerald-100',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WalletWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | ''>('');
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    withdrawal: WithdrawalRequest | null;
  }>({ isOpen: false, withdrawal: null });

  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: AdminListWithdrawalsParams = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      const response = await walletService.adminListWithdrawals(params);
      setWithdrawals(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleApprove = (withdrawal: WithdrawalRequest) => {
    setApprovalModal({ isOpen: true, withdrawal });
  };

  const handleApprovalComplete = () => {
    setApprovalModal({ isOpen: false, withdrawal: null });
    fetchWithdrawals();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Withdrawal Requests
          </h1>
          <p className="text-[var(--color-foreground-muted)] mt-1">{total} total requests</p>
        </div>
        <button
          onClick={fetchWithdrawals}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setStatusFilter(opt.value as WithdrawalStatus | '');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-emerald-600 text-white'
                : 'bg-[var(--color-secondary)] text-[var(--color-foreground-muted)] hover:bg-[var(--color-muted)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[var(--color-foreground-muted)]">Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-foreground-muted)]">No withdrawal requests found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--color-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Requested
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Fee
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Net
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Destination
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Created
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-[var(--color-secondary)] transition-colors">
                  <td className="px-4 py-3 text-sm text-[var(--color-foreground)]">{w.userId.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[var(--color-foreground)]">
                    {formatCurrency(w.requestedAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-amber-600">
                    -{formatCurrency(w.feeAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">
                    {formatCurrency(w.netAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {w.destination ? (
                      <span className="flex items-center gap-1 text-[var(--color-foreground)]">
                        <Mail className="h-3 w-3" />
                        {w.destination.email}
                      </span>
                    ) : (
                      <span className="text-[var(--color-foreground-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[w.status] || 'text-[var(--color-foreground)] bg-[var(--color-secondary)]'}`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-foreground-muted)]">{formatDate(w.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    {w.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(w)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Approval modal */}
      {approvalModal.withdrawal && (
        <WithdrawalApprovalModal
          isOpen={approvalModal.isOpen}
          onClose={() => setApprovalModal({ isOpen: false, withdrawal: null })}
          withdrawal={approvalModal.withdrawal}
          onComplete={handleApprovalComplete}
        />
      )}
    </div>
  );
}
