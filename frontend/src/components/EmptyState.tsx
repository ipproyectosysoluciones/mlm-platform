/**
 * @fileoverview EmptyState Component - No data placeholder
 * @description Component displayed when there's no data to show
 * @module components/EmptyState
 */

import { useTranslation } from 'react-i18next';
import { Package, RefreshCw, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '@/components/ui/button';

/**
 * EmptyState props
 */
interface EmptyStateProps {
  type?: 'default' | 'search' | 'error';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * EmptyState component - Displays placeholder when no data
 * Componente de estado vacío - Muestra marcador de posición cuando no hay datos
 */
export function EmptyState({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const { t } = useTranslation();

  // Default content based on type
  const defaultContent = {
    default: {
      icon: Package,
      defaultTitle: t('products.empty'),
      defaultDescription: t('products.emptyFiltered'),
    },
    search: {
      icon: Search,
      defaultTitle: t('tree.search.noResults'),
      defaultDescription: '',
    },
    error: {
      icon: RefreshCw,
      defaultTitle: t('products.error'),
      defaultDescription: t('products.retry'),
    },
  };

  const content = defaultContent[type];
  const Icon = content.icon;
  const displayTitle = title || content.defaultTitle;
  const displayDescription = description || content.defaultDescription;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full bg-slate-700',
          type === 'error' ? 'text-red-400' : 'text-slate-400'
        )}
      >
        <Icon className="h-8 w-8" />
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-white">{displayTitle}</h3>
        {displayDescription && (
          <p className="max-w-sm text-sm text-slate-400">{displayDescription}</p>
        )}
      </div>

      {/* Action Button — shadcn Button (D1: primary → default variant) */}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
