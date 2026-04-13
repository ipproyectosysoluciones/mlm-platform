/**
 * @fileoverview TourCardSkeleton — loading placeholder mirroring TourCard layout
 * @description Renders Skeleton primitives matching the TourCard structure:
 *              h-52 image container, title, location, specs row (duration + capacity), price + CTA
 * @module components/ui/skeletons/TourCardSkeleton
 *
 * Esqueleto de carga que replica la estructura de TourCard:
 * imagen h-52, título, ubicación, fila de specs (duración + capacidad), precio + CTA
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TourCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton placeholder that mirrors the TourCard layout
 * Placeholder esqueleto que replica el layout de TourCard
 */
export function TourCardSkeleton({ className }: TourCardSkeletonProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Image skeleton — h-52 matching TourCard / Esqueleto de imagen — h-52 como TourCard */}
      <Skeleton data-testid="skeleton-image" className="h-52 w-full rounded-none" />

      {/* Content skeleton / Esqueleto de contenido */}
      <div className="p-4">
        {/* Title / Título */}
        <Skeleton data-testid="skeleton-title" className="mb-1 h-5 w-3/4" />

        {/* Location / Ubicación */}
        <Skeleton data-testid="skeleton-location" className="mb-3 h-4 w-1/2" />

        {/* Specs row (duration + capacity) / Fila de specs */}
        <div data-testid="skeleton-specs" className="mb-4 flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Price + CTA / Precio + CTA */}
        <div data-testid="skeleton-price" className="flex items-center justify-between gap-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </article>
  );
}
