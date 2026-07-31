/**
 * @fileoverview PriceBreakdownCard - Full price breakdown for confirmation/payment
 * @description Detailed price breakdown card shown in the confirmation and payment steps
 *               Tarjeta de desglose de precio detallado para pasos de confirmación/pago
 * @module components/reservation/price-breakdown-card
 * @author Nexo Real Development Team
 */

import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';
import { formatPrice } from '../../stores/reservationStore';
import type { PriceBreakdown } from '../../types/reservation';

// ============================================
// Props / Propiedades
// ============================================

export interface PriceBreakdownCardProps {
  breakdown: PriceBreakdown;
}

// ============================================
// Component / Componente
// ============================================

/**
 * Detailed price breakdown card for the confirmation/payment steps
 * Tarjeta de desglose de precio detallado para pasos de confirmación/pago
 */
export default function PriceBreakdownCard({ breakdown }: PriceBreakdownCardProps) {
  const { t } = useTranslation();
  const { currency } = breakdown;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-emerald-500" />
        {t('reservation.priceBreakdown')}
      </h3>

      <div className="space-y-2 text-sm">
        {/* Price per unit */}
        <div className="flex justify-between text-slate-600">
          <span>
            {breakdown.isProperty
              ? t('reservation.pricePerNight')
              : t('reservation.pricePerPerson')}
          </span>
          <span className="font-medium text-slate-800">
            {formatPrice(breakdown.pricePerUnit, currency)}
          </span>
        </div>

        {/* Nights (only for properties) */}
        {breakdown.isProperty && (
          <div className="flex justify-between text-slate-600">
            <span>{t('reservation.totalNights', { count: breakdown.totalNights })}</span>
            <span className="font-medium text-slate-800">× {breakdown.totalNights}</span>
          </div>
        )}

        {/* Subtotal */}
        {breakdown.isProperty && breakdown.guestCount > 1 && (
          <div className="flex justify-between text-slate-600">
            <span>{t('reservation.subtotal')}</span>
            <span className="font-medium text-slate-800">
              {formatPrice(breakdown.subtotal, currency)}
            </span>
          </div>
        )}

        {/* Guests */}
        {breakdown.guestCount > 1 && (
          <div className="flex justify-between text-slate-600">
            <span>{t('reservation.totalGuests', { count: breakdown.guestCount })}</span>
            <span className="font-medium text-slate-800">× {breakdown.guestCount}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 pt-2 mt-2">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-slate-800">{t('reservation.total')}</span>
            <span className="text-lg font-bold text-emerald-600">
              {formatPrice(breakdown.totalPrice, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
