/**
 * StatsCards - Tarjetas de estadísticas del dashboard
 *
 * @module components/dashboard/StatsCards
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import type { DashboardData } from '../../types';
import { useWalletBalance } from '../../stores/walletStore';
import { featureFlags } from '../../utils/featureFlags';

interface StatsCardsProps {
  data: DashboardData;
}

export function StatsCards({ data }: StatsCardsProps) {
  const { t } = useTranslation();
  const { balance, isLoading: walletLoading } = useWalletBalance();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      <StatCard
        icon={<Users className="w-6 h-6" />}
        label={t('dashboard.stats.totalReferrals')}
        value={data.stats.totalReferrals.toString()}
        color="bg-blue-500"
      />
      <StatCard
        icon={<DollarSign className="w-6 h-6" />}
        label={t('dashboard.stats.totalEarnings')}
        value={`$${data.stats.totalEarnings.toFixed(2)}`}
        color="bg-emerald-500"
      />
      <StatCard
        icon={<TrendingUp className="w-6 h-6" />}
        label={t('dashboard.stats.pending')}
        value={`$${data.stats.pendingEarnings.toFixed(2)}`}
        color="bg-amber-500"
      />
      {/* Wallet Card - Links to full wallet page (hidden when crypto wallet feature is disabled) */}
      {featureFlags.cryptoWallet && (
        <Link
          to="/wallet"
          className="bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl p-6 text-white hover:from-emerald-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">
                {t('wallet.balance') || 'Wallet Balance'}
              </p>
              <p className="text-2xl font-bold mt-1">
                {walletLoading ? (
                  <span className="opacity-70">...</span>
                ) : balance ? (
                  `$${Number(balance.balance).toFixed(2)}`
                ) : (
                  '$0.00'
                )}
              </p>
              <p className="text-xs text-emerald-200 mt-1">
                {t('wallet.clickToView') || 'Click to view details →'}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-emerald-200" />
          </div>
        </Link>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`${color} p-3 rounded-xl text-white`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default StatsCards;
