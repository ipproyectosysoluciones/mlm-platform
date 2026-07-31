/**
 * @fileoverview PriceBadge - Compact price indicator for the reservation wizard
 * @description Shows a compact price per unit and total line, used throughout the wizard steps
 *               Badge compacto de precio mostrado a lo largo del wizard
 * @module components/reservation/price-badge
 * @author Nexo Real Development Team
 */

import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { formatPrice } from '../../stores/reservationStore';
import type { PriceBreakdown } from '../../stores/reservationStore';

// ============================================
// Props / Propiedades
// ============================================

export interface PriceBadgeProps {
  breakdown: PriceBreakdown;
  compact?: boolean;
}

// ============================================
// Component / Componente
// ============================================

/**
 * Compact price badge shown throughout the wizard
 * Badge compacto de precio mostrado a lo largo del wizard
 */
export default function PriceBadge({ breakdown, compact = false }: PriceBadgeProps) {
  const { t } = useTranslation();

  if (breakdown.totalPrice <= 0 && breakdown.isProperty) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-emerald-200 bg-emerald-50/50',
        compact ? 'px-3 py-2' : 'px-4 py-3'
      )}
    >
      {breakdown.isProperty ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            {t('reservation.pricePerNight')}:{' '}
            <span className="font-semibold text-slate-800">
              {formatPrice(breakdown.pricePerUnit, breakdown.currency)}
            </span>
          </span>
          {breakdown.totalNights > 0 && (
            <span className="text-sm font-bold text-emerald-600">
              {t('reservation.total')}: {formatPrice(breakdown.totalPrice, breakdown.currency)}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            {t('reservation.pricePerPerson')}:{' '}
            <span className="font-semibold text-slate-800">
              {formatPrice(breakdown.pricePerUnit, breakdown.currency)}
            </span>
          </span>
          <span className="text-sm font-bold text-emerald-600">
            {t('reservation.total')}: {formatPrice(breakdown.totalPrice, breakdown.currency)}
          </span>
        </div>
      )}
    </div>
  );
}
