/**
 * @fileoverview AdminStatusBadge — Displays a status badge for admin CRUD entities.
 * Supports both read-only (span) and toggle (button) modes.
 *
 * @module components/admin/AdminStatusBadge
 */
import { cn } from '@/lib/utils';
import type { StatusConfig } from './AdminCrudTableTypes';

export interface AdminStatusBadgeProps {
  value: string;
  config: StatusConfig[];
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Status badge that renders as a `<span>` by default, or as a `<button>`
 * when `onClick` is provided (toggleable statuses).
 *
 * Color classes come from the `config.color` field, which follows the
 * pattern `text-{color}-700 bg-{color}-100`.
 *
 * @example
 * ```tsx
 * <AdminStatusBadge
 *   value="available"
 *   config={PROPERTY_STATUSES}
 *   onClick={() => handleToggle(property)}
 *   disabled={property.status === 'rented' || property.status === 'sold'}
 * />
 * ```
 */
export default function AdminStatusBadge({
  value,
  config,
  onClick,
  disabled = false,
}: AdminStatusBadgeProps) {
  const statusConfig = config.find((s) => s.value === value);

  if (!statusConfig) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        {value}
      </span>
    );
  }

  const baseClasses =
    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium';
  const colorClasses = statusConfig.color;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cn(
          baseClasses,
          colorClasses,
          'transition-colors',
          disabled && 'opacity-40 cursor-not-allowed',
          !disabled && 'hover:opacity-80 cursor-pointer'
        )}
        title={disabled ? 'No disponible' : `Cambiar estado`}
      >
        {statusConfig.label}
      </button>
    );
  }

  return <span className={cn(baseClasses, colorClasses)}>{statusConfig.label}</span>;
}
