/**
 * @fileoverview PendingFollowUps — automation status summary card
 * @description Displays key metrics: pending follow-ups, total executions, and last action time.
 *
 * ES: Tarjeta resumen del estado de automatización: follow-ups pendientes, total ejecuciones, última acción.
 * EN: Automation status summary card: pending follow-ups, total executions, last action time.
 *
 * @module components/admin/PendingFollowUps
 */

import { useTranslation } from 'react-i18next';
import { Clock, Activity, AlertCircle } from 'lucide-react';

interface PendingFollowUpsProps {
  /** Number of pending follow-up actions / Cantidad de follow-ups pendientes */
  pendingCount: number;
  /** Total workflow executions / Total de ejecuciones de workflows */
  totalExecutions: number;
  /** ISO timestamp of last action, or null / Timestamp ISO de la última acción, o null */
  lastActionAt: string | null;
}

/**
 * Format a date string to a human-readable relative or absolute format.
 * Formatea una fecha a un formato legible.
 *
 * @param dateStr - ISO date string or null / Cadena ISO o null
 * @returns Formatted date string / Cadena de fecha formateada
 */
function formatLastAction(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return '—';
  }
}

export default function PendingFollowUps({
  pendingCount,
  totalExecutions,
  lastActionAt,
}: PendingFollowUpsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Pending Follow-Ups */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-xs text-amber-600 font-medium">
            {t('admin.automation.pendingFollowUps')}
          </p>
          <p className="text-xl font-bold text-amber-900">{pendingCount}</p>
        </div>
      </div>

      {/* Total Executions */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Activity className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-blue-600 font-medium">
            {t('admin.automation.totalExecutions')}
          </p>
          <p className="text-xl font-bold text-blue-900">{totalExecutions}</p>
        </div>
      </div>

      {/* Last Action */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="p-2 bg-slate-100 rounded-lg">
          <Clock className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">{t('admin.automation.lastAction')}</p>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {formatLastAction(lastActionAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
