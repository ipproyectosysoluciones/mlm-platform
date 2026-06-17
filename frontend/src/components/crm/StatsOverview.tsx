/**
 * StatsOverview - CRM metrics dashboard cards
 * Tarjetas de métricas del dashboard de CRM
 *
 * @module components/crm/StatsOverview
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useCRMMetrics } from '@/hooks/useCRMMetrics';

export function StatsOverview() {
  const { t } = useTranslation();
  const { stats, isLoading, loadStats } = useCRMMetrics();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl">
        <p className="text-slate-500">{t('crm.noStats')}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-slate-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{t('crm.statsTotal')}</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalLeads}</p>
          </div>
          <Users className="w-12 h-12 text-slate-200" />
        </div>
      </div>
      <div className="bg-emerald-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-600">{t('crm.statsWon')}</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.wonLeads}</p>
          </div>
          <CheckCircle className="w-12 h-12 text-emerald-200" />
        </div>
      </div>
      <div className="bg-amber-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-600">{t('crm.statsInProgress')}</p>
            <p className="text-3xl font-bold text-amber-600">{stats.inProgress}</p>
          </div>
          <Clock className="w-12 h-12 text-amber-200" />
        </div>
      </div>
      <div className="bg-slate-900 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{t('crm.statsConversionRate')}</p>
            <p className="text-3xl font-bold text-white">
              {stats.totalLeads > 0 ? Math.round((stats.wonLeads / stats.totalLeads) * 100) : 0}%
            </p>
          </div>
          <AlertCircle className="w-12 h-12 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

export default StatsOverview;
