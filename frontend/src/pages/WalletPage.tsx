/**
 * WalletPage - Digital wallet dashboard page
 * @description Main wallet page displaying balance, transactions, and withdrawal form
 *              Página principal del wallet mostrando balance, transacciones y formulario de retiro
 * @module pages/WalletPage
 * @author Nexo Real Development Team
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet as WalletIcon, Loader2, RefreshCw } from 'lucide-react';
import { WalletBalance } from '../components/WalletBalance';
import { TransactionHistory } from '../components/TransactionHistory';
import { WithdrawalForm } from '../components/WithdrawalForm';
import { WithdrawalModal } from '../components/WithdrawalModal';
import { useWalletStore } from '../stores/walletStore';
import { cn } from '../utils/cn';

export default function WalletPage() {
  const { t } = useTranslation();
  const { fetchBalance, fetchTransactions, balance, isLoading, error } = useWalletStore();

  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);

  // Fetch initial data
  useEffect(() => {
    fetchBalance();
    fetchTransactions(true);
  }, []);

  if (isLoading && !balance) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <WalletIcon className="w-8 h-8 text-emerald-500" />
            {t('wallet.title') || 'My Wallet'}
          </h1>
          <p className="text-slate-500 mt-1">
            {t('wallet.subtitle') || 'Manage your earnings and withdrawals'}
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => {
            fetchBalance();
            fetchTransactions(true);
          }}
          disabled={isLoading}
          className={cn(
            'p-2 rounded-lg border border-slate-200 bg-white text-slate-600',
            'hover:bg-slate-50 transition-colors',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
          <p>{error}</p>
        </div>
      )}

      {/* Main content - 2 column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Balance and Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance card */}
          <WalletBalance />

          {/* Withdrawal form */}
          <WithdrawalForm onSuccess={() => setWithdrawalAmount(0)} />
        </div>

        {/* Right column - Transaction history */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <TransactionHistory limit={15} />
          </div>
        </div>
      </div>

      {/* Withdrawal confirmation modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        amount={withdrawalAmount}
      />
    </div>
  );
}
