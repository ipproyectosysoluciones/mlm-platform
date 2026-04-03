/**
 * @fileoverview Streaming Dashboard demo with React 19 Suspense patterns
 * @description Demo page showcasing streaming data loading with React 19 patterns
 *              Página demo que muestra carga de datos en streaming con patrones React 19
 * @module pages/DashboardStreaming
 */

import { Component, Suspense, use, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { dashboardService } from '../services/api';
import { StatsCards } from '../components/dashboard/StatsCards';
import { ReferralChart } from '../components/dashboard/ReferralChart';
import { CommissionChart } from '../components/dashboard/CommissionChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';

/**
 * Streaming Dashboard - demonstrates React 19 Suspense streaming
 *
 * This component demonstrates:
 * - Parallel data loading with promises
 * - Suspense boundaries for streaming
 * - use() hook for promise resolution
 */

// Simulated streaming promises
const statsPromise = dashboardService.getDashboard();

/**
 * Streaming data component using React 19 use() hook
 */
function StreamedDashboardContent() {
  const { t } = useTranslation();

  // use() suspends until the promise resolves
  const data = use(statsPromise);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{t('dashboard.welcome')}</h1>
        <p className="text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats grid - streams in first */}
      <StatsCards data={data} />

      {/* Charts Section - streams in after stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReferralChart data={data.referralsChart || []} isLoading={false} isMounted={true} />
        <CommissionChart data={data.commissionsChart || []} isLoading={false} isMounted={true} />
      </div>

      {/* Activity section */}
      <RecentActivity data={data} />
    </div>
  );
}

/**
 * Skeleton component for streaming fallback
 */
function DashboardSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500">{t('common.loading')}</p>
      </div>
    </div>
  );
}

/**
 * Error fallback component
 */
function DashboardError({ error }: { error: Error }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4">Error: {error.message}</p>
        <Link to="/dashboard" className="text-emerald-500 hover:underline">
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}

/**
 * Main DashboardStreaming component with Suspense boundary
 */
export default function DashboardStreaming() {
  return (
    <ErrorBoundaryWrapper>
      <Suspense fallback={<DashboardSkeleton />}>
        <StreamedDashboardContent />
      </Suspense>
    </ErrorBoundaryWrapper>
  );
}

/**
 * Simple error boundary wrapper
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryWrapper extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <DashboardError error={this.state.error!} />;
    }
    return this.props.children;
  }
}
