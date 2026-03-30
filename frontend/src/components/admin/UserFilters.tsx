/**
 * UserFilters - Admin user search and filter controls
 * Controles de búsqueda y filtro para usuarios admin
 *
 * @module components/admin/UserFilters
 */
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

interface UserFiltersProps {
  search: string;
  filter: 'all' | 'active' | 'inactive';
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  onRefresh: () => void;
}

export default function UserFilters({
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onRefresh,
}: UserFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-4 items-center">
      <input
        type="text"
        placeholder={t('admin.searchByEmail')}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />
      <select
        value={filter}
        onChange={(e) => onFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      >
        <option value="all">{t('admin.all')}</option>
        <option value="active">{t('admin.active')}</option>
        <option value="inactive">{t('admin.inactive')}</option>
      </select>
      <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-lg">
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
}
