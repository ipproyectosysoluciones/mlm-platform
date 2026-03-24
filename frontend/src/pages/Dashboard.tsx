/**
 * Dashboard - Panel principal del usuario MLM
 *
 * @module pages/Dashboard
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  DollarSign,
  TrendingUp,
  UserPlus,
  Copy,
  Check,
  TreeDeciduous,
  QrCode,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { dashboardService } from '../services/api';
import type { DashboardData } from '../types';
import QRDisplay from '../components/QRDisplay';

export default function Dashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const loadRef = useRef(false);

  useEffect(() => {
    // Set mounted state after first render + delay to ensure DOM dimensions are ready
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Suppress Recharts -1 dimensions warning
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('width(-1) and height(-1)')) {
        return;
      }
      originalWarn.apply(console, args);
    };
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;

    const loadDashboard = async () => {
      try {
        const dashboardData = await dashboardService.getDashboard();
        setData(dashboardData);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-red-500">{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{t('dashboard.welcome')}</h1>
        <p className="text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats grid */}
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
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Referrals Chart */}
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
            ) : data?.referralsChart && data.referralsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.referralsChart}>
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

        {/* Commissions Chart */}
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
            ) : data?.commissionsChart && data.commissionsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.commissionsChart}>
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
      </div>

      {/* Tree & Referral section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('dashboard.binaryTree')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="text-sm text-blue-600 font-medium">{t('dashboard.leftLeg')}</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{data.stats.leftCount}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
              <p className="text-sm text-purple-600 font-medium">{t('dashboard.rightLeg')}</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{data.stats.rightCount}</p>
            </div>
          </div>
          <Link
            to="/tree"
            className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-colors font-medium"
          >
            <TreeDeciduous className="w-5 h-5" />
            {t('dashboard.viewFullTree')}
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t('dashboard.referralLink')}
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={data.referralLink}
              readOnly
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-mono"
            />
            <button
              onClick={copyLink}
              className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition-colors font-medium"
          >
            <QrCode className="w-5 h-5" />
            {showQR ? t('dashboard.hideQR') : t('dashboard.showQR')}
          </button>
          {showQR && (
            <div className="mt-6 flex justify-center">
              <QRDisplay value={data.referralLink} referralCode={data.user.referralCode} />
            </div>
          )}
        </div>
      </div>

      {/* Activity section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t('dashboard.recentCommissions')}
          </h2>
          {data.recentCommissions.length > 0 ? (
            <div className="space-y-3">
              {data.recentCommissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-slate-900 capitalize">{commission.type}</p>
                    <p className="text-sm text-slate-500">
                      {commission.fromUser?.email || 'Sistema'}
                    </p>
                  </div>
                  <p className="font-bold text-emerald-600">+${commission.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t('dashboard.noCommissions')}</p>
              <p className="text-sm text-slate-400 mt-1">{t('dashboard.noCommissionsHint')}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t('dashboard.recentReferrals')}
          </h2>
          {data.recentReferrals.length > 0 ? (
            <div className="space-y-3">
              {data.recentReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{referral.email}</p>
                      <p className="text-sm text-slate-500 capitalize">
                        {referral.position === 'left'
                          ? t('dashboard.leftLeg')
                          : t('dashboard.rightLeg')}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t('dashboard.noReferrals')}</p>
              <p className="text-sm text-slate-400 mt-1">{t('dashboard.noReferralsHint')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard - Tarjeta de estadística con icono
 */
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
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
