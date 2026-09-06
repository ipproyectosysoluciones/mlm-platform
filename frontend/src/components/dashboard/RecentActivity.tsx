/**
 * RecentActivity - Actividad reciente (comisiones y referidos)
 *
 * @module components/dashboard/RecentActivity
 */
import { useTranslation } from 'react-i18next';
import { DollarSign, UserPlus, Users } from 'lucide-react';
import type { DashboardData } from '../../types';

interface RecentActivityProps {
  data: DashboardData;
}

export function RecentActivity({ data }: RecentActivityProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Commissions */}
      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
          {t('dashboard.recentCommissions')}
        </h2>
        {data.recentCommissions.length > 0 ? (
          <div className="space-y-3">
            {data.recentCommissions.map((commission) => (
              <div
                key={commission.id}
                className="flex justify-between items-center p-4 bg-[var(--color-secondary)] rounded-xl"
              >
                <div>
                  <p className="font-medium text-[var(--color-foreground)] capitalize">{commission.type}</p>
                  <p className="text-sm text-[var(--color-foreground-muted)]">
                    {commission.fromUser?.email || 'Sistema'}
                  </p>
                </div>
                <p className="font-bold text-emerald-600">+${commission.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-[var(--color-foreground-subtle)] mx-auto mb-3" />
            <p className="text-[var(--color-foreground-muted)]">{t('dashboard.noCommissions')}</p>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">{t('dashboard.noCommissionsHint')}</p>
          </div>
        )}
      </div>

      {/* Recent Referrals */}
      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
          {t('dashboard.recentReferrals')}
        </h2>
        {data.recentReferrals.length > 0 ? (
          <div className="space-y-3">
            {data.recentReferrals.map((referral) => (
              <div
                key={referral.id}
                className="flex justify-between items-center p-4 bg-[var(--color-secondary)] rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">{referral.email}</p>
                    <p className="text-sm text-[var(--color-foreground-muted)] capitalize">
                      {referral.position === 'left'
                        ? t('dashboard.directReferrals')
                        : t('dashboard.totalNetwork')}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-foreground-muted)]">
                  {new Date(referral.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-[var(--color-foreground-subtle)] mx-auto mb-3" />
            <p className="text-[var(--color-foreground-muted)]">{t('dashboard.noReferrals')}</p>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">{t('dashboard.noReferralsHint')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentActivity;
