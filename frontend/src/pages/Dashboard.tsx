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
  Target,
  AlertTriangle,
  Phone,
  Clock,
  User,
  Wallet,
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
import { dashboardService, crmService } from '../services/api';
import type { DashboardData } from '../types';
import QRDisplay from '../components/QRDisplay';
import { useWalletBalance } from '../stores/walletStore';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>(
    'month'
  );
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const loadRef = useRef(false);

  // Wallet balance state
  const { balance, fetchBalance, isLoading: walletLoading } = useWalletBalance();

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
        // Also fetch wallet balance
        fetchBalance();
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, [fetchBalance]);

  // Load CRM analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const response = await crmService.getAnalyticsReport({ period: analyticsPeriod });
        if (response.success) {
          setAnalyticsData(response.data);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    loadAnalytics();
  }, [analyticsPeriod]);

  // Load CRM alerts
  useEffect(() => {
    const loadAlerts = async () => {
      setAlertsLoading(true);
      try {
        const response = await crmService.getAlerts({ daysInactive: 7 });
        if (response.success) {
          setAlertsData(response.data);
        }
      } catch (error) {
        console.error('Failed to load alerts:', error);
      } finally {
        setAlertsLoading(false);
      }
    };
    loadAlerts();
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
        {/* Wallet Card - Links to full wallet page */}
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

      {/* CRM Analytics Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            {t('crm.analytics.title') || 'CRM Analytics'}
          </h2>
          <div className="flex gap-2">
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setAnalyticsPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  analyticsPeriod === period
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {period === 'week'
                  ? t('crm.period.week') || 'Week'
                  : period === 'month'
                    ? t('crm.period.month') || 'Month'
                    : period === 'quarter'
                      ? t('crm.period.quarter') || 'Quarter'
                      : t('crm.period.year') || 'Year'}
              </button>
            ))}
          </div>
        </div>

        {analyticsLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : analyticsData ? (
          <>
            {/* Period info */}
            <p className="text-sm text-slate-500 mb-6">
              {analyticsData.period.dateFrom} - {analyticsData.period.dateTo}
            </p>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm text-purple-600 font-medium">
                  {t('crm.analytics.totalLeads') || 'Total Leads'}
                </p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {analyticsData.leads.total}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-sm text-emerald-600 font-medium">
                  {t('crm.analytics.won') || 'Won'}
                </p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {analyticsData.leads.won}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-600 font-medium">
                  {t('crm.analytics.conversionRate') || 'Conversion'}
                </p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {analyticsData.conversion.rate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm text-amber-600 font-medium">
                  {t('crm.analytics.avgValue') || 'Avg Value'}
                </p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  ${analyticsData.value.average.toFixed(0)}
                </p>
              </div>
            </div>

            {/* Funnel Chart */}
            {analyticsData.byStatus && Object.keys(analyticsData.byStatus).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-700 mb-4">
                  {t('crm.analytics.funnel') || 'Funnel de Conversión'}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  {[
                    { key: 'new', label: t('crm.status.new') || 'Nuevo', color: 'bg-blue-500' },
                    {
                      key: 'contacted',
                      label: t('crm.status.contacted') || 'Contactado',
                      color: 'bg-cyan-500',
                    },
                    {
                      key: 'qualified',
                      label: t('crm.status.qualified') || 'Calificado',
                      color: 'bg-indigo-500',
                    },
                    {
                      key: 'proposal',
                      label: t('crm.status.proposal') || 'Propuesta',
                      color: 'bg-violet-500',
                    },
                    {
                      key: 'negotiation',
                      label: t('crm.status.negotiation') || 'Negociación',
                      color: 'bg-purple-500',
                    },
                    { key: 'won', label: t('crm.status.won') || 'Ganado', color: 'bg-emerald-500' },
                  ].map((stage) => {
                    const count = analyticsData.byStatus[stage.key] || 0;
                    const maxCount = Math.max(
                      ...Object.values(analyticsData.byStatus).map((v: any) => Number(v) || 0)
                    );
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                    return (
                      <div key={stage.key} className="flex-1 flex flex-col items-center">
                        <div className="relative w-full">
                          <div
                            className={`${stage.color} rounded-t-lg transition-all duration-300`}
                            style={{ height: `${Math.max(percentage, 10)}px` }}
                          />
                          <div className="absolute -bottom-6 left-0 right-0 text-center">
                            <span className="text-xs font-medium text-slate-700">{count}</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 mt-8 text-center truncate w-full">
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trend chart */}
            {analyticsData.trend && analyticsData.trend.length > 0 && (
              <div className="h-64 mt-8">
                <h3 className="text-sm font-medium text-slate-700 mb-4">
                  {t('crm.analytics.trend') || 'Tendencia'}
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6' }}
                      name={t('crm.analytics.created') || 'Created'}
                    />
                    <Line
                      type="monotone"
                      dataKey="won"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                      name={t('crm.analytics.won') || 'Won'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-3" />
            <p>{t('crm.analytics.noData') || 'No analytics data available'}</p>
          </div>
        )}
      </div>

      {/* CRM Alerts Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">
            {t('crm.alerts.title') || 'Alertas'}
          </h2>
          {alertsData.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
              {alertsData.length}
            </span>
          )}
        </div>

        {alertsLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : alertsData.length > 0 ? (
          <div className="space-y-3">
            {alertsData.slice(0, 10).map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'medium'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    alert.severity === 'high'
                      ? 'bg-red-100 text-red-600'
                      : alert.severity === 'medium'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {alert.type === 'inactive_lead' ? (
                    <User className="w-4 h-4" />
                  ) : alert.type === 'overdue_task' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{alert.title}</p>
                  <p className="text-sm text-slate-500">{alert.description}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    alert.severity === 'high'
                      ? 'bg-red-100 text-red-700'
                      : alert.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {alert.severity === 'high'
                    ? t('crm.alerts.high') || 'Alta'
                    : alert.severity === 'medium'
                      ? t('crm.alerts.medium') || 'Media'
                      : t('crm.alerts.low') || 'Baja'}
                </span>
              </div>
            ))}
            {alertsData.length > 10 && (
              <Link
                to="/crm"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                {t('crm.alerts.viewAll') || `Ver todas las alertas (${alertsData.length})`}
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Check className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <p>{t('crm.alerts.noAlerts') || '¡Todo al día! No hay alertas pendientes.'}</p>
          </div>
        )}
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
