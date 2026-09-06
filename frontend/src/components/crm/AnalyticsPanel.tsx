/**
 * AnalyticsPanel - CRM analytics reports and charts section
 * Panel de analítica con reportes y sección de gráficos
 *
 * @module components/crm/AnalyticsPanel
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { useCRMAnalytics } from '@/hooks/useCRMAnalytics';
import type { AnalyticsPeriod } from '@/hooks/useCRMAnalytics';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; labelKey: string }[] = [
  { value: 'week', labelKey: 'crm.periodWeek' },
  { value: 'month', labelKey: 'crm.periodMonth' },
  { value: 'quarter', labelKey: 'crm.periodQuarter' },
  { value: 'year', labelKey: 'crm.periodYear' },
];

export function AnalyticsPanel() {
  const { t } = useTranslation();
  const {
    report,
    isLoading,
    period,
    setPeriod,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    fetchReport,
    exportReport,
  } = useCRMAnalytics();

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePeriodChange = (newPeriod: AnalyticsPeriod) => {
    setPeriod(newPeriod);
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handlePeriodChange(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === opt.value && !dateFrom
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[var(--color-secondary)] text-[var(--color-foreground-muted)] hover:bg-[var(--color-muted)]'
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="w-4 h-4 text-[var(--color-foreground-muted)]" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              if (e.target.value) setPeriod('month');
            }}
            className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-[var(--color-foreground-muted)]">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              if (e.target.value) setPeriod('month');
            }}
            className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-xl hover:bg-[var(--color-muted)] transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          {t('crm.exportCSV')}
        </button>
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : report ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Report Data Display */}
          {Object.entries(report).map(([key, value]) => (
            <div key={key} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                <h3 className="font-medium text-[var(--color-foreground)] capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
              </div>
              <div className="text-2xl font-bold text-[var(--color-foreground)]">
                {typeof value === 'number'
                  ? value.toLocaleString()
                  : typeof value === 'object' && value !== null
                    ? JSON.stringify(value)
                    : String(value)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[var(--color-secondary)] rounded-xl">
          <BarChart3 className="w-12 h-12 text-[var(--color-foreground-subtle)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-2">{t('crm.noReportData')}</h3>
          <p className="text-[var(--color-foreground-muted)]">
            {dateFrom || dateFrom ? t('crm.tryDifferentPeriod') : t('crm.selectPeriodToView')}
          </p>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPanel;
