/**
 * @fileoverview VariablePicker Component - Dropdown for template variable insertion
 * @description Dropdown showing allowlisted template variables, onClick inserts at cursor
 *              Dropdown que muestra variables permitidas, al hacer clic inserta en el cursor
 * @module components/EmailBuilder/VariablePicker
 * @author MLM Platform
 */

import { useState } from 'react';
import { ChevronDown, Variable } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { ALLOWED_TEMPLATE_VARIABLES } from '../../types';
import type { TemplateVariable } from '../../types';

/**
 * VariablePicker component props
 * Props del componente VariablePicker
 */
interface VariablePickerProps {
  /** Callback when a variable is selected / Callback cuando se selecciona una variable */
  onSelect: (variable: string) => void;
  /** Whether the picker is disabled / Si el picker está deshabilitado */
  disabled?: boolean;
}

/**
 * Variable descriptions for display / Descripciones de variables para mostrar
 */
const VARIABLE_DESCRIPTIONS: Record<TemplateVariable, string> = {
  firstName: 'User first name / Nombre del usuario',
  lastName: 'User last name / Apellido del usuario',
  email: 'User email / Email del usuario',
  referralCode: 'Referral code / Código de referido',
  discountCode: 'Discount code / Código de descuento',
  expiresAt: 'Expiration date / Fecha de expiración',
};

/**
 * VariablePicker - Dropdown to select and insert template variables
 * VariablePicker - Dropdown para seleccionar e insertar variables de plantilla
 */
export function VariablePicker({ onSelect, disabled = false }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Handle variable selection
   * Manejar selección de variable
   */
  const handleSelect = (variable: TemplateVariable) => {
    onSelect(`{{${variable}}}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" data-testid="variable-picker">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="border-slate-600 text-slate-200 hover:bg-slate-700 gap-1"
        aria-label="Insert variable"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Variable className="h-4 w-4" />
        Variables
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div
          role="listbox"
          className={cn(
            'absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border border-slate-600',
            'bg-slate-800 py-1 shadow-lg'
          )}
          aria-label="Template variables"
        >
          {ALLOWED_TEMPLATE_VARIABLES.map((variable) => (
            <button
              key={variable}
              type="button"
              role="option"
              className={cn(
                'flex w-full flex-col px-3 py-2 text-left',
                'hover:bg-slate-700 transition-colors'
              )}
              onClick={() => handleSelect(variable)}
              aria-selected={false}
            >
              <span className="font-mono text-sm text-emerald-400">{`{{${variable}}}`}</span>
              <span className="text-xs text-slate-400">{VARIABLE_DESCRIPTIONS[variable]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown / Fondo para cerrar dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}
    </div>
  );
}

export default VariablePicker;
