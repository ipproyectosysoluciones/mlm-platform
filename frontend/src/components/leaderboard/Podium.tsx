/**
 * Podium - Visual top-3 leaderboard podium
 *
 * Layout: 2nd (left, medium), 1st (center, tallest/elevated), 3rd (right, smallest)
 *
 * @module components/leaderboard/Podium
 */
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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
  return `${entry.referralCount} ref.`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface PodiumSlotProps {
  entry: Entry;
  position: 1 | 2 | 3;
}

const MEDAL_CONFIG = {
  1: {
    emoji: '🥇',
    label: '1°',
    ringColor: 'ring-yellow-400',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    barHeight: 'h-24',
    avatarSize: 'h-16 w-16',
    elevated: true,
  },
  2: {
    emoji: '🥈',
    label: '2°',
    ringColor: 'ring-slate-400',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    barHeight: 'h-16',
    avatarSize: 'h-12 w-12',
    elevated: false,
  },
  3: {
    emoji: '🥉',
    label: '3°',
    ringColor: 'ring-amber-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    barHeight: 'h-10',
    avatarSize: 'h-12 w-12',
    elevated: false,
  },
} as const;

function PodiumSlot({ entry, position }: PodiumSlotProps) {
  const config = MEDAL_CONFIG[position];

  return (
    <div className={`flex flex-col items-center gap-2 ${config.elevated ? 'pb-0' : 'pb-0 mt-6'}`}>
      {/* Medal + Avatar */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl">{config.emoji}</span>
        <Avatar
          className={`${config.avatarSize} ring-2 ${config.ringColor} ring-offset-2 ring-offset-white`}
        >
          <AvatarImage src={entry.profileImage} alt={entry.name} />
          <AvatarFallback className={`${config.bgColor} ${config.textColor} font-bold text-sm`}>
            {getInitials(entry.name)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Name & username */}
      <div className="text-center max-w-[90px]">
        <p className="font-semibold text-slate-800 text-sm leading-tight truncate">{entry.name}</p>
        <p className="text-xs text-slate-500 truncate">@{entry.username}</p>
      </div>

      {/* Metric value */}
      <p className={`text-xs font-bold ${config.textColor} text-center`}>{formatMetric(entry)}</p>

      {/* Podium bar */}
      <div
        className={`w-full ${config.barHeight} ${config.bgColor} border-t-2 ${config.ringColor.replace('ring-', 'border-')} rounded-t-sm flex items-center justify-center`}
      >
        <span className={`text-lg font-black ${config.textColor}`}>{config.label}</span>
      </div>
    </div>
  );
}

interface PodiumProps {
  entries: Entry[];
}

/**
 * Renders a top-3 podium.
 * Expects entries sorted by rank (rank 1, 2, 3).
 * If fewer than 3 entries are provided, missing positions are hidden.
 */
export function Podium({ entries }: PodiumProps) {
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  if (!first && !second && !third) {
    return null;
  }

  // Calculate max metric for relative scale
  const maxValue = first ? getMetricValue(first) : 1;
  void maxValue; // used for future progress bars

  return (
    <Card className="p-6 bg-gradient-to-b from-slate-50 to-white">
      <h2 className="text-center text-lg font-bold text-slate-700 mb-6">🏆 Top 3</h2>
      <div className="flex items-end justify-center gap-4">
        {/* 2nd place — left */}
        {second ? (
          <div className="flex-1 max-w-[110px]">
            <PodiumSlot entry={second} position={2} />
          </div>
        ) : (
          <div className="flex-1 max-w-[110px]" />
        )}

        {/* 1st place — center, elevated */}
        {first ? (
          <div className="flex-1 max-w-[120px]">
            <PodiumSlot entry={first} position={1} />
          </div>
        ) : (
          <div className="flex-1 max-w-[120px]" />
        )}

        {/* 3rd place — right */}
        {third ? (
          <div className="flex-1 max-w-[110px]">
            <PodiumSlot entry={third} position={3} />
          </div>
        ) : (
          <div className="flex-1 max-w-[110px]" />
        )}
      </div>
    </Card>
  );
}

export default Podium;
