/**
 * StatsOverview - Admin statistics cards
 * Tarjetas de estadísticas del panel admin
 *
 * @module components/admin/StatsOverview
 */
import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, UserCheck, UserX } from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    totalUsers?: number;
    activeUsers?: number;
    inactiveUsers?: number;
    leftPercentage?: number;
    rightPercentage?: number;
  } | null;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'red' | 'purple';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={<Users className="w-6 h-6" />}
        label={t('admin.totalUsers')}
        value={stats?.totalUsers || 0}
        color="blue"
      />
      <StatCard
        icon={<UserCheck className="w-6 h-6" />}
        label={t('admin.activeUsers')}
        value={stats?.activeUsers || 0}
        color="green"
      />
      <StatCard
        icon={<UserX className="w-6 h-6" />}
        label={t('admin.inactiveUsers')}
        value={stats?.inactiveUsers || 0}
        color="red"
      />
      <StatCard
        icon={<TrendingUp className="w-6 h-6" />}
        label={t('admin.ratio')}
        value={`${stats?.leftPercentage || 0}% / ${stats?.rightPercentage || 0}%`}
        color="purple"
      />
    </div>
  );
}
