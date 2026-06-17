/**
 * @fileoverview RecentActions — list of recent n8n workflow executions
 * @description Displays a compact list of the most recent workflow execution records
 *              with lead name, workflow, action type, and status badge.
 *
 * ES: Lista compacta de ejecuciones de workflow recientes con nombre del lead,
 *     workflow, tipo de acción y badge de estado.
 * EN: Compact list of recent workflow executions with lead name, workflow,
 *     action type, and status badge.
 *
 * @module components/admin/RecentActions
 */

import { useTranslation } from 'react-i18next';
import type { WorkflowExecutionRecord } from '../../services/crmService';

interface RecentActionsProps {
  /** List of recent workflow execution records / Lista de ejecuciones recientes */
  executions: WorkflowExecutionRecord[];
}

/**
 * Map execution status to a color scheme.
 * Mapea el estado de ejecución a un esquema de colores.
 */
function getStatusColors(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function RecentActions({ executions }: RecentActionsProps) {
  const { t } = useTranslation();

  if (executions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>{t('admin.automation.noActions')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {executions.map((execution) => (
        <div key={execution.id} className="flex items-center justify-between py-3 px-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {execution.Lead?.contactName ?? t('admin.automation.unknownLead')}
            </p>
            <p className="text-xs text-slate-500">
              {execution.workflowName} · {execution.actionType}
            </p>
          </div>
          <span
            className={`ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColors(execution.status)}`}
          >
            {execution.status}
          </span>
        </div>
      ))}
    </div>
  );
}
