/**
 * @fileoverview EmptyState Component - No data placeholder
 * @description Component displayed when there's no data to show.
 *              Supports multiple types with dedicated icons and i18n defaults.
 *              Can render an actionHref (Link) or onAction (callback) button.
 * @module components/EmptyState
 *
 * Componente de estado vacío — Muestra un placeholder cuando no hay datos.
 * Soporta múltiples tipos con íconos dedicados y textos i18n por defecto.
 * Puede renderizar un link (actionHref) o un botón con callback (onAction).
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CalendarDays, Package, Receipt, RefreshCw, Search, ShoppingCart } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '@/components/ui/button';

/**
 * Supported empty state types
 * Tipos de estado vacío soportados
 */
type EmptyStateType = 'default' | 'search' | 'error' | 'cart' | 'reservation' | 'order';

/**
 * EmptyState props
 */
interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  /** Callback for button click — renders a <Button> / Callback para click — renderiza un <Button> */
  onAction?: () => void;
  /** Navigation href — renders a <Link> inside <Button asChild> / Href de navegación — renderiza un <Link> */
  actionHref?: string;
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
  actionHref,
  className,
}: EmptyStateProps) {
  const { t } = useTranslation();

  // Default content based on type / Contenido por defecto según el tipo
  const defaultContent: Record<
    EmptyStateType,
    { icon: typeof Package; defaultTitle: string; defaultDescription: string }
  > = {
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
    cart: {
      icon: ShoppingCart,
      defaultTitle: t('emptyStates.cart.title'),
      defaultDescription: t('emptyStates.cart.description'),
    },
    reservation: {
      icon: CalendarDays,
      defaultTitle: t('emptyStates.reservation.title'),
      defaultDescription: t('emptyStates.reservation.description'),
    },
    order: {
      icon: Receipt,
      defaultTitle: t('emptyStates.order.title'),
      defaultDescription: t('emptyStates.order.description'),
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
      {/* Icon / Ícono */}
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full bg-slate-700',
          type === 'error' ? 'text-red-400' : 'text-slate-400'
        )}
      >
        <Icon className="h-8 w-8" />
      </div>

      {/* Text Content / Contenido de texto */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-white">{displayTitle}</h3>
        {displayDescription && (
          <p className="max-w-sm text-sm text-slate-400">{displayDescription}</p>
        )}
      </div>

      {/* Action: Link mode (actionHref) takes precedence over callback mode (onAction) */}
      {actionLabel && actionHref && (
        <Button asChild className="mt-2">
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && !actionHref && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
