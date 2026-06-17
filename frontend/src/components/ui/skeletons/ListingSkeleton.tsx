/**
 * @fileoverview ListingSkeleton — grid of card skeletons for listing pages
 * @description Renders a responsive grid with `count` skeleton cards of the
 *              specified variant (tour | property). Matches the grid layout used
 *              in ToursPage and PropertiesPage.
 * @module components/ui/skeletons/ListingSkeleton
 *
 * Renderiza un grid responsivo con `count` tarjetas esqueleto del variant
 * especificado (tour | property). Replica el grid de ToursPage y PropertiesPage.
 */

import { TourCardSkeleton } from './TourCardSkeleton';
import { PropertyCardSkeleton } from './PropertyCardSkeleton';
import { cn } from '@/lib/utils';

interface ListingSkeletonProps {
  /** Card variant to render / Variante de tarjeta a renderizar */
  variant: 'tour' | 'property';
  /** Number of skeleton cards to show (default: 4) / Cantidad de tarjetas esqueleto */
  count?: number;
  /** Additional CSS classes for the grid container / Clases CSS adicionales para el grid */
  className?: string;
}

/**
 * Grid of skeleton cards for listing loading states
 * Grid de tarjetas esqueleto para estados de carga de listados
 */
export function ListingSkeleton({ variant, count = 4, className }: ListingSkeletonProps) {
  const CardSkeleton = variant === 'tour' ? TourCardSkeleton : PropertyCardSkeleton;

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
