/**
 * @fileoverview CRMAutomationWidget — n8n automation dashboard widget
 * @description Composite widget that shows automation status summary (PendingFollowUps)
 *              and recent workflow executions (RecentActions). Uses useCRMAutomation hook
 *              for data fetching with 60s polling.
 *
 * ES: Widget compuesto del dashboard de automatización n8n. Muestra resumen de estado
 *     (PendingFollowUps) y acciones recientes (RecentActions). Usa useCRMAutomation
 *     con polling de 60s.
 * EN: Composite n8n automation dashboard widget. Shows status summary
 *     (PendingFollowUps) and recent actions (RecentActions). Uses useCRMAutomation
 *     with 60s polling.
 *
 * @module components/admin/CRMAutomationWidget
 */

import { useTranslation } from 'react-i18next';
import { RefreshCw, Zap } from 'lucide-react';
import { useCRMAutomation } from '../../hooks/useCRMAutomation';
import PendingFollowUps from './PendingFollowUps';
import RecentActions from './RecentActions';

export default function CRMAutomationWidget() {
  const { t } = useTranslation();
  const { status, executions, isLoading, error, refetch } = useCRMAutomation();

  // Loading state
  if (isLoading) {
    return (
      <div
        data-testid="automation-widget-loading"
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse"
      >
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="h-20 bg-slate-100 rounded-lg" />
          <div className="h-20 bg-slate-100 rounded-lg" />
          <div className="h-20 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-900">{t('admin.automation.title')}</h3>
        </div>
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{t('admin.automation.title')}</h3>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          aria-label={t('admin.automation.refresh')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Status Summary */}
      <PendingFollowUps
        pendingCount={status?.pendingFollowUps ?? 0}
        totalExecutions={status?.totalExecutions ?? 0}
        lastActionAt={status?.lastActionAt ?? null}
      />

      {/* Recent Actions */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">
          {t('admin.automation.recentActions')}
        </h4>
        <RecentActions executions={executions} />
      </div>
    </div>
  );
}
