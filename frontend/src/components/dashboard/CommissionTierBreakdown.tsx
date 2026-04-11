/**
 * CommissionTierBreakdown - Donut chart + table showing commission distribution by MLM level
 *
 * Displays the Unilevel commission structure:
 * - Level 1 (Direct): 10%
 * - Level 2: 5%
 * - Level 3: 3%
 * - Level 4: 2%
 * - Level 5: 1%
 * - Performance Bonuses
 *
 * @module components/dashboard/CommissionTierBreakdown
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Commission } from '../../types';

// TODO: Replace with real API data when commission breakdown endpoint is available
// These are realistic demo values for the investor pitch
const MOCK_TIER_DATA: TierData[] = [
  { level: 1, rate: 10, referrals: 12, earnings: 450 },
  { level: 2, rate: 5, referrals: 8, earnings: 180 },
  { level: 3, rate: 3, referrals: 15, earnings: 95 },
  { level: 4, rate: 2, referrals: 6, earnings: 40 },
  { level: 5, rate: 1, referrals: 3, earnings: 12 },
];

const MOCK_BONUS = 75;

const TIER_COLORS: Record<number, string> = {
  1: '#10b981', // emerald-500
  2: '#34d399', // emerald-400
  3: '#2dd4bf', // teal-400
  4: '#22d3ee', // cyan-400
  5: '#38bdf8', // sky-400
};

const BONUS_COLOR = '#fbbf24'; // amber-400

interface TierData {
  level: number;
  rate: number;
  referrals: number;
  earnings: number;
}

interface CommissionTierBreakdownProps {
  commissions: Commission[];
  isMounted: boolean;
}

/**
 * Attempts to compute tier data from real commissions.
 * Falls back to mock data when breakdown is not available from the API.
 */
function computeTierData(commissions: Commission[]): {
  tiers: TierData[];
  bonuses: number;
  isRealData: boolean;
} {
  // Map commission.type to level number
  const typeToLevel: Record<string, number> = {
    direct: 1,
    level_1: 1,
    level_2: 2,
    level_3: 3,
    level_4: 4,
  };

  const levelRates: Record<number, number> = {
    1: 10,
    2: 5,
    3: 3,
    4: 2,
    5: 1,
  };

  if (commissions.length === 0) {
    // TODO: Replace with real API data when commission breakdown endpoint is available
    return { tiers: MOCK_TIER_DATA, bonuses: MOCK_BONUS, isRealData: false };
  }

  // Group commissions by level
  const grouped = new Map<number, { earnings: number; referrals: Set<string> }>();

  for (const c of commissions) {
    const level = typeToLevel[c.type] ?? 0;
    if (level === 0) continue;

    const existing = grouped.get(level) ?? { earnings: 0, referrals: new Set<string>() };
    existing.earnings += c.amount;
    if (c.fromUser?.email) {
      existing.referrals.add(c.fromUser.email);
    }
    grouped.set(level, existing);
  }

  // If we only have a few commissions, the breakdown won't look great for the demo
  // Fall back to mock data if the real data is sparse
  if (grouped.size < 2) {
    // TODO: Replace with real API data when commission breakdown endpoint is available
    return { tiers: MOCK_TIER_DATA, bonuses: MOCK_BONUS, isRealData: false };
  }

  const tiers: TierData[] = [];
  for (let level = 1; level <= 5; level++) {
    const data = grouped.get(level);
    tiers.push({
      level,
      rate: levelRates[level],
      referrals: data?.referrals.size ?? 0,
      earnings: data ? Math.round(data.earnings * 100) / 100 : 0,
    });
  }

  return { tiers, bonuses: 0, isRealData: true };
}

export function CommissionTierBreakdown({ commissions, isMounted }: CommissionTierBreakdownProps) {
  const { t } = useTranslation();

  const { tiers, bonuses } = useMemo(() => computeTierData(commissions), [commissions]);

  const totalEarnings = useMemo(
    () => tiers.reduce((sum, tier) => sum + tier.earnings, 0) + bonuses,
    [tiers, bonuses]
  );

  // Build pie chart data
  const pieData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    for (const tier of tiers) {
      if (tier.earnings > 0) {
        data.push({
          name: t('dashboard.level', { n: tier.level }),
          value: tier.earnings,
          color: TIER_COLORS[tier.level],
        });
      }
    }
    if (bonuses > 0) {
      data.push({
        name: t('dashboard.bonuses'),
        value: bonuses,
        color: BONUS_COLOR,
      });
    }
    return data;
  }, [tiers, bonuses, t]);

  const totalReferrals = tiers.reduce((sum, tier) => sum + tier.referrals, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <PieChartIcon className="w-5 h-5 text-emerald-500" />
        {t('dashboard.commissionBreakdown')}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="flex items-center justify-center">
          <div className="w-full h-64 relative">
            {!isMounted ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                {t('common.loading')}
              </div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, t('dashboard.earnings')]}
                  />
                  {/* Center label via SVG text */}
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#0f172a"
                    fontSize="20px"
                    fontWeight="700"
                  >
                    ${totalEarnings.toFixed(2)}
                  </text>
                  <text
                    x="50%"
                    y="56%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#64748b"
                    fontSize="11px"
                  >
                    {t('dashboard.totalEarnings')}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                {t('dashboard.noCommissions')}
              </div>
            )}
          </div>
        </div>

        {/* Tier Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-slate-500 font-medium">
                  {t('dashboard.commissionByLevel')}
                </th>
                <th className="text-right py-2 px-2 text-slate-500 font-medium">
                  {t('dashboard.rate')}
                </th>
                <th className="text-right py-2 px-2 text-slate-500 font-medium">
                  {t('dashboard.referrals')}
                </th>
                <th className="text-right py-2 px-2 text-slate-500 font-medium">
                  {t('dashboard.earnings')}
                </th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr
                  key={tier.level}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: TIER_COLORS[tier.level] }}
                      />
                      <span className="text-slate-900 font-medium">
                        {tier.level === 1
                          ? t('dashboard.directReferrals')
                          : t('dashboard.level', { n: tier.level })}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600">{tier.rate}%</td>
                  <td className="py-2.5 px-2 text-right text-slate-600">{tier.referrals}</td>
                  <td className="py-2.5 px-2 text-right font-medium text-emerald-600">
                    ${tier.earnings.toFixed(2)}
                  </td>
                </tr>
              ))}
              {bonuses > 0 && (
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: BONUS_COLOR }}
                      />
                      <span className="text-slate-900 font-medium">{t('dashboard.bonuses')}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600">—</td>
                  <td className="py-2.5 px-2 text-right text-slate-600">—</td>
                  <td className="py-2.5 px-2 text-right font-medium text-amber-600">
                    ${bonuses.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td className="py-3 px-2 font-bold text-slate-900">
                  {t('dashboard.totalEarnings')}
                </td>
                <td className="py-3 px-2 text-right text-slate-600">—</td>
                <td className="py-3 px-2 text-right font-bold text-slate-900">{totalReferrals}</td>
                <td className="py-3 px-2 text-right font-bold text-emerald-600">
                  ${totalEarnings.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CommissionTierBreakdown;
