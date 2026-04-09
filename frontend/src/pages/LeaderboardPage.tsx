/**
 * LeaderboardPage - Main leaderboard page
 *
 * Features:
 * - Tab selector: Vendedores 💰 / Referidos 👥
 * - Period selector: Esta semana / Este mes / Histórico
 * - Podium (top 3), RankingTable (ranks 4-10), UserRankBanner (sticky, outside top 10)
 * - Loading skeleton and error state with retry
 *
 * @module pages/LeaderboardPage
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Trophy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Card } from '../components/ui/card';
import { Podium } from '../components/leaderboard/Podium';
import { RankingTable } from '../components/leaderboard/RankingTable';
import { UserRankBanner } from '../components/leaderboard/UserRankBanner';
import {
  leaderboardService,
  type Period,
  type SellerEntry,
  type ReferrerEntry,
  type MyRankResponse,
} from '../services/leaderboardService';
import { useAuth } from '../context/useAuth';

type TabValue = 'sellers' | 'referrers';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'Esta semana' },
  { value: 'monthly', label: 'Este mes' },
  { value: 'all-time', label: 'Histórico' },
];

function PodiumSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-24 mx-auto mb-6" />
      <div className="flex items-end justify-center gap-4">
        {[2, 1, 3].map((pos) => (
          <div key={pos} className="flex-1 max-w-[120px] flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className={`rounded-full ${pos === 1 ? 'h-16 w-16' : 'h-12 w-12'}`} />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton
              className={`w-full rounded-t-sm ${pos === 1 ? 'h-24' : pos === 2 ? 'h-16' : 'h-10'}`}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('sellers');
  const [period, setPeriod] = useState<Period>('weekly');

  const [sellers, setSellers] = useState<SellerEntry[]>([]);
  const [referrers, setReferrers] = useState<ReferrerEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRankResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sellersData, referrersData, myRankData] = await Promise.all([
        leaderboardService.getTopSellers(period, 10),
        leaderboardService.getTopReferrers(period, 10),
        leaderboardService.getMyRank(period),
      ]);
      setSellers(sellersData);
      setReferrers(referrersData);
      setMyRank(myRankData);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('No se pudo cargar el leaderboard. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentUserId = (user as any)?.id as string | undefined;
  const currentTab = activeTab === 'sellers' ? sellers : referrers;
  const podiumEntries = currentTab.slice(0, 3);
  const tableEntries = currentTab.slice(3);
  const topValue = currentTab[0]
    ? activeTab === 'sellers'
      ? (currentTab[0] as SellerEntry).totalSales
      : (currentTab[0] as ReferrerEntry).referralCount
    : undefined;

  const myRankForTab = myRank
    ? activeTab === 'sellers'
      ? { rank: myRank.sellers.rank, value: myRank.sellers.totalSales }
      : { rank: myRank.referrers.rank, value: myRank.referrers.referralCount }
    : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Leaderboard</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Los mejores vendedores y referidores</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Tab selector */}
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="sellers" className="flex-1 sm:flex-none gap-1.5">
              💰 Vendedores
            </TabsTrigger>
            <TabsTrigger value="referrers" className="flex-1 sm:flex-none gap-1.5">
              👥 Referidos
            </TabsTrigger>
          </TabsList>

          {/* Period selector */}
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  period === p.value
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-red-500 text-sm text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </Button>
          </div>
        )}

        {/* Loading — full page skeleton */}
        {isLoading && !error && (
          <div className="mt-4 space-y-4">
            <PodiumSkeleton />
            <RankingTable
              entries={[]}
              metricLabel={activeTab === 'sellers' ? 'Ventas' : 'Referidos'}
              isLoading
            />
          </div>
        )}

        {/* Content — shown once loaded */}
        {!isLoading && !error && (
          <>
            <TabsContent value="sellers" className="mt-4 space-y-4">
              {podiumEntries.length > 0 && <Podium entries={podiumEntries} />}
              <RankingTable
                entries={tableEntries}
                currentUserId={currentUserId}
                metricLabel="Ventas (USD)"
                topValue={topValue}
              />
            </TabsContent>

            <TabsContent value="referrers" className="mt-4 space-y-4">
              {podiumEntries.length > 0 && <Podium entries={podiumEntries} />}
              <RankingTable
                entries={tableEntries}
                currentUserId={currentUserId}
                metricLabel="Referidos"
                topValue={topValue}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Refresh hint */}
      {!isLoading && !error && (
        <div className="flex justify-center">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Actualizar datos
          </button>
        </div>
      )}

      {/* Sticky banner for user outside top 10 */}
      {myRankForTab && (
        <UserRankBanner rank={myRankForTab.rank} value={myRankForTab.value} type={activeTab} />
      )}

      {/* Loading indicator for sticky banner area */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      )}
    </div>
  );
}
