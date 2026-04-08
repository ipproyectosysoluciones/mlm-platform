/**
 * @fileoverview NexoRealLanding - Main landing page for Nexo Real real estate & tourism platform
 * @description Public landing page with hero section, featured properties, featured tours, CTA and footer.
 *               Landing pública con sección hero, propiedades destacadas, tours destacados, CTA y footer.
 * @module pages/landing/NexoRealLanding
 * @author Nexo Real Development Team
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Building2, MapPin, Users, Globe, Loader2, AlertCircle } from 'lucide-react';
import { useFeaturedProperties } from '../../stores/propertiesStore';
import { useFeaturedTours } from '../../stores/toursStore';
import { PropertyCard } from '../../components/property/PropertyCard';
import { TourCard } from '../../components/tour/TourCard';

// ============================================
// Constants / Constantes
// ============================================

const STATS = [
  { labelKey: 'landing.hero.stats.properties', value: '1,200+', icon: Building2 },
  { labelKey: 'landing.hero.stats.tours', value: '340+', icon: MapPin },
  { labelKey: 'landing.hero.stats.countries', value: '12', icon: Globe },
  { labelKey: 'landing.hero.stats.clients', value: '8,500+', icon: Users },
];

// ============================================
// Sub-sections / Sub-secciones
// ============================================

/**
 * Hero section with headline, CTA buttons and stats strip.
 * Sección hero con titular, botones CTA y tira de estadísticas.
 */
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-slate-900 pt-24 pb-20">
      {/* Background gradient blobs */}
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          {t('landing.hero.badge')}
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto">
          {t('landing.hero.title')}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
          {t('landing.hero.subtitle')}
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/properties"
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
          >
            <Building2 className="w-5 h-5" />
            {t('landing.hero.ctaProperties')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/tours"
            className="flex items-center gap-2 px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700/50 hover:border-emerald-500/40 transition-all duration-300"
          >
            <MapPin className="w-5 h-5" />
            {t('landing.hero.ctaTours')}
          </Link>
        </div>

        {/* Stats strip */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {STATS.map(({ labelKey, value, icon: Icon }) => (
            <div key={labelKey} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-slate-400">{t(labelKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Featured properties section with grid of PropertyCard components.
 * Sección de propiedades destacadas con grid de componentes PropertyCard.
 */
function FeaturedPropertiesSection() {
  const { t } = useTranslation();
  const { featuredProperties, isFetchingFeatured, featuredError, fetchFeatured } =
    useFeaturedProperties();

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white">
              {t('landing.featuredProperties.title')}
            </h2>
            <p className="mt-2 text-slate-400">{t('landing.featuredProperties.subtitle')}</p>
          </div>
          <Link
            to="/properties"
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors shrink-0"
          >
            {t('landing.featuredProperties.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* States */}
        {isFetchingFeatured && (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{t('landing.featuredProperties.loading')}</span>
          </div>
        )}

        {!isFetchingFeatured && featuredError && (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span>{featuredError}</span>
          </div>
        )}

        {!isFetchingFeatured && !featuredError && featuredProperties.length === 0 && (
          <p className="text-center py-16 text-slate-500">
            {t('landing.featuredProperties.empty')}
          </p>
        )}

        {!isFetchingFeatured && featuredProperties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Featured tours section with grid of TourCard components.
 * Sección de tours destacados con grid de componentes TourCard.
 */
function FeaturedToursSection() {
  const { t } = useTranslation();
  const { featuredTours, isFetchingFeatured, featuredError, fetchFeatured } = useFeaturedTours();

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white">{t('landing.featuredTours.title')}</h2>
            <p className="mt-2 text-slate-400">{t('landing.featuredTours.subtitle')}</p>
          </div>
          <Link
            to="/tours"
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors shrink-0"
          >
            {t('landing.featuredTours.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* States */}
        {isFetchingFeatured && (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{t('landing.featuredTours.loading')}</span>
          </div>
        )}

        {!isFetchingFeatured && featuredError && (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span>{featuredError}</span>
          </div>
        )}

        {!isFetchingFeatured && !featuredError && featuredTours.length === 0 && (
          <p className="text-center py-16 text-slate-500">{t('landing.featuredTours.empty')}</p>
        )}

        {!isFetchingFeatured && featuredTours.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * CTA section with sign-up and login buttons.
 * Sección CTA con botones de registro y login.
 */
function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('landing.cta.title')}</h2>
        <p className="mt-4 text-lg text-slate-400">{t('landing.cta.subtitle')}</p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
          >
            {t('landing.cta.button')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-3.5 text-slate-300 hover:text-white font-medium transition-colors"
          >
            {t('landing.cta.login')}
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Footer section with brand tagline and links.
 * Sección footer con tagline de marca y enlaces.
 */
function FooterSection() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-bold text-white text-lg">Nexo Real</span>
            </div>
            <p className="text-slate-400 text-sm">{t('landing.footer.tagline')}</p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('landing.footer.links')}
              </p>
              <Link
                to="/properties"
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {t('nav.properties')}
              </Link>
              <Link
                to="/tours"
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {t('nav.tours')}
              </Link>
              <Link
                to="/login"
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {t('auth.signIn')}
              </Link>
              <Link
                to="/register"
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {t('auth.createAccount')}
              </Link>
            </div>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
          © {year} Nexo Real. {t('landing.footer.rights')}
        </div>
      </div>
    </footer>
  );
}

// ============================================
// Main Page / Página principal
// ============================================

/**
 * NexoRealLanding is the public home page for the platform.
 * NexoRealLanding es la página de inicio pública de la plataforma.
 */
export default function NexoRealLanding() {
  return (
    <div className="min-h-screen bg-slate-900">
      <HeroSection />
      <FeaturedPropertiesSection />
      <FeaturedToursSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
