/**
 * @fileoverview TourDetailPage - Tourism package detail page
 * @description Shows full tour info, image gallery, availability calendar and booking CTA
 *               Muestra info completa del tour, galería, calendario de disponibilidad y CTA de reserva
 * @module pages/TourDetailPage
 * @author Nexo Real Development Team
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  X,
  Compass,
} from 'lucide-react';
import { tourService } from '../services/tourService';
import type { TourPackage, TourCategory, TourAvailability } from '../services/tourService';
import { useReservationStore } from '../stores/reservationStore';
import { cn } from '../lib/utils';

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

interface ImageGalleryProps {
  images: string[];
  title: string;
}

function ImageGallery({ images, title }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="h-80 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300">
        <Compass className="w-16 h-16" />
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-100">
      <img
        src={images[current]}
        alt={`${title} - imagen ${current + 1}`}
        className="w-full h-80 object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  i === current ? 'bg-white' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface AvailabilityPickerProps {
  availabilities: TourAvailability[];
  selected: TourAvailability | null;
  onSelect: (a: TourAvailability) => void;
}

function AvailabilityPicker({ availabilities, selected, onSelect }: AvailabilityPickerProps) {
  if (!availabilities || availabilities.length === 0) {
    return <p className="text-sm text-slate-400 italic">No hay fechas disponibles próximamente.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availabilities.map((a) => {
        const isFull = a.availableSpots === 0;
        const isSelected = selected?.id === a.id;
        const date = new Date(a.date);
        const label = date.toLocaleDateString('es-AR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });

        return (
          <button
            key={a.id}
            onClick={() => !isFull && onSelect(a)}
            disabled={isFull}
            className={cn(
              'px-3 py-2 rounded-lg text-sm border transition-all',
              isSelected && 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold',
              !isSelected && !isFull && 'border-slate-200 hover:border-emerald-300 text-slate-700',
              isFull && 'border-slate-100 text-slate-300 line-through cursor-not-allowed'
            )}
          >
            <span>{label}</span>
            <span className="block text-xs text-current opacity-70">
              {isFull ? 'Completo' : `${a.availableSpots} lugares`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// Loading skeleton / Skeleton de carga
// ============================================

function TourDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 w-24 bg-slate-200 rounded mb-6" />
      <div className="h-80 bg-slate-200 rounded-xl mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-24 bg-slate-200 rounded" />
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================
// Main Page / Página principal
// ============================================

/**
 * TourDetailPage component
 * Componente de página de detalle de tour
 */
export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const startTourReservation = useReservationStore((s) => s.startTourReservation);

  const [tour, setTour] = useState<TourPackage | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<TourAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    tourService
      .getTour(id)
      .then((data) => setTour(data))
      .catch(() => setError('No se pudo cargar el tour.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <TourDetailSkeleton />;

  if (error || !tour) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 mb-4">{error ?? 'Tour no encontrado'}</p>
        <button
          onClick={() => navigate('/tours')}
          className="text-emerald-600 hover:underline text-sm"
        >
          Volver al listado
        </button>
      </div>
    );
  }

  const handleReserve = () => {
    if (!selectedAvailability) return;
    startTourReservation(tour, selectedAvailability);
    navigate('/reservations/new');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/tours')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a tours
        </button>

        {/* Gallery */}
        <ImageGallery images={tour.images} title={tour.title} />

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title + category */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl font-bold text-slate-800">{tour.title}</h1>
                <span
                  className={cn(
                    'shrink-0 px-3 py-1 rounded-full text-sm font-semibold',
                    CATEGORY_COLORS[tour.category]
                  )}
                >
                  {CATEGORY_LABELS[tour.category]}
                </span>
              </div>
              <p className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-4 h-4" />
                {tour.destination}
              </p>
            </div>

            {/* Specs */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span>
                  <span className="font-semibold">{tour.duration}</span>{' '}
                  {tour.duration === 1 ? 'día' : 'días'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-5 h-5 text-emerald-500" />
                <span>
                  Hasta <span className="font-semibold">{tour.maxGuests}</span> personas
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Descripción</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {tour.description}
              </p>
            </div>

            {/* Includes / Excludes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {tour.includes && tour.includes.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-800 mb-2">Incluye</h2>
                  <ul className="space-y-1">
                    {tour.includes.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tour.excludes && tour.excludes.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-800 mb-2">No incluye</h2>
                  <ul className="space-y-1">
                    {tour.excludes.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                        <X className="w-4 h-4 text-red-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Availability */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Fechas disponibles</h2>
              <AvailabilityPicker
                availabilities={tour.availabilities ?? []}
                selected={selectedAvailability}
                onSelect={setSelectedAvailability}
              />
            </div>
          </div>

          {/* Right: Booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <p className="text-3xl font-bold text-emerald-600 mb-1">
                {tour.currency} {tour.price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-400 mb-4">por persona</p>

              {selectedAvailability ? (
                <div className="text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4 text-emerald-700">
                  <CalendarDays className="w-4 h-4 inline mr-1" />
                  {new Date(selectedAvailability.date).toLocaleDateString('es-AR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 mb-4">Seleccioná una fecha disponible</p>
              )}

              <button
                onClick={handleReserve}
                disabled={!selectedAvailability}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CalendarDays className="w-5 h-5" />
                Reservar este tour
              </button>

              <p className="text-xs text-slate-400 text-center mt-3">
                Sin costo hasta la confirmación
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
