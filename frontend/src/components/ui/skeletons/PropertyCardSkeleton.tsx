/**
 * @fileoverview PropertyCardSkeleton — loading placeholder mirroring PropertyCard layout
 * @description Renders Skeleton primitives matching the PropertyCard structure:
 *              h-52 image container, title, location, specs row (beds + baths + area), price + CTA
 * @module components/ui/skeletons/PropertyCardSkeleton
 *
 * Esqueleto de carga que replica la estructura de PropertyCard:
 * imagen h-52, título, ubicación, fila de specs (habitaciones + baños + m²), precio + CTA
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PropertyCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton placeholder that mirrors the PropertyCard layout
 * Placeholder esqueleto que replica el layout de PropertyCard
 */
export function PropertyCardSkeleton({ className }: PropertyCardSkeletonProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Image skeleton — h-52 matching PropertyCard / Esqueleto de imagen */}
      <Skeleton data-testid="skeleton-image" className="h-52 w-full rounded-none" />

      {/* Content skeleton / Esqueleto de contenido */}
      <div className="p-4">
        {/* Title / Título */}
        <Skeleton data-testid="skeleton-title" className="mb-1 h-5 w-3/4" />

        {/* Location / Ubicación */}
        <Skeleton data-testid="skeleton-location" className="mb-3 h-4 w-2/3" />

        {/* Specs row (beds + baths + area) / Fila de specs */}
        <div data-testid="skeleton-specs" className="mb-4 flex items-center gap-4">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-14" />
        </div>

        {/* Price + CTA / Precio + CTA */}
        <div data-testid="skeleton-price" className="flex items-center justify-between gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </article>
  );
}
