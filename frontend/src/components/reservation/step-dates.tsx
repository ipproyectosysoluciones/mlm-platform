/**
 * @fileoverview StepDates - Date selection step for the reservation wizard
 * @description First step in the reservation flow: select check-in/check-out dates
 *               Primer paso del flujo de reserva: seleccionar fechas de check-in/check-out
 * @module components/reservation/step-dates
 * @author Nexo Real Development Team
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import {
  useReservationWizard,
  computePriceBreakdown,
  formatPrice,
} from '../../stores/reservationStore';
import PriceBadge from './price-badge';

// ============================================
// Component / Componente
// ============================================

/**
 * Date selection step — wizard step 1 (property only, tours skip this)
 * Paso de selección de fechas — paso 1 del wizard (solo propiedades, tours omiten esto)
 */
export default function StepDates() {
  const { t } = useTranslation();
  const { wizardData, updateWizardData, setWizardStep } = useReservationWizard();

  const breakdown = useMemo(() => computePriceBreakdown(wizardData), [wizardData]);

  if (!wizardData || wizardData.type !== 'property') return null;

  const canContinue = wizardData.checkIn && wizardData.checkOut;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">{t('reservation.selectDates')}</h2>
        <p className="text-slate-500 text-sm">
          {t('reservation.property')}:{' '}
          <span className="font-medium text-slate-700">{wizardData.property.title}</span>
        </p>
      </div>

      {/* Price per night indicator */}
      {breakdown && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <span className="text-sm text-slate-600">
            {t('reservation.pricePerNight')}:{' '}
            <span className="font-bold text-emerald-600">
              {formatPrice(breakdown.pricePerUnit, breakdown.currency)}
            </span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('reservation.checkIn')}
          </label>
          <input
            type="date"
            value={wizardData.checkIn}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => updateWizardData({ checkIn: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('reservation.checkOut')}
          </label>
          <input
            type="date"
            value={wizardData.checkOut}
            min={wizardData.checkIn || new Date().toISOString().split('T')[0]}
            onChange={(e) => updateWizardData({ checkOut: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Running total after selecting dates */}
      {breakdown && breakdown.totalNights > 0 && <PriceBadge breakdown={breakdown} />}

      <Button
        onClick={() => setWizardStep('guests')}
        disabled={!canContinue}
        className="w-full gap-2 py-3"
      >
        {t('reservation.continue')}
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
