/**
 * @fileoverview PropertyDetailPage - Real estate property detail page
 * @description Shows full property info, image gallery, specs and booking CTA.
 *              Includes SEO meta tags (title, description, Open Graph) and
 *              JSON-LD RealEstateListing schema markup for search engine indexing.
 *
 *              Muestra info completa de propiedad, galería de imágenes, specs y CTA de reserva.
 *              Incluye meta tags SEO (title, description, Open Graph) y schema markup
 *              JSON-LD RealEstateListing para indexación en motores de búsqueda.
 *
 * @module pages/PropertyDetailPage
 * @author Nexo Real Development Team
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { propertyService } from '../services/propertyService';
import type { Property, PropertyType } from '../services/propertyService';
import { useReservationStore } from '../stores/reservationStore';
import { cn } from '../lib/utils';
import { APP_URL, APP_OG_DEFAULT_IMAGE } from '../config/app.config';

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

interface ImageGalleryProps {
  images: string[];
  title: string;
}

function ImageGallery({ images, title }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="h-80 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300">
        <MapPin className="w-16 h-16" />
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                onClick={() => setCurrent(i)}
                className={cn(
                  'w-2 h-2 rounded-full p-0 min-w-0 h-auto',
                  i === current ? 'bg-white' : 'bg-white/50'
                )}
                aria-label={`Ir a imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 px-1">
          {images.map((img, i) => (
            <Button
              key={i}
              variant="ghost"
              size="icon"
              onClick={() => setCurrent(i)}
              className={cn(
                'w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 p-0',
                i === current
                  ? 'border-emerald-500'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img src={img} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Loading skeleton / Skeleton de carga
// ============================================

function PropertyDetailSkeleton() {
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
        <div className="h-48 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================
// Main Page / Página principal
// ============================================

/**
 * PropertyDetailPage component
 * Componente de página de detalle de propiedad
 */
export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const startPropertyReservation = useReservationStore((s) => s.startPropertyReservation);

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    propertyService
      .getProperty(id)
      .then((data) => {
        if (!cancelled) {
          setProperty(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo cargar la propiedad. Verificá que el ID sea correcto.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) return <PropertyDetailSkeleton />;

  if (error || !property) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 mb-4">{error ?? 'Propiedad no encontrada'}</p>
        <Button
          variant="ghost"
          onClick={() => navigate('/properties')}
          className="text-emerald-600 hover:underline text-sm"
        >
          Volver al listado
        </Button>
      </div>
    );
  }

  const handleReserve = () => {
    startPropertyReservation(property);
    navigate('/reservations/new');
  };

  // ── SEO helpers ────────────────────────────────────────────────────────────

  /**
   * Dynamic page title for SEO: "Property title | City | Nexo Real"
   * Título dinámico para SEO: "Título propiedad | Ciudad | Nexo Real"
   */
  const seoTitle = `${property.title} | ${property.city} | Nexo Real`;

  /**
   * Meta description combining type, price, city and bedrooms.
   * Meta description combinando tipo, precio, ciudad y habitaciones.
   */
  const seoDescription = [
    PROPERTY_TYPE_LABELS[property.type],
    'en',
    property.city,
    property.bedrooms ? `· ${property.bedrooms} hab.` : '',
    property.bathrooms ? `· ${property.bathrooms} baños` : '',
    property.areaM2 ? `· ${property.areaM2} m²` : '',
    `· ${property.currency} ${Number(property.price).toLocaleString('es-AR')}`,
    property.description ? `— ${property.description.slice(0, 120)}` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  /** Primary OG image (first property image or fallback) */
  const ogImage = property.images?.[0] ?? APP_OG_DEFAULT_IMAGE;

  /** Canonical URL for this property */
  const canonicalUrl = `${APP_URL}/propiedades/${property.id}`;

  /**
   * JSON-LD RealEstateListing schema markup.
   * Provides structured data for Google rich results.
   * Schema markup JSON-LD RealEstateListing.
   * Proporciona datos estructurados para resultados enriquecidos de Google.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description ?? seoDescription,
    url: canonicalUrl,
    image: property.images?.length ? property.images : [ogImage],
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: property.currency,
      availability:
        property.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressCountry: property.country ?? 'CO',
    },
    ...(property.bedrooms != null && { numberOfRooms: property.bedrooms }),
    ...(property.areaM2 != null && {
      floorSize: { '@type': 'QuantitativeValue', value: property.areaM2, unitCode: 'MTK' },
    }),
  };

  return (
    <>
      {/* SEO: meta tags + JSON-LD / Meta tags + JSON-LD para SEO */}
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Nexo Real" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImage} />
        {/* JSON-LD structured data */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-slate-50 pb-12">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/properties')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a propiedades
          </Button>

          {/* Gallery */}
          <ImageGallery images={property.images} title={property.title} />

          {/* Content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left: Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title + type */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-2xl font-bold text-slate-800">{property.title}</h1>
                  <span
                    className={cn(
                      'shrink-0 px-3 py-1 rounded-full text-sm font-semibold',
                      PROPERTY_TYPE_COLORS[property.type]
                    )}
                  >
                    {PROPERTY_TYPE_LABELS[property.type]}
                  </span>
                </div>
                <p className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {property.address}, {property.city}, {property.country}
                </p>
              </div>

              {/* Specs */}
              <div className="flex flex-wrap gap-6">
                {property.bedrooms != null && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <BedDouble className="w-5 h-5 text-emerald-500" />
                    <span>
                      <span className="font-semibold">{property.bedrooms}</span>{' '}
                      {property.bedrooms === 1 ? 'dormitorio' : 'dormitorios'}
                    </span>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Bath className="w-5 h-5 text-emerald-500" />
                    <span>
                      <span className="font-semibold">{property.bathrooms}</span>{' '}
                      {property.bathrooms === 1 ? 'baño' : 'baños'}
                    </span>
                  </div>
                )}
                {property.areaM2 != null && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Maximize2 className="w-5 h-5 text-emerald-500" />
                    <span>
                      <span className="font-semibold">{property.areaM2}</span> m²
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-2">Descripción</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 mb-3">Comodidades</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 text-slate-600 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Booking card */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <p className="text-3xl font-bold text-emerald-600 mb-1">
                  {property.currency}{' '}
                  {Number(property.price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
                {property.type === 'rental' && (
                  <p className="text-sm text-slate-400 mb-4">por mes</p>
                )}

                <Button
                  onClick={handleReserve}
                  className="w-full flex items-center justify-center gap-2 py-3"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {t('cta.securePayment')}
                </Button>

                <p className="text-xs text-slate-400 text-center mt-3">
                  Sin compromiso — te contactamos a la brevedad
                </p>
              </div>
            </div>
          </div>

          {/* Spacer for mobile sticky CTA / Espacio para CTA fijo en móvil */}
          <div className="h-20 lg:h-0" />
        </div>
      </div>

      {/* Mobile sticky CTA bar / Barra CTA fija en móvil */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 lg:hidden"
        data-testid="mobile-sticky-cta"
      >
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <div>
            <p className="text-lg font-bold text-emerald-600">
              {property.currency}{' '}
              {Number(property.price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            </p>
            {property.type === 'rental' && <p className="text-xs text-slate-400">por mes</p>}
          </div>
          <Button onClick={handleReserve} className="shrink-0">
            <Lock className="h-4 w-4 mr-2" />
            {t('cta.securePayment')}
          </Button>
        </div>
      </div>
    </>
  );
}
