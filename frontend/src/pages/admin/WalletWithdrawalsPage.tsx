/**
 * @fileoverview WalletWithdrawalsPage — Admin paginated table for withdrawal requests
 * @description Lists all withdrawal requests with status filters and approval actions
 *
 * @module pages/admin/WalletWithdrawalsPage
 */
import { useState, useEffect, useCallback } from 'react';
import { DollarSign, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { walletService } from '../../services/api';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
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
  cancelled: 'text-slate-700 bg-slate-100',
  processed: 'text-emerald-700 bg-emerald-100',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string): string {
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Withdrawal Requests
          </h1>
          <p className="text-slate-500 mt-1">{total} total requests</p>
        </div>
        <button
          onClick={fetchWithdrawals}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
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
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No withdrawal requests found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Requested
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Fee
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Net
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Destination
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Created
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-900">{w.userId.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
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
                      <span className="flex items-center gap-1 text-slate-700">
                        <Mail className="h-3 w-3" />
                        {w.destination.email}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[w.status] || 'text-slate-700 bg-slate-100'}`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(w.createdAt)}</td>
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
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50"
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
