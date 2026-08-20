/**
 * @fileoverview StepConfirm - Confirmation and success display step for the reservation wizard
 * @description Third step in the reservation flow: shows confirmed reservation details with
 *              success message and options to proceed to payment or pay later
 *               Tercer paso del flujo de reserva: muestra detalles de reserva confirmada con
 *               mensaje de éxito y opciones para proceder al pago o pagar después
 * @module components/reservation/step-confirm
 * @author Nexo Real Development Team
 */

import { useTranslation } from 'react-i18next';
import { CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useReservationWizard } from '../../stores/reservationStore';
import type { PriceBreakdown } from '../../types/reservation';
import PriceBreakdownCard from './price-breakdown-card';

// ============================================
// Props / Propiedades
// ============================================

export interface StepConfirmProps {
  onGoToPayment: () => void;
  onGoToReservations: () => void;
  breakdown: PriceBreakdown | null;
}

// ============================================
// Component / Componente
// ============================================

/**
 * Confirmation step — wizard step 3, shows success state after reservation is created
 * Paso de confirmación — paso 3 del wizard, muestra estado de éxito tras crear la reserva
 */
export default function StepConfirm({
  onGoToPayment,
  onGoToReservations,
  breakdown,
}: StepConfirmProps) {
  const { t } = useTranslation();
  const { createdReservation, wizardData } = useReservationWizard();

  return (
    <div className="space-y-6 py-2">
      {/* Success header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {t('reservation.reservationConfirmed')}
        </h2>
        <p className="text-slate-500 text-sm">{t('reservation.reservationConfirmedDesc')}</p>
      </div>

      {/* Reservation details */}
      {createdReservation && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{t('reservation.reservationId')}:</span>{' '}
            <span className="font-mono text-xs">{createdReservation.id}</span>
          </p>
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{t('reservation.status')}:</span>{' '}
            <span className="capitalize">{createdReservation.status}</span>
          </p>
          {wizardData?.type === 'property' && (
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{t('reservation.property')}:</span>{' '}
              {wizardData.property.title}
            </p>
          )}
          {wizardData?.type === 'tour' && (
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{t('reservation.tour')}:</span>{' '}
              {wizardData.tour.title}
            </p>
          )}
        </div>
      )}

      {/* Price breakdown card */}
      {breakdown && breakdown.totalPrice > 0 && <PriceBreakdownCard breakdown={breakdown} />}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button onClick={onGoToPayment} className="w-full gap-2 py-3">
          <Lock className="mr-2 h-4 w-4" />
          {t('reservation.selectPayment')}
          <ChevronRight className="w-5 h-5" />
        </Button>
        <Button variant="ghost" onClick={onGoToReservations} className="w-full py-3 text-sm">
          {t('reservation.payLater')}
          <span className="ml-2 text-slate-400">— {t('reservation.payLaterHint')}</span>
        </Button>
      </div>
    </div>
  );
}
