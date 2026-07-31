/**
 * @fileoverview ReservationFlowPage - 4-step reservation wizard with price display and payment
 * @description Handles the complete reservation flow: dates → guests → confirmation → payment
 *               Maneja el flujo completo de reserva: fechas → huéspedes → confirmación → pago
 * @module pages/ReservationFlowPage
 * @author Nexo Real Development Team
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MapPin, Compass } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useReservationWizard, computePriceBreakdown } from '../stores/reservationStore';
import type { WizardStep } from '../stores/reservationStore';
import {
  StepIndicator,
  StepDates,
  StepGuests,
  StepConfirm,
  StepPayment,
} from '../components/reservation';

// ============================================
// Constants / Constantes
// ============================================

/**
 * All wizard steps including the new payment step
 * Todos los pasos del wizard incluyendo el nuevo paso de pago
 */
const STEPS: { id: WizardStep; labelKey: string }[] = [
  { id: 'dates', labelKey: 'reservation.dates' },
  { id: 'guests', labelKey: 'reservation.guests' },
  { id: 'confirm', labelKey: 'reservation.confirmation' },
  { id: 'payment', labelKey: 'reservation.payment' },
];

// ============================================
// Main Page / Página principal
// ============================================

/**
 * ReservationFlowPage component — 4-step wizard: dates → guests → confirm → payment
 * Componente de página de flujo de reserva (wizard de 4 pasos)
 */
export default function ReservationFlowPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { wizardData, wizardStep, closeWizard, setWizardStep } = useReservationWizard();

  const breakdown = useMemo(() => computePriceBreakdown(wizardData), [wizardData]);

  // If no wizard data, redirect home
  useEffect(() => {
    if (!wizardData) {
      navigate('/', { replace: true });
    }
  }, [wizardData, navigate]);

  if (!wizardData) return null;

  // Tour skips the dates step — jump directly to guests
  const effectiveStep =
    wizardData.type === 'tour' && wizardStep === 'dates' ? 'guests' : wizardStep;

  // Visible steps: tours skip 'dates'
  const visibleSteps = wizardData.type === 'tour' ? STEPS.filter((s) => s.id !== 'dates') : STEPS;

  const handleCancel = () => {
    closeWizard();
    navigate(-1);
  };

  const contextIcon =
    wizardData.type === 'property' ? (
      <MapPin className="w-5 h-5 text-emerald-500" />
    ) : (
      <Compass className="w-5 h-5 text-emerald-500" />
    );

  const contextLabel =
    wizardData.type === 'property' ? wizardData.property.title : wizardData.tour.title;

  const showCancelBtn = effectiveStep !== 'confirm' && effectiveStep !== 'payment';

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {contextIcon}
            <span className="font-medium line-clamp-1">{contextLabel}</span>
          </div>
          {showCancelBtn && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              {t('reservation.cancel')}
            </Button>
          )}
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={effectiveStep} visibleSteps={visibleSteps} />

        {/* Step content */}
        {effectiveStep === 'dates' && <StepDates />}
        {effectiveStep === 'guests' && <StepGuests />}
        {effectiveStep === 'confirm' && (
          <StepConfirm
            onGoToPayment={() => setWizardStep('payment')}
            onGoToReservations={() => {
              closeWizard();
              navigate('/mis-reservas');
            }}
            breakdown={breakdown}
          />
        )}
        {effectiveStep === 'payment' && (
          <StepPayment
            onDone={() => {
              closeWizard();
              navigate(wizardData.type === 'property' ? '/properties' : '/tours');
            }}
            onGoToReservations={() => {
              closeWizard();
              navigate('/mis-reservas');
            }}
            breakdown={breakdown}
          />
        )}
      </div>
    </div>
  );
}
