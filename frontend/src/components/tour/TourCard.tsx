/**
 * @fileoverview TourCard - Card component for tour package listings
 * @description Displays a tour package summary in grid or list layout with destination, duration, and price.
 *               Muestra un resumen de paquete de tour en layout grid o lista con destino, duración y precio.
 * @module components/tour/TourCard
 * @author Nexo Real Development Team
 */

import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Compass } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TourPackage, TourCategory } from '../../services/tourService';

// ============================================
// Types / Tipos
// ============================================

/**
 * Display variant for the card layout
 * Variante de display para el layout de la card
 */
export type CardVariant = 'grid' | 'list';

interface TourCardProps {
  /** Tour package data to display / Datos del paquete de tour a mostrar */
  tour: TourPackage;
  /** Layout variant: 'grid' (default) or 'list' / Variante de layout: 'grid' (default) o 'list' */
  variant?: CardVariant;
  /** Additional CSS classes / Clases CSS adicionales */
  className?: string;
}

// ============================================
// Helpers / Helpers
// ============================================

/**
 * Maps TourCategory to a display badge color.
 * Mapea TourCategory a un color de badge para mostrar.
 */
const CATEGORY_BADGE: Record<TourCategory, { label: string; classes: string }> = {
  adventure: {
    label: 'Aventura',
    classes: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  cultural: {
    label: 'Cultural',
    classes: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  relaxation: {
    label: 'Relajación',
    classes: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  gastronomic: {
    label: 'Gastronómico',
    classes: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  ecotourism: {
    label: 'Ecoturismo',
    classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  luxury: {
    label: 'Lujo',
    classes: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
};

/**
 * Formats a price with its currency.
 * Formatea un precio con su moneda.
 */
function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

// ============================================
// Component / Componente
// ============================================

/**
 * TourCard renders a tour package in grid or list layout.
 * TourCard renderiza un paquete de tour en layout grid o lista.
 *
 * @example
 * <TourCard tour={tour} variant="grid" />
 */
export function TourCard({ tour, variant = 'grid', className }: TourCardProps) {
  const badge = CATEGORY_BADGE[tour.category];
  const coverImage = tour.images[0] ?? null;

  if (variant === 'list') {
    return (
      <Link
        to={`/tours/${tour.id}`}
        className={cn(
          'group flex gap-4 rounded-2xl bg-slate-800/50 border border-slate-700/50',
          'hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all duration-300',
          className
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-40 shrink-0 overflow-hidden rounded-l-2xl">
          {coverImage ? (
            <img
              src={coverImage}
              alt={tour.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-700/50">
              <Compass className="w-8 h-8 text-slate-500" />
            </div>
          )}
          <span
            className={cn(
              'absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full border',
              badge.classes
            )}
          >
            {badge.label}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between py-4 pr-4 gap-2 min-w-0">
          <div>
            <h3 className="font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
              {tour.title}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-slate-400 text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tour.destination}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {tour.duration} días
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Máx. {tour.maxGuests}
            </span>
          </div>
          <p className="text-emerald-400 font-bold text-lg">
            {formatPrice(tour.price, tour.currency)}
            <span className="text-slate-500 text-sm font-normal"> / persona</span>
          </p>
        </div>
      </Link>
    );
  }

  // Default: grid variant
  return (
    <Link
      to={`/tours/${tour.id}`}
      className={cn(
        'group flex flex-col rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden',
        'hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-700/50">
        {coverImage ? (
          <img
            src={coverImage}
            alt={tour.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Compass className="w-10 h-10 text-slate-500" />
          </div>
        )}
        <span
          className={cn(
            'absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full border',
            badge.classes
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {tour.title}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-slate-400 text-sm">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{tour.destination}</span>
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {tour.duration} días
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Máx. {tour.maxGuests}
          </span>
        </div>

        {/* Price */}
        <p className="text-emerald-400 font-bold text-xl">
          {formatPrice(tour.price, tour.currency)}
          <span className="text-slate-500 text-sm font-normal"> / persona</span>
        </p>
      </div>
    </Link>
  );
}

export default TourCard;
