/**
 * CommissionChart - Gráfico de líneas de comisiones
 *
 * @module components/dashboard/CommissionChart
 */
import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CommissionData {
  month: string;
  amount: number;
}

interface CommissionChartProps {
  data: CommissionData[];
  isLoading: boolean;
  isMounted: boolean;
}

export function CommissionChart({ data, isLoading, isMounted }: CommissionChartProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-emerald-500" />
        {t('dashboard.commissions')}
      </h2>
      <div className="h-64">
        {isLoading || !isMounted ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            {t('common.loading')}
          </div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, t('dashboard.amount')]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
                name={t('dashboard.earnings')}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            {t('dashboard.noCommissions')}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommissionChart;
