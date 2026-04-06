/**
 * AchievementsPage - Main achievements & badges page
 *
 * Features:
 * - Summary header: X / Y logros + total points
 * - Two sections: "Desbloqueados" (grid) and "Por desbloquear" (grid)
 * - Coming soon achievements at the bottom with special styling
 * - Loading skeleton (match LeaderboardPage pattern)
 * - Error state with retry
 *
 * @module pages/AchievementsPage
 */
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Medal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Card } from '../components/ui/card';
import { AchievementCard } from '../components/achievements/AchievementCard';
import {
  achievementService,
  type AchievementWithProgress,
  type AchievementSummary,
} from '../services/achievementService';

/** Skeleton for a single achievement card */
function AchievementSkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Skeleton className="h-10 w-10 rounded" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-2 w-full rounded-full" />
    </Card>
  );
}

/** Grid skeleton for loading state */
function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary skeleton */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </Card>
      {/* Cards grid skeleton */}
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <AchievementSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allAchievements, summaryData] = await Promise.all([
        achievementService.getAllAchievements(),
        achievementService.getMySummary(),
      ]);
      setAchievements(allAchievements);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load achievements:', err);
      setError('No se pudieron cargar los logros. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Partition achievements
  const unlocked = achievements.filter((a) => a.unlockedAt !== null);
  const locked = achievements.filter((a) => a.unlockedAt === null && a.status === 'active');
  const comingSoon = achievements.filter((a) => a.status === 'coming_soon');

  return (
    <div className="space-y-6 pb-20">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <Medal className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">🏅 Logros</h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            Desbloqueá logros completando objetivos en la plataforma
          </p>
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

      {/* Loading state */}
      {isLoading && !error && <PageSkeleton />}

      {/* Content */}
      {!isLoading && !error && summary && (
        <>
          {/* Summary stats card */}
          <Card className="p-6">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                  Logros desbloqueados
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {summary.unlocked}
                  <span className="text-lg font-normal text-slate-400 ml-1">/ {summary.total}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                  Puntos totales
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {summary.totalPoints.toLocaleString('es-AR')}
                  <span className="text-base font-normal text-slate-400 ml-1">pts</span>
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {summary.total > 0 && (
              <div className="mt-4 space-y-1">
                <div
                  className="h-2 bg-slate-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={summary.unlocked}
                  aria-valuemin={0}
                  aria-valuemax={summary.total}
                >
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((summary.unlocked / summary.total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 text-right">
                  {Math.round((summary.unlocked / summary.total) * 100)}% completado
                </p>
              </div>
            )}
          </Card>

          {/* Unlocked section */}
          {unlocked.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                ✅ Desbloqueados
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {unlocked.length}
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {unlocked.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </section>
          )}

          {/* Locked / in-progress section */}
          {locked.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                🔓 Por desbloquear
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {locked.length}
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {locked.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </section>
          )}

          {/* Coming soon section */}
          {comingSoon.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-slate-500 flex items-center gap-2">
                🔒 Próximamente
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {comingSoon.length}
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {comingSoon.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {achievements.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-5xl">🏅</span>
              <h3 className="text-lg font-semibold text-slate-700">No hay logros disponibles</h3>
              <p className="text-sm text-slate-400">
                Los logros aparecerán aquí cuando estén configurados.
              </p>
            </div>
          )}

          {/* Refresh link */}
          <div className="flex justify-center">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Actualizar datos
            </button>
          </div>
        </>
      )}
    </div>
  );
}
