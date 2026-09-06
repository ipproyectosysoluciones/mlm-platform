/**
 * @fileoverview StepGuests - Guest counter and notes step for the reservation wizard
 * @description Second step in the reservation flow: select number of guests and add notes
 *               Segundo paso del flujo de reserva: seleccionar cantidad de huéspedes y notas
 * @module components/reservation/step-guests
 * @author Nexo Real Development Team
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, AlertCircle, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useReservationWizard, computePriceBreakdown } from '../../stores/reservationStore';
import PriceBadge from './price-badge';

// ============================================
// Component / Componente
// ============================================

/**
 * Guest count and notes step — wizard step 2
 * Paso de cantidad de huéspedes y notas — paso 2 del wizard
 */
export default function StepGuests() {
  const { t } = useTranslation();
  const {
    wizardData,
    updateWizardData,
    setWizardStep,
    isCreating,
    createError,
    confirmReservation,
  } = useReservationWizard();

  const breakdown = useMemo(() => computePriceBreakdown(wizardData), [wizardData]);

  if (!wizardData) return null;

  const maxGuests = wizardData.type === 'tour' ? wizardData.availability.availableSpots : 20;

  const handleConfirm = async () => {
    try {
      await confirmReservation();
    } catch {
      // Error is already captured in createError state by the store.
      // El store captura el error en createError — no se necesita manejo adicional aquí.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-1">{t('reservation.howManyGuests')}</h2>
        {wizardData.type === 'property' ? (
          <p className="text-[var(--color-foreground-muted)] text-sm">
            {t('reservation.property')}:{' '}
            <span className="font-medium text-[var(--color-foreground)]">{wizardData.property.title}</span>
          </p>
        ) : (
          <p className="text-[var(--color-foreground-muted)] text-sm">
            {t('reservation.tour')}:{' '}
            <span className="font-medium text-[var(--color-foreground)]">{wizardData.tour.title}</span>
            {' · '}
            {new Date(wizardData.availability.date).toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        )}
      </div>

      {/* Guest counter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-[var(--color-foreground)] flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" />
          {t('reservation.numberOfGuests')}
        </label>
        <div className="flex items-center gap-3 ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => updateWizardData({ guests: Math.max(1, wizardData.guests - 1) })}
            className="h-11 w-11 rounded-lg text-lg font-medium"
          >
            −
          </Button>
          <span className="w-10 text-center font-semibold text-lg text-[var(--color-foreground)]">
            {wizardData.guests}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => updateWizardData({ guests: Math.min(maxGuests, wizardData.guests + 1) })}
            className="h-11 w-11 rounded-lg text-lg font-medium"
          >
            +
          </Button>
        </div>
      </div>

      {/* Running price total */}
      {breakdown && breakdown.totalPrice > 0 && <PriceBadge breakdown={breakdown} />}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          {t('reservation.additionalNotes')}{' '}
          <span className="text-[var(--color-foreground-muted)] font-normal">({t('reservation.optional')})</span>
        </label>
        <textarea
          value={wizardData.notes}
          onChange={(e) => updateWizardData({ notes: e.target.value })}
          placeholder={t('reservation.additionalNotesHint')}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-emerald-400 resize-none"
        />
      </div>

      {/* Error */}
      {createError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {createError}
        </div>
      )}

      <div className="flex gap-3">
        {wizardData.type === 'property' && (
          <Button
            variant="outline"
            onClick={() => setWizardStep('dates')}
            className="gap-2 px-4 py-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('reservation.back')}
          </Button>
        )}
        <Button onClick={handleConfirm} disabled={isCreating} className="flex-1 gap-2 py-3">
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('reservation.confirming')}
            </>
          ) : (
            <>
              {t('reservation.confirmReservation')}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
