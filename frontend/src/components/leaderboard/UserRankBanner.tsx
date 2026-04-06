/**
 * UserRankBanner - Sticky bottom banner showing current user's rank
 *
 * Only renders when rank > 10 (user is outside top 10).
 * Hidden when rank is null (user not ranked) or rank <= 10 (already visible in table).
 *
 * @module components/leaderboard/UserRankBanner
 */

interface UserRankBannerProps {
  rank: number | null;
  value: number;
  type: 'sellers' | 'referrers';
}

function formatValue(value: number, type: 'sellers' | 'referrers'): string {
  if (type === 'sellers') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return `${value} referidos`;
}

/**
 * Sticky banner showing the current user's rank and metric value.
 * Only renders if rank > 10 (user is outside the visible top 10).
 */
export function UserRankBanner({ rank, value, type }: UserRankBannerProps) {
  // Don't show if user is in top 10 or not ranked
  if (rank === null || rank <= 10) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl shadow-black/30">
          {/* Position info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Tu posición</p>
              <p className="text-slate-400 text-xs">
                {type === 'sellers' ? 'Vendedores' : 'Referidos'}
              </p>
            </div>
          </div>

          {/* Rank + metric */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-purple-400 font-black text-xl leading-none">#{rank}</p>
              <p className="text-slate-400 text-xs mt-0.5">posición</p>
            </div>
            <div className="text-right border-l border-slate-700 pl-4">
              <p className="text-white font-bold text-sm">{formatValue(value, type)}</p>
              <p className="text-slate-400 text-xs">
                {type === 'sellers' ? 'en ventas' : 'referidos'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRankBanner;
