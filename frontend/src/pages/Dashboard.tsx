/**
 * Dashboard - Panel principal del usuario MLM
 *
 * @module pages/Dashboard
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Copy, Check, TreeDeciduous, QrCode } from 'lucide-react';
import { dashboardService } from '../services/api';
import type { DashboardData } from '../types';
import QRDisplay from '../components/QRDisplay';
import { StatsCards } from '../components/dashboard/StatsCards';
import { ReferralChart } from '../components/dashboard/ReferralChart';
import { CommissionChart } from '../components/dashboard/CommissionChart';
import { CommissionTierBreakdown } from '../components/dashboard/CommissionTierBreakdown';
import { RecentActivity } from '../components/dashboard/RecentActivity';

export default function Dashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const loadRef = useRef(false);

  useEffect(() => {
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
      <StatsCards data={data} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReferralChart
          data={data.referralsChart || []}
          isLoading={isLoading}
          isMounted={isMounted}
        />
        <CommissionChart
          data={data.commissionsChart || []}
          isLoading={isLoading}
          isMounted={isMounted}
        />
      </div>

      {/* Commission Tier Breakdown — MLM Unilevel structure visualization */}
      <CommissionTierBreakdown commissions={data.recentCommissions} isMounted={isMounted} />

      {/* Network & Referral section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('dashboard.myNetwork')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="text-sm text-blue-600 font-medium">{t('dashboard.directReferrals')}</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{data.stats.leftCount}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
              <p className="text-sm text-purple-600 font-medium">{t('dashboard.totalNetwork')}</p>
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
      <RecentActivity data={data} />
    </div>
  );
}
