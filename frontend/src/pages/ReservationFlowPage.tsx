/**
 * @fileoverview ReservationFlowPage - 3-step reservation wizard
 * @description Handles the complete reservation flow: dates/selection → guest count → confirmation
 *               Maneja el flujo completo de reserva: fechas/selección → cantidad de huéspedes → confirmación
 * @module pages/ReservationFlowPage
 * @author Nexo Real Development Team
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Users,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Compass,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useReservationWizard } from '../stores/reservationStore';
import type { WizardStep } from '../stores/reservationStore';
import { cn } from '../lib/utils';

// ============================================
// Constants / Constantes
// ============================================

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'dates', label: 'Fechas' },
  { id: 'guests', label: 'Huéspedes' },
  { id: 'confirm', label: 'Confirmación' },
];

const STEP_ORDER: WizardStep[] = ['dates', 'guests', 'confirm'];

// ============================================
// Step indicator / Indicador de pasos
// ============================================

interface StepIndicatorProps {
  currentStep: WizardStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                  isDone && 'bg-emerald-500 border-emerald-500 text-white',
                  isCurrent && 'bg-white border-emerald-500 text-emerald-600',
                  !isDone && !isCurrent && 'bg-white border-slate-200 text-slate-400'
                )}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1',
                  isCurrent ? 'text-emerald-600 font-medium' : 'text-slate-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-16 h-0.5 mb-4 mx-1 transition-all',
                  i < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Step 1: Dates (property) / step auto for tour
// ============================================

function StepDates() {
  const { wizardData, updateWizardData, setWizardStep } = useReservationWizard();

  if (!wizardData || wizardData.type !== 'property') return null;

  const canContinue = wizardData.checkIn && wizardData.checkOut;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Seleccioná las fechas</h2>
        <p className="text-slate-500 text-sm">
          Propiedad: <span className="font-medium text-slate-700">{wizardData.property.title}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Check-in</label>
          <input
            type="date"
            value={wizardData.checkIn}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => updateWizardData({ checkIn: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Check-out</label>
          <input
            type="date"
            value={wizardData.checkOut}
            min={wizardData.checkIn || new Date().toISOString().split('T')[0]}
            onChange={(e) => updateWizardData({ checkOut: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      <button
        onClick={() => setWizardStep('guests')}
        disabled={!canContinue}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ============================================
// Step 2: Guests
// ============================================

function StepGuests() {
  const {
    wizardData,
    updateWizardData,
    setWizardStep,
    isCreating,
    createError,
    confirmReservation,
  } = useReservationWizard();

  if (!wizardData) return null;

  const maxGuests = wizardData.type === 'tour' ? wizardData.availability.availableSpots : 20;

  const handleConfirm = async () => {
    await confirmReservation();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">¿Cuántas personas?</h2>
        {wizardData.type === 'property' ? (
          <p className="text-slate-500 text-sm">
            Propiedad:{' '}
            <span className="font-medium text-slate-700">{wizardData.property.title}</span>
          </p>
        ) : (
          <p className="text-slate-500 text-sm">
            Tour: <span className="font-medium text-slate-700">{wizardData.tour.title}</span>
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
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" />
          Número de personas
        </label>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => updateWizardData({ guests: Math.max(1, wizardData.guests - 1) })}
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-lg font-medium"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold text-lg text-slate-800">
            {wizardData.guests}
          </span>
          <button
            onClick={() => updateWizardData({ guests: Math.min(maxGuests, wizardData.guests + 1) })}
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-lg font-medium"
          >
            +
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Notas adicionales <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          value={wizardData.notes}
          onChange={(e) => updateWizardData({ notes: e.target.value })}
          placeholder="Alguna solicitud especial, preferencias, etc."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 resize-none"
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
          <button
            onClick={() => setWizardStep('dates')}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={isCreating}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              Confirmar reserva
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 3: Confirmation
// ============================================

interface StepConfirmProps {
  onDone: () => void;
  onGoToReservations: () => void;
}

function StepConfirm({ onDone, onGoToReservations }: StepConfirmProps) {
  const { createdReservation, wizardData } = useReservationWizard();

  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Reserva confirmada!</h2>
        <p className="text-slate-500">
          Tu solicitud fue enviada. El equipo de Nexo Real se va a contactar con vos a la brevedad
          para coordinar los detalles.
        </p>
      </div>

      {createdReservation && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">ID de reserva:</span>{' '}
            <span className="font-mono text-xs">{createdReservation.id}</span>
          </p>
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">Estado:</span>{' '}
            <span className="capitalize">{createdReservation.status}</span>
          </p>
          {wizardData?.type === 'property' && (
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Propiedad:</span>{' '}
              {wizardData.property.title}
            </p>
          )}
          {wizardData?.type === 'tour' && (
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Tour:</span> {wizardData.tour.title}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onGoToReservations}
          className="flex-1 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          Ver mis reservas
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-3 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
        >
          Seguir explorando
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Page / Página principal
// ============================================

/**
 * ReservationFlowPage component
 * Componente de página de flujo de reserva (wizard)
 */
export default function ReservationFlowPage() {
  const navigate = useNavigate();
  const { wizardData, wizardStep, closeWizard } = useReservationWizard();

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

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {contextIcon}
            <span className="font-medium line-clamp-1">{contextLabel}</span>
          </div>
          {effectiveStep !== 'confirm' && (
            <button
              onClick={handleCancel}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={effectiveStep} />

        {/* Step content */}
        {effectiveStep === 'dates' && <StepDates />}
        {effectiveStep === 'guests' && <StepGuests />}
        {effectiveStep === 'confirm' && (
          <StepConfirm
            onDone={() => {
              closeWizard();
              navigate(wizardData.type === 'property' ? '/properties' : '/tours');
            }}
            onGoToReservations={() => {
              closeWizard();
              navigate('/mis-reservas');
            }}
          />
        )}
      </div>
    </div>
  );
}
