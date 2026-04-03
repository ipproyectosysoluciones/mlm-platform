/**
 * RankingTable - Leaderboard table for ranks 4–10 (or full list)
 *
 * Features:
 * - Rank badge, avatar, name, metric value, progress bar
 * - Highlights current user row
 * - Shows Skeleton rows while loading
 *
 * @module components/leaderboard/RankingTable
 */
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import type { SellerEntry, ReferrerEntry } from '../../services/leaderboardService';

type Entry = SellerEntry | ReferrerEntry;

function isSeller(entry: Entry): entry is SellerEntry {
  return 'totalSales' in entry;
}

function getMetricValue(entry: Entry): number {
  return isSeller(entry) ? entry.totalSales : entry.referralCount;
}

function formatMetric(entry: Entry): string {
  if (isSeller(entry)) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(entry.totalSales);
  }
  return `${entry.referralCount} referidos`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function rankBadgeVariant(rank: number): 'default' | 'secondary' | 'outline' {
  if (rank <= 3) return 'default';
  if (rank <= 7) return 'secondary';
  return 'outline';
}

interface RankingTableProps {
  entries: Entry[];
  currentUserId?: string;
  metricLabel: string;
  topValue?: number;
  isLoading?: boolean;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-6 w-8 rounded-full" />
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="w-24 space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

/**
 * Renders a ranked list of entries with progress bars.
 *
 * @param entries - The list of entries to display
 * @param currentUserId - The current user's ID to highlight their row
 * @param metricLabel - Label for the metric column (e.g. "Ventas" / "Referidos")
 * @param topValue - The rank-1 metric value used to calculate progress %
 * @param isLoading - Show skeleton rows while fetching
 */
export function RankingTable({
  entries,
  currentUserId,
  metricLabel,
  topValue,
  isLoading = false,
}: RankingTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card divide-y divide-border">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-t-lg">
          <span className="text-xs font-semibold text-muted-foreground w-8">#</span>
          <span className="text-xs font-semibold text-muted-foreground flex-1">Usuario</span>
          <span className="text-xs font-semibold text-muted-foreground w-24 text-right">
            {metricLabel}
          </span>
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground text-sm">No hay datos para este período</p>
      </div>
    );
  }

  const effectiveTopValue = topValue ?? getMetricValue(entries[0]);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b">
        <span className="text-xs font-semibold text-muted-foreground w-8">#</span>
        <span className="text-xs font-semibold text-muted-foreground w-9" />
        <span className="text-xs font-semibold text-muted-foreground flex-1">Usuario</span>
        <span className="text-xs font-semibold text-muted-foreground w-28 text-right">
          {metricLabel}
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {entries.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;
          const value = getMetricValue(entry);
          const progressPct = effectiveTopValue > 0 ? (value / effectiveTopValue) * 100 : 0;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isCurrentUser ? 'bg-purple-50 border-l-4 border-l-purple-500' : 'hover:bg-muted/30'
              }`}
            >
              {/* Rank badge */}
              <Badge
                variant={rankBadgeVariant(entry.rank)}
                className="w-8 h-6 justify-center text-xs shrink-0"
              >
                {entry.rank}
              </Badge>

              {/* Avatar */}
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={entry.profileImage} alt={entry.name} />
                <AvatarFallback className="text-xs font-semibold bg-slate-100 text-slate-600">
                  {getInitials(entry.name)}
                </AvatarFallback>
              </Avatar>

              {/* Name + username */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isCurrentUser ? 'text-purple-800' : 'text-slate-800'
                  }`}
                >
                  {entry.name}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-xs text-purple-600 font-normal">(tú)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
              </div>

              {/* Metric + progress */}
              <div className="w-28 shrink-0 space-y-1">
                <p
                  className={`text-xs font-bold text-right ${
                    isCurrentUser ? 'text-purple-700' : 'text-slate-700'
                  }`}
                >
                  {formatMetric(entry)}
                </p>
                <Progress
                  value={progressPct}
                  className={`h-1.5 ${isCurrentUser ? '[&>div]:bg-purple-500' : ''}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RankingTable;
