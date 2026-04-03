/**
 * AchievementCard - Displays a single achievement with progress and unlock state
 *
 * States:
 * - Unlocked: green border + glow, shows unlockedAt date
 * - Locked: dimmed, shows progress bar (currentValue / targetValue)
 * - Coming soon: overlay badge "Próximamente", no progress
 *
 * @module components/achievements/AchievementCard
 */
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import type { AchievementWithProgress } from '../../services/achievementService';

/** Tier display config */
const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  bronze: {
    label: 'Bronce',
    className: 'bg-amber-700/20 text-amber-600 border border-amber-700/30',
  },
  silver: {
    label: 'Plata',
    className: 'bg-slate-400/20 text-slate-500 border border-slate-400/30',
  },
  gold: {
    label: 'Oro',
    className: 'bg-yellow-400/20 text-yellow-600 border border-yellow-400/30',
  },
};

interface AchievementCardProps {
  achievement: AchievementWithProgress;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const {
    icon,
    name,
    description,
    points,
    tier,
    status,
    unlockedAt,
    progress,
    currentValue,
    targetValue,
  } = achievement;

  const isUnlocked = unlockedAt !== null;
  const isComingSoon = status === 'coming_soon';
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG.bronze;

  // Format unlock date (ISO → locale string)
  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Card
      className={`
        relative flex flex-col gap-3 p-5 transition-all duration-300 overflow-hidden
        ${
          isUnlocked
            ? 'border-emerald-500/60 shadow-emerald-500/15 shadow-md bg-emerald-50/30'
            : isComingSoon
              ? 'border-slate-200 bg-slate-50/50 opacity-70'
              : 'border-slate-200 bg-white'
        }
      `}
    >
      {/* Coming soon overlay badge */}
      {isComingSoon && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800/80 text-white">
            🔒 Próximamente
          </span>
        </div>
      )}

      {/* Unlocked checkmark */}
      {isUnlocked && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold">
            ✓
          </span>
        </div>
      )}

      {/* Icon */}
      <div
        className={`
          text-4xl leading-none select-none
          ${!isUnlocked && !isComingSoon ? 'grayscale opacity-60' : ''}
          ${isComingSoon ? 'grayscale opacity-40' : ''}
        `}
      >
        {icon}
      </div>

      {/* Title + badges row */}
      <div className="flex flex-wrap items-start gap-2">
        <h3
          className={`text-sm font-semibold flex-1 min-w-0 leading-snug ${
            isUnlocked ? 'text-emerald-800' : 'text-slate-800'
          }`}
        >
          {name}
        </h3>

        {/* Tier badge */}
        <Badge variant="outline" className={`text-xs shrink-0 ${tierConfig.className}`}>
          {tierConfig.label}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>

      {/* Points */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-400">+{points} pts</span>
      </div>

      {/* Progress bar — only for locked active achievements */}
      {!isUnlocked && !isComingSoon && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progreso</span>
            <span>
              {currentValue} / {targetValue}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Unlocked date */}
      {isUnlocked && formattedDate && (
        <p className="text-xs text-emerald-600 font-medium">Desbloqueado el {formattedDate}</p>
      )}
    </Card>
  );
}

export default AchievementCard;
