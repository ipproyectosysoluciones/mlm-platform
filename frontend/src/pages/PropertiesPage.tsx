/**
 * @fileoverview PropertiesPage - Real estate property listings page
 * @description Displays paginated list of properties with filters by type, city and price range
 *               Muestra listado paginado de propiedades con filtros por tipo, ciudad y rango de precio
 * @module pages/PropertiesPage
 * @author Nexo Real Development Team
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Search,
  SlidersHorizontal,
  Eye,
  CalendarCheck,
} from 'lucide-react';
import { propertyService } from '../services/propertyService';
import type { Property, PropertyListParams, PropertyType } from '../services/propertyService';
import { cn } from '../lib/utils';
import { APP_URL } from '../config/app.config';
import { Button } from '@/components/ui/button';

// ============================================
// Helpers / Utilidades
// ============================================

/**
 * Generates a deterministic social proof view count for a property card.
 * Uses the property ID to produce a stable number between 4 and 31.
 *
 * Genera un contador de vistas social proof determinístico para una card de propiedad.
 * Usa el ID de la propiedad para producir un número estable entre 4 y 31.
 */
function getSocialProofViews(id: string): number {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 4 + (hash % 28);
}

// ============================================
// Constants / Constantes
// ============================================

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  rental: 'Alquiler',
  sale: 'Venta',
  management: 'Administración',
};

const PROPERTY_TYPE_COLORS: Record<PropertyType, string> = {
  rental: 'bg-blue-100 text-blue-700',
  sale: 'bg-emerald-100 text-emerald-700',
  management: 'bg-amber-100 text-amber-700',
};

// ============================================
// Sub-components / Sub-componentes
// ============================================

interface PropertyCardProps {
  property: Property;
  onClick: (id: string) => void;
}

function PropertyCard({ property, onClick }: PropertyCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mainImage = property.images?.[0];

  return (
    <article
      onClick={() => onClick(property.id)}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-52 bg-slate-100 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <MapPin className="w-12 h-12" />
          </div>
        )}
        <span
          className={cn(
            'absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold',
            PROPERTY_TYPE_COLORS[property.type]
          )}
        >
          {PROPERTY_TYPE_LABELS[property.type]}
        </span>

        {/* Social proof badge / Badge de prueba social */}
        <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
          <Eye className="w-3 h-3" />
          {t('catalog.viewedToday', { count: getSocialProofViews(property.id) })}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 line-clamp-1 mb-1">{property.title}</h3>
        <p className="flex items-center gap-1 text-sm text-slate-500 mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">
            {property.address}, {property.city}
          </span>
        </p>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-4 h-4" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {property.bathrooms}
            </span>
          )}
          {property.areaM2 != null && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-4 h-4" />
              {property.areaM2} m²
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-emerald-600">
            {property.currency}{' '}
            {Number(property.price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            {property.type === 'rental' && (
              <span className="text-sm font-normal text-slate-400"> / mes</span>
            )}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reservations/new?propertyId=${property.id}`);
            }}
            className="shrink-0"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            {t('catalog.bookNow')}
          </Button>
        </div>
      </div>
    </article>
  );
}

// ============================================
// Main Page / Página principal
// ============================================

/**
 * PropertiesPage component
 * Componente de página de propiedades
 */
export default function PropertiesPage() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters / Filtros
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<PropertyType | ''>('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);

  const fetchProperties = async (params: PropertyListParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await propertyService.getProperties(params);
      setProperties(Array.isArray(result?.data) ? result.data : []);
      setPagination(result?.pagination ?? null);
    } catch {
      setError('No se pudieron cargar las propiedades. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties({
      page,
      limit: 12,
      search: search || undefined,
      type: selectedType || undefined,
      city: city || undefined,
    });
  }, [page, search, selectedType, city]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedType('');
    setCity('');
    setPage(1);
  };

  const hasActiveFilters = search || selectedType || city;

  // ── SEO helpers ────────────────────────────────────────────────────────────

  /**
   * Dynamic meta description based on active filters.
   * Meta description dinámica basada en filtros activos.
   */
  const seoDescription = (() => {
    const parts: string[] = ['Explorá propiedades en venta y alquiler en Nexo Real.'];
    if (selectedType)
      parts.push(`Filtrado por: ${PROPERTY_TYPE_LABELS[selectedType as PropertyType]}.`);
    if (city) parts.push(`Ciudad: ${city}.`);
    if (pagination) parts.push(`${pagination.total} propiedades disponibles.`);
    return parts.join(' ');
  })();

  /**
   * Dynamic page title.
   * Título dinámico de la página.
   */
  const seoTitle = city
    ? `Propiedades en ${city} | Nexo Real`
    : selectedType
      ? `Propiedades en ${PROPERTY_TYPE_LABELS[selectedType as PropertyType]} | Nexo Real`
      : 'Propiedades | Nexo Real';

  return (
    <>
      {/* SEO meta tags / Meta tags para SEO */}
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`${APP_URL}/properties`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={`${APP_URL}/properties`} />
        <meta property="og:site_name" content="Nexo Real" />
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Propiedades</h1>
            <p className="text-slate-500">
              {pagination
                ? `${pagination.total} propiedades disponibles`
                : 'Explorá nuestro catálogo'}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Filters bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por título o dirección..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Type filter */}
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as PropertyType | '');
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 bg-white"
              >
                <option value="">Todos los tipos</option>
                {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
                  <option key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>

              {/* City filter */}
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                placeholder="Ciudad..."
                className="w-36 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
              />

              <Button type="submit">
                <SlidersHorizontal className="w-4 h-4" />
                Filtrar
              </Button>

              {hasActiveFilters && (
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Limpiar
                </Button>
              )}
            </form>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600 mb-6">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  <div className="h-52 bg-slate-200 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse" />
                    <div className="h-5 bg-slate-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && properties.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No se encontraron propiedades</p>
              <p className="text-sm mt-1">Probá ajustando los filtros</p>
            </div>
          )}

          {/* Property grid */}
          {!isLoading && properties.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onClick={(id) => navigate(`/properties/${id}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="px-4 py-2 text-sm text-slate-600">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
