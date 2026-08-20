/**
 * @fileoverview AdminCrudTable<T> — Generic admin CRUD table with pagination,
 * filters, loading/error/empty states, and action slots.
 *
 * Controlled component: data, pagination, and filter state live in the page.
 *
 * @module components/admin/AdminCrudTable
 */
import type { ReactNode } from 'react';
import { RefreshCw, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ColumnDef, FilterDef } from './AdminCrudTableTypes';

export interface AdminCrudTableProps<T extends { id: string }> {
  /** Header */
  title: string;
  description?: string;
  icon: ReactNode;
  accentColor: 'blue' | 'teal' | 'violet';

  /** Columns definition */
  columns: ColumnDef<T>[];

  /** Filters */
  filters?: FilterDef[];

  /** Data */
  data: T[];
  loading: boolean;
  error: string | null;

  /** Pagination */
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;

  /** Actions */
  onRefresh: () => void;
  onCreate?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string, label: string) => void;
  onToggleStatus?: (item: T) => void;

  /** Optional custom actions column render (overrides default edit/delete buttons) */
  renderActions?: (item: T) => ReactNode;

  /** Optional function to extract a human-readable label for delete confirmation */
  getDeleteLabel?: (item: T) => string;

  /** Entity labels for i18n */
  entityLabel: string; // e.g. "propiedad"
  entityLabelPlural: string; // e.g. "propiedades"
}

/**
 * Accent color map for header icon and create button.
 */
const accentMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  teal: 'bg-teal-100 text-teal-600',
  violet: 'bg-violet-100 text-violet-600',
};

const accentButtonMap: Record<string, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  teal: 'bg-teal-600 hover:bg-teal-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
};

/**
 * Generic admin CRUD table.
 *
 * Renders a full CRUD interface: header with icon/title/actions, filter bar,
 * data table with loading/error/empty states, pagination, and optional
 * create/edit/delete/toggle actions.
 *
 * @example
 * ```tsx
 * <AdminCrudTable
 *   title="Propiedades"
 *   description="Gestión de propiedades inmobiliarias"
 *   icon={<Building2 className="w-5 h-5" />}
 *   accentColor="blue"
 *   columns={propertyColumns}
 *   filters={propertyFilters}
 *   data={properties}
 *   loading={loading}
 *   error={error}
 *   page={page}
 *   totalPages={totalPages}
 *   total={total}
 *   onPageChange={setPage}
 *   onRefresh={loadProperties}
 *   onCreate={() => setShowForm(true)}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onToggleStatus={handleToggleStatus}
 *   entityLabel="propiedad"
 *   entityLabelPlural="propiedades"
 * />
 * ```
 *
 * @ready tenantId — add tenant filter to FilterDef when multi-tenant
 */
export default function AdminCrudTable<T extends { id: string }>({
  title,
  description,
  icon,
  accentColor,
  columns,
  filters,
  data,
  loading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  renderActions,
  getDeleteLabel,
  entityLabel,
  entityLabelPlural,
}: AdminCrudTableProps<T>) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              accentMap[accentColor]
            )}
          >
            {icon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Recargar"
          >
            <RefreshCw className={cn('w-5 h-5 text-slate-600', loading && 'animate-spin')} />
          </button>
          {onCreate && (
            <button
              onClick={onCreate}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium',
                accentButtonMap[accentColor]
              )}
            >
              <Plus className="w-4 h-4" />
              Nueva {entityLabel}
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <X className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={onRefresh} className="ml-auto text-sm font-medium hover:underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Filters */}
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-slate-200">
          {filters.map((filter) =>
            filter.type === 'select' ? (
              <select
                key={filter.key}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className={cn(
                  'px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  filter.className
                )}
              >
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                key={filter.key}
                type="text"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                placeholder={filter.placeholder}
                className={cn(
                  'px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  filter.className
                )}
              />
            )
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-12 h-12 mb-3 opacity-30">{icon}</div>
            <p className="font-medium">No hay {entityLabelPlural}</p>
            <p className="text-sm">Cambiá los filtros o creá {'una nueva'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 bg-slate-50">
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className={cn(
                        'font-semibold text-slate-600',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                  {(onEdit || onDelete || renderActions) && (
                    <TableHead className="text-center font-semibold text-slate-600">
                      Acciones
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {data.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className
                        )}
                      >
                        {col.render(item)}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || renderActions) && (
                      <TableCell className="text-center">
                        {renderActions ? (
                          renderActions(item)
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(item)}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() =>
                                  onDelete(item.id, getDeleteLabel ? getDeleteLabel(item) : '')
                                }
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">
              {total} {total === 1 ? entityLabel : entityLabelPlural} — página {page} de{' '}
              {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
