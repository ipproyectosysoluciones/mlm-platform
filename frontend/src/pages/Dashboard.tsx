/**
 * Dashboard - Panel principal del usuario MLM
 *
 * @module pages/Dashboard
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
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
import { useAuth } from '../context/useAuth';
import MercadoPagoConnectCard from '../components/vendor/MercadoPagoConnectCard';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isVendor = user?.role === 'vendor';
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
          <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
          <p className="text-[var(--color-foreground-muted)]">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[var(--color-destructive)]">{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-foreground)]">{t('dashboard.welcome')}</h1>
        <p className="text-[var(--color-foreground-muted)] mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Vendor MercadoPago connection card (B11 / FE-1) — only for vendor role */}
      {isVendor && <MercadoPagoConnectCard />}

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
        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">{t('dashboard.myNetwork')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-primary)]/10 rounded-xl p-4 text-center border border-[var(--color-primary)]/20">
              <p className="text-sm text-[var(--color-primary)] font-medium">{t('dashboard.directReferrals')}</p>
              <p className="text-3xl font-bold text-[var(--color-primary)] mt-1">{data.stats.leftCount}</p>
            </div>
            <div className="bg-[var(--color-accent)]/10 rounded-xl p-4 text-center border border-[var(--color-accent)]/20">
              <p className="text-sm text-[var(--color-accent)] font-medium">{t('dashboard.totalNetwork')}</p>
              <p className="text-3xl font-bold text-[var(--color-accent)] mt-1">{data.stats.rightCount}</p>
            </div>
          </div>
          <Link
            to="/tree"
            className="mt-6 w-full flex items-center justify-center gap-2 bg-[var(--color-card)] text-[var(--color-foreground)] py-3 rounded-xl hover:bg-[var(--color-secondary)] transition-colors font-medium"
          >
            <TreeDeciduous className="w-5 h-5" />
            {t('dashboard.viewFullTree')}
          </Link>
        </div>

        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
            {t('dashboard.referralLink')}
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={data.referralLink}
              readOnly
              className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-secondary)] text-sm font-mono text-[var(--color-foreground)]"
            />
            <button
              onClick={copyLink}
              className="p-3 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl hover:opacity-90 transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-secondary)] text-[var(--color-foreground)] py-3 rounded-xl hover:bg-[var(--color-muted)] transition-colors font-medium"
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
