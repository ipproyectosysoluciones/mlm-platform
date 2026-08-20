/**
 * @fileoverview StepIndicator - Wizard step progress indicator
 * @description Shows the current step in the reservation wizard with visual progress
 *               Indicador visual del paso actual en el wizard de reserva
 * @module components/reservation/step-indicator
 * @author Nexo Real Development Team
 */

import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { WizardStep } from '../../stores/reservationStore';

// ============================================
// Types / Tipos
// ============================================

export interface Step {
  id: WizardStep;
  labelKey: string;
}

export interface StepIndicatorProps {
  currentStep: WizardStep;
  /** Steps to show (tour skips 'dates') / Pasos a mostrar (tour omite 'dates') */
  visibleSteps: Step[];
}

// ============================================
// Component / Componente
// ============================================

/**
 * Step progress indicator for the reservation wizard
 * Indicador de progreso de pasos para el wizard de reserva
 */
export default function StepIndicator({ currentStep, visibleSteps }: StepIndicatorProps) {
  const { t } = useTranslation();
  const visibleOrder = visibleSteps.map((s) => s.id);
  const currentIndex = visibleOrder.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto">
      {visibleSteps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                  isDone && 'bg-emerald-500 border-emerald-500 text-white',
                  isCurrent && 'bg-white border-emerald-500 text-emerald-600',
                  !isDone && !isCurrent && 'bg-white border-slate-200 text-slate-400'
                )}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 whitespace-nowrap min-w-0',
                  isCurrent ? 'text-emerald-600 font-medium' : 'text-slate-400'
                )}
              >
                {t(step.labelKey)}
              </span>
            </div>
            {i < visibleSteps.length - 1 && (
              <div
                className={cn(
                  'w-12 sm:w-16 h-0.5 mb-4 mx-1 transition-all',
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
