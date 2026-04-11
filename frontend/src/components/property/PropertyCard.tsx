/**
 * @fileoverview PropertyCard - Card component for property listings
 * @description Displays a property summary in grid or list layout with price, location, and key specs.
 *               Muestra un resumen de propiedad en layout grid o lista con precio, ubicación y características.
 * @module components/property/PropertyCard
 * @author Nexo Real Development Team
 *
 * @todo [i18n debt] Status badges ('En Venta', 'En Alquiler', 'Administración') are hardcoded in Spanish.
 *       They should use i18n keys (e.g. t('property.badge.sale')) when the i18n layer is extended.
 *       Los badges de estado están hardcodeados en español y deben migrarse a claves i18n.
 */

import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Tag } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Property, PropertyType } from '../../services/propertyService';

// ============================================
// Types / Tipos
// ============================================

/**
 * Display variant for the card layout
 * Variante de display para el layout de la card
 */
export type CardVariant = 'grid' | 'list';

interface PropertyCardProps {
  /** Property data to display / Datos de la propiedad a mostrar */
  property: Property;
  /** Layout variant: 'grid' (default) or 'list' / Variante de layout: 'grid' (default) o 'list' */
  variant?: CardVariant;
  /** Additional CSS classes / Clases CSS adicionales */
  className?: string;
}

// ============================================
// Helpers / Helpers
// ============================================

/**
 * Maps PropertyType to a display badge color.
 * Mapea PropertyType a un color de badge para mostrar.
 */
const TYPE_BADGE: Record<PropertyType, { label: string; classes: string }> = {
  sale: { label: 'En Venta', classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  rental: {
    label: 'En Alquiler',
    classes: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  management: {
    label: 'Administración',
    classes: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
};

/**
 * Formats a price with its currency.
 * Formatea un precio con su moneda.
 */
function formatPrice(price: string, currency: string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price));
}

// ============================================
// Component / Componente
// ============================================

/**
 * PropertyCard renders a real estate property in grid or list layout.
 * PropertyCard renderiza una propiedad inmobiliaria en layout grid o lista.
 *
 * @example
 * <PropertyCard property={property} variant="grid" />
 */
export function PropertyCard({ property, variant = 'grid', className }: PropertyCardProps) {
  const badge = TYPE_BADGE[property.type];
  const coverImage = property.images[0] ?? null;

  if (variant === 'list') {
    return (
      <Link
        to={`/properties/${property.id}`}
        className={cn(
          'group flex gap-4 rounded-2xl bg-slate-800/50 border border-slate-700/50',
          'hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all duration-300',
          className
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-32 sm:w-40 min-h-[120px] shrink-0 overflow-hidden rounded-l-2xl">
          {coverImage ? (
            <img
              src={coverImage}
              alt={property.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-700/50">
              <Tag className="w-8 h-8 text-slate-500" />
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
              {property.title}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-slate-400 text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {property.city}, {property.country}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5" />
                {property.bathrooms}
              </span>
            )}
            {property.areaM2 != null && (
              <span className="flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5" />
                {property.areaM2} m²
              </span>
            )}
          </div>
          <p className="text-emerald-400 font-bold text-lg">
            {formatPrice(String(property.price), property.currency)}
          </p>
        </div>
      </Link>
    );
  }

  // Default: grid variant
  return (
    <Link
      to={`/properties/${property.id}`}
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
            alt={property.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tag className="w-10 h-10 text-slate-500" />
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
            {property.title}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-slate-400 text-sm">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {property.city}, {property.country}
            </span>
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-sm text-slate-400">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {property.bathrooms}
            </span>
          )}
          {property.areaM2 != null && (
            <span className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" />
              {property.areaM2} m²
            </span>
          )}
        </div>

        {/* Price */}
        <p className="text-emerald-400 font-bold text-xl">
          {formatPrice(String(property.price), property.currency)}
        </p>
      </div>
    </Link>
  );
}

export default PropertyCard;
