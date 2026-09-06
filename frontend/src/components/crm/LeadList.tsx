/**
 * LeadList - Lead list with filters, search, and advanced filtering
 * Lista de leads con filtros, búsqueda y filtrado avanzado
 *
 * Controlled component — all state is provided by the parent via props.
 * This enables CRM.tsx to share the same useCRMLeads hook instance.
 *
 * @module components/crm/LeadList
 */
import { useTranslation } from 'react-i18next';
import { Users, Search, Filter } from 'lucide-react';
import { LeadCard } from './LeadCard';
import { LEAD_SOURCES } from '@/features/crm/constants';
import type { Lead } from '@/types';

// ============================================================================
// Props
// ============================================================================

export interface LeadListProps {
  leads: Lead[];
  leadsLoading: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sourceFilter: string;
  setSourceFilter: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  valueMin: string;
  setValueMin: (value: string) => void;
  valueMax: string;
  setValueMax: (value: string) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (value: boolean) => void;
  onNewLead: () => void;
  onLeadClick: (leadId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function LeadList({
  leads,
  leadsLoading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sourceFilter,
  setSourceFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  valueMin,
  setValueMin,
  valueMax,
  setValueMax,
  showAdvancedFilters,
  setShowAdvancedFilters,
  onNewLead,
  onLeadClick,
}: LeadListProps) {
  const { t } = useTranslation();

  const statuses = [...new Set(leads.map((l) => l.status))];

  return (
    <div className="flex-1">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-foreground-muted)]" />
          <input
            type="text"
            placeholder={t('crm.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">{t('crm.allStatuses')}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {t(`crm.status.${status}`, { defaultValue: status })}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">{t('crm.allSources')}</option>
          {LEAD_SOURCES.map((source) => (
            <option key={source} value={source}>
              {t(`crm.source${source.charAt(0).toUpperCase() + source.slice(1).replace('_', '')}`, {
                defaultValue: source.replace('_', ' '),
              })}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`px-4 py-2.5 border rounded-xl transition-colors ${
            showAdvancedFilters
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)]'
          }`}
        >
          <Filter className="w-5 h-5 inline mr-1" />
          {t('crm.advancedFilters')}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mt-4 p-4 bg-[var(--color-secondary)] rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground-muted)] mb-1">
                {t('crm.dateFrom')}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground-muted)] mb-1">
                {t('crm.dateTo')}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground-muted)] mb-1">
                {t('crm.valueMin')}
              </label>
              <input
                type="number"
                placeholder="0"
                value={valueMin}
                onChange={(e) => setValueMin(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground-muted)] mb-1">
                {t('crm.valueMax')}
              </label>
              <input
                type="number"
                placeholder="1000"
                value={valueMax}
                onChange={(e) => setValueMax(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setValueMin('');
                setValueMax('');
              }}
              className="text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
            >
              {t('crm.clearFilters')}
            </button>
          </div>
        </div>
      )}

      {/* Leads Grid */}
      {leadsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-secondary)] rounded-xl">
          <Users className="w-12 h-12 text-[var(--color-foreground-subtle)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-2">{t('crm.noLeads')}</h3>
          <p className="text-[var(--color-foreground-muted)] mb-4">
            {searchQuery || statusFilter ? t('crm.noResults') : t('crm.addFirst')}
          </p>
          <button
            onClick={onNewLead}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            {t('crm.addLead')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default LeadList;
