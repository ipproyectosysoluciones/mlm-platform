/**
 * @fileoverview Client-side Dashboard component
 * @description Interactive dashboard component with client-side state management
 *              Componente de Dashboard interactivo con manejo de estado del lado del cliente
 * @module components/client/DashboardClient
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { dashboardService } from '../../services/api';
import { useData } from '../../hooks/useData';
import { useOptimistic } from '../../hooks/useOptimistic';
import type { DashboardData, DashboardStats } from '../../types';

/**
 * Client-side Dashboard component
 * Handles all interactive features and state
 */
interface DashboardClientProps {
  initialData?: DashboardData;
  children?: (data: DashboardData) => ReactNode;
}

export function DashboardClient({ initialData, children }: DashboardClientProps): ReactNode {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(initialData ?? null);

  // Use the data fetching hook
  const { data, error, isLoading } = useData({
    fetcher: () => dashboardService.getDashboard(),
    fallback: initialData ?? undefined,
  });

  useEffect(() => {
    if (data) {
      setDashboardData(data);
    }
  }, [data]);

  const handleRefresh = useCallback(async () => {
    try {
      const freshData = await dashboardService.getDashboard();
      setDashboardData(freshData);
    } catch (err) {
      console.error('Failed to refresh dashboard:', err);
    }
  }, []);

  if (isLoading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={handleRefresh} />;
  }

  if (!dashboardData) {
    return <DashboardEmpty />;
  }

  if (children) {
    return <>{children(dashboardData)}</>;
  }

  return <DashboardContent data={dashboardData} onRefresh={handleRefresh} />;
}

/**
 * Dashboard content with stats and charts
 */
function DashboardContent({
  data,
  onRefresh,
}: {
  data: DashboardData;
  onRefresh: () => void;
}): ReactNode {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Actualizar
        </button>
      </div>

      <StatsCards stats={data.stats} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentReferrals referrals={data.recentReferrals} />
        <RecentCommissions commissions={data.recentCommissions} />
      </div>

      {data.referralLink && <ReferralLink link={data.referralLink} />}
    </div>
  );
}

/**
 * Stats cards component
 */
function StatsCards({ stats }: { stats: DashboardStats }): ReactNode {
  const statsConfig = [
    {
      label: 'Total Referidos',
      value: stats.totalReferrals,
      color: 'text-blue-600',
    },
    {
      label: 'Ganancias Totales',
      value: `$${stats.totalEarnings.toFixed(2)}`,
      color: 'text-green-600',
    },
    {
      label: 'Izquierda',
      value: stats.leftCount,
      color: 'text-purple-600',
    },
    {
      label: 'Derecha',
      value: stats.rightCount,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat) => (
        <div
          key={stat.label}
          className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm"
        >
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Recent referrals list
 */
function RecentReferrals({
  referrals,
}: {
  referrals: DashboardData['recentReferrals'];
}): ReactNode {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="font-semibold mb-4">Referidos Recientes</h3>
        {referrals.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay referidos aún</p>
        ) : (
          <ul className="space-y-3">
            {referrals.slice(0, 5).map((referral) => (
              <li key={referral.id} className="flex items-center justify-between text-sm">
                <span>{referral.email}</span>
                <span className="text-muted-foreground">{referral.position}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Recent commissions list
 */
function RecentCommissions({
  commissions,
}: {
  commissions: DashboardData['recentCommissions'];
}): ReactNode {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="font-semibold mb-4">Comisiones Recientes</h3>
        {commissions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay comisiones aún</p>
        ) : (
          <ul className="space-y-3">
            {commissions.slice(0, 5).map((commission) => (
              <li key={commission.id} className="flex items-center justify-between text-sm">
                <span>{commission.type}</span>
                <span className="font-medium text-green-600">+${commission.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Referral link component
 */
function ReferralLink({ link }: { link: string }): ReactNode {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [link]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h3 className="font-semibold mb-2">Tu Link de Referido</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={link}
          readOnly
          className="flex-1 px-3 py-2 border rounded-md bg-background"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

/**
 * Skeleton loading state
 */
function DashboardSkeleton(): ReactNode {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Error state
 */
function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }): ReactNode {
  return (
    <div className="text-center py-12">
      <p className="text-destructive mb-4">Error: {error.message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Reintentar
      </button>
    </div>
  );
}

/**
 * Empty state
 */
function DashboardEmpty(): ReactNode {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No hay datos disponibles</p>
    </div>
  );
}

/**
 * Optimistic Dashboard with real-time updates
 */
export function OptimisticDashboard({ initialData }: { initialData: DashboardData }): ReactNode {
  const { data: dashboardData, isOptimistic } = useOptimistic(initialData);

  return (
    <div className={isOptimistic ? 'opacity-70 transition-opacity' : ''}>
      <DashboardContent data={dashboardData} onRefresh={() => {}} />
    </div>
  );
}
