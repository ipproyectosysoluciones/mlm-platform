/**
 * @fileoverview ToursPage - Tourism packages listing page
 * @description Displays paginated list of tour packages with filters by category, destination and price
 *               Muestra listado paginado de paquetes de tours con filtros por categoría, destino y precio
 * @module pages/ToursPage
 * @author Nexo Real Development Team
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Clock, Users, Search, SlidersHorizontal, Compass, Eye } from 'lucide-react';
import { tourService } from '../services/tourService';
import type { TourPackage, TourListParams, TourCategory } from '../services/tourService';
import { cn } from '../lib/utils';
import { APP_URL } from '../config/app.config';

// ============================================
// Helpers / Utilidades
// ============================================

/**
 * Generates a deterministic social proof view count for a tour card.
 * Uses the tour ID to produce a stable number between 3 and 26.
 *
 * Genera un contador de vistas social proof determinístico para una card de tour.
 * Usa el ID del tour para producir un número estable entre 3 y 26.
 */
function getSocialProofViews(id: string): number {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 3 + (hash % 24);
}

// ============================================
// Constants / Constantes
// ============================================

const CATEGORY_LABELS: Record<TourCategory, string> = {
  adventure: 'Aventura',
  cultural: 'Cultural',
  relaxation: 'Relax',
  gastronomic: 'Gastronómico',
  ecotourism: 'Ecoturismo',
  luxury: 'Lujo',
};

const CATEGORY_COLORS: Record<TourCategory, string> = {
  adventure: 'bg-orange-100 text-orange-700',
  cultural: 'bg-purple-100 text-purple-700',
  relaxation: 'bg-sky-100 text-sky-700',
  gastronomic: 'bg-rose-100 text-rose-700',
  ecotourism: 'bg-green-100 text-green-700',
  luxury: 'bg-amber-100 text-amber-700',
};

// ============================================
// Sub-components / Sub-componentes
// ============================================

interface TourCardProps {
  tour: TourPackage;
  onClick: (id: string) => void;
}

function TourCard({ tour, onClick }: TourCardProps) {
  const mainImage = tour.images?.[0];

  return (
    <article
      onClick={() => onClick(tour.id)}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-52 bg-slate-100 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Compass className="w-12 h-12" />
          </div>
        )}
        <span
          className={cn(
            'absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold',
            CATEGORY_COLORS[tour.category]
          )}
        >
          {CATEGORY_LABELS[tour.category]}
        </span>

        {/* Social proof badge / Badge de prueba social */}
        <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
          <Eye className="w-3 h-3" />
          {getSocialProofViews(tour.id)} personas vieron esto hoy
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 line-clamp-1 mb-1">{tour.title}</h3>
        <p className="flex items-center gap-1 text-sm text-slate-500 mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">{tour.destination}</span>
        </p>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {tour.duration} {tour.duration === 1 ? 'día' : 'días'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Hasta {tour.maxGuests}
          </span>
        </div>

        {/* Price */}
        <p className="text-lg font-bold text-emerald-600">
          {tour.currency} {tour.price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          <span className="text-sm font-normal text-slate-400"> / persona</span>
        </p>
      </div>
    </article>
  );
}

// ============================================
// Main Page / Página principal
// ============================================

/**
 * ToursPage component
 * Componente de página de tours
 */
export default function ToursPage() {
  const navigate = useNavigate();

  const [tours, setTours] = useState<TourPackage[]>([]);
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
  const [selectedCategory, setSelectedCategory] = useState<TourCategory | ''>('');
  const [destination, setDestination] = useState('');
  const [page, setPage] = useState(1);

  const fetchTours = async (params: TourListParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await tourService.getTours(params);
      setTours(result.data);
      setPagination(result.pagination);
    } catch {
      setError('No se pudieron cargar los tours. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTours({
      page,
      limit: 12,
      search: search || undefined,
      category: selectedCategory || undefined,
      destination: destination || undefined,
    });
  }, [page, search, selectedCategory, destination]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setDestination('');
    setPage(1);
  };

  const hasActiveFilters = search || selectedCategory || destination;

  // ── SEO helpers ────────────────────────────────────────────────────────────

  /**
   * Dynamic meta description based on active filters.
   * Meta description dinámica basada en filtros activos.
   */
  const seoDescription = (() => {
    const parts: string[] = ['Descubrí paquetes de turismo y experiencias únicas con Nexo Real.'];
    if (selectedCategory)
      parts.push(`Categoría: ${CATEGORY_LABELS[selectedCategory as TourCategory]}.`);
    if (destination) parts.push(`Destino: ${destination}.`);
    if (pagination) parts.push(`${pagination.total} experiencias disponibles.`);
    return parts.join(' ');
  })();

  /**
   * Dynamic page title.
   * Título dinámico de la página.
   */
  const seoTitle = destination
    ? `Tours en ${destination} | Nexo Real`
    : selectedCategory
      ? `Tours de ${CATEGORY_LABELS[selectedCategory as TourCategory]} | Nexo Real`
      : 'Paquetes de Turismo | Nexo Real';

  return (
    <>
      {/* SEO meta tags / Meta tags para SEO */}
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`${APP_URL}/tours`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={`${APP_URL}/tours`} />
        <meta property="og:site_name" content="Nexo Real" />
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Paquetes de Turismo</h1>
            <p className="text-slate-500">
              {pagination
                ? `${pagination.total} experiencias disponibles`
                : 'Descubrí destinos increíbles'}
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
                  placeholder="Buscar tours..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as TourCategory | '');
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 bg-white"
              >
                <option value="">Todas las categorías</option>
                {(Object.keys(CATEGORY_LABELS) as TourCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>

              {/* Destination filter */}
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setPage(1);
                }}
                placeholder="Destino..."
                className="w-36 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
              />

              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtrar
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Limpiar
                </button>
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
          {!isLoading && !error && tours.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <Compass className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No se encontraron tours</p>
              <p className="text-sm mt-1">Probá ajustando los filtros</p>
            </div>
          )}

          {/* Tours grid */}
          {!isLoading && tours.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} onClick={(id) => navigate(`/tours/${id}`)} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-600">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
