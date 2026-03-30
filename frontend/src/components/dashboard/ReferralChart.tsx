/**
 * ReferralChart - Gráfico de barras de referidos
 *
 * @module components/dashboard/ReferralChart
 */
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReferralData {
  month: string;
  count: number;
}

interface ReferralChartProps {
  data: ReferralData[];
  isLoading: boolean;
  isMounted: boolean;
}

export function ReferralChart({ data, isLoading, isMounted }: ReferralChartProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        {t('dashboard.recentReferrals')}
      </h2>
      <div className="h-64">
        {isLoading || !isMounted ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            {t('common.loading')}
          </div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name={t('dashboard.referrals')}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            {t('dashboard.noReferrals')}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReferralChart;
