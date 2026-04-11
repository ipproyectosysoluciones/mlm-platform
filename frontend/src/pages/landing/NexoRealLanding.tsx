/**
 * @fileoverview NexoRealLanding - Main landing page for Nexo Real real estate & tourism platform
 * @description Public landing page redesigned for investor pitch with hero image, how it works,
 *               features, testimonials, and existing property/tour sections.
 *               Landing pública rediseñada para pitch a inversores con imagen hero, cómo funciona,
 *               features, testimonios, y secciones existentes de propiedades/tours.
 * @module pages/landing/NexoRealLanding
 * @author Nexo Real Development Team
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Building2,
  MapPin,
  Users,
  Globe,
  Loader2,
  AlertCircle,
  UserPlus,
  Network,
  TrendingUp,
  Compass,
  CreditCard,
  Star,
} from 'lucide-react';
import { useFeaturedProperties } from '../../stores/propertiesStore';
import { useFeaturedTours } from '../../stores/toursStore';
import { PropertyCard } from '../../components/property/PropertyCard';
import { TourCard } from '../../components/tour/TourCard';

// ============================================
// Constants / Constantes
// ============================================

/** Stats shown in the hero section / Estadísticas del hero */
const STATS = [
  { labelKey: 'landing.hero.stats.properties', value: '1,200+', icon: Building2 },
  { labelKey: 'landing.hero.stats.tours', value: '340+', icon: MapPin },
  { labelKey: 'landing.hero.stats.countries', value: '12', icon: Globe },
  { labelKey: 'landing.hero.stats.clients', value: '8,500+', icon: Users },
] as const;

/** How-it-works step data / Datos de los pasos de cómo funciona */
const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    icon: UserPlus,
    titleKey: 'landing.howItWorks.step1.title',
    descKey: 'landing.howItWorks.step1.description',
  },
  {
    number: '02',
    icon: Network,
    titleKey: 'landing.howItWorks.step2.title',
    descKey: 'landing.howItWorks.step2.description',
  },
  {
    number: '03',
    icon: TrendingUp,
    titleKey: 'landing.howItWorks.step3.title',
    descKey: 'landing.howItWorks.step3.description',
  },
] as const;

/** Platform features data / Datos de características de la plataforma */
const FEATURES = [
  {
    icon: Building2,
    titleKey: 'landing.features.properties.title',
    descKey: 'landing.features.properties.description',
  },
  {
    icon: Compass,
    titleKey: 'landing.features.tours.title',
    descKey: 'landing.features.tours.description',
  },
  {
    icon: Users,
    titleKey: 'landing.features.crm.title',
    descKey: 'landing.features.crm.description',
  },
  {
    icon: TrendingUp,
    titleKey: 'landing.features.commissions.title',
    descKey: 'landing.features.commissions.description',
  },
  {
    icon: CreditCard,
    titleKey: 'landing.features.payments.title',
    descKey: 'landing.features.payments.description',
  },
] as const;

/** Testimonial data with initials derived from names / Datos de testimonios */
const TESTIMONIALS = [
  {
    quoteKey: 'landing.testimonials.t1.quote',
    nameKey: 'landing.testimonials.t1.name',
    roleKey: 'landing.testimonials.t1.role',
    cityKey: 'landing.testimonials.t1.city',
    initials: 'VR',
    color: 'bg-emerald-500',
    stars: 5,
  },
  {
    quoteKey: 'landing.testimonials.t2.quote',
    nameKey: 'landing.testimonials.t2.name',
    roleKey: 'landing.testimonials.t2.role',
    cityKey: 'landing.testimonials.t2.city',
    initials: 'RJ',
    color: 'bg-sky-500',
    stars: 5,
  },
  {
    quoteKey: 'landing.testimonials.t3.quote',
    nameKey: 'landing.testimonials.t3.name',
    roleKey: 'landing.testimonials.t3.role',
    cityKey: 'landing.testimonials.t3.city',
    initials: 'CT',
    color: 'bg-violet-500',
    stars: 5,
  },
] as const;

/** Hero background image URL / URL de imagen de fondo del hero */
const HERO_BG_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop';

// ============================================
// Sub-sections / Sub-secciones
// ============================================

/**
 * Hero section with background image, headline, CTA buttons and stats strip.
 * Sección hero con imagen de fondo, titular, botones CTA y tira de estadísticas.
 */
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background image */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG_IMAGE})` }}
      />

      {/* Dark gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-slate-900"
      />

      {/* Emerald glow accents */}
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          {t('landing.hero.badge')}
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight max-w-4xl mx-auto">
          {t('landing.hero.title')}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t('landing.hero.subtitle')}
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/properties"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 text-lg"
          >
            <Building2 className="w-5 h-5" />
            {t('landing.hero.ctaProperties')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/tours"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/20 hover:border-emerald-500/40 backdrop-blur-sm transition-all duration-300 text-lg"
          >
            <MapPin className="w-5 h-5" />
            {t('landing.hero.ctaTours')}
          </Link>
        </div>

        {/* Stats strip */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {STATS.map(({ labelKey, value, icon: Icon }) => (
            <div
              key={labelKey}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/25 rounded-xl flex items-center justify-center">
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
 * How-it-works section with 3-step visual flow.
 * Sección de cómo funciona con flujo visual de 3 pasos.
 */
function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps grid with connector lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Dashed connector line (visible on md+) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-emerald-500/30"
          />

          {HOW_IT_WORKS_STEPS.map(({ number, icon: Icon, titleKey, descKey }) => (
            <div key={number} className="relative flex flex-col items-center text-center group">
              {/* Number circle */}
              <div className="relative z-10 w-32 h-32 rounded-full bg-slate-900 border-2 border-emerald-500/30 flex flex-col items-center justify-center mb-6 group-hover:border-emerald-500/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                <span className="text-emerald-500 text-sm font-bold tracking-widest">{number}</span>
                <Icon className="w-8 h-8 text-emerald-400 mt-1" />
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold text-white mb-3">{t(titleKey)}</h3>
              <p className="text-slate-400 leading-relaxed max-w-xs">{t(descKey)}</p>
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
    <section className="py-20 bg-slate-900">
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
 * Features section with 6 feature cards in a responsive grid.
 * Sección de features con 6 tarjetas en un grid responsivo.
 */
function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            {t('landing.features.title')}
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
            >
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/30 transition-all duration-300">
                <Icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t(titleKey)}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{t(descKey)}</p>
            </div>
          ))}
        </div>
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
 * Testimonials section with 3 customer testimonial cards.
 * Sección de testimonios con 3 tarjetas de clientes.
 */
function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            {t('landing.testimonials.title')}
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            {t('landing.testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quoteKey, nameKey, roleKey, cityKey, initials, color, stars }) => (
            <div
              key={quoteKey}
              className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: stars }, (_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-slate-300 leading-relaxed text-sm flex-1 mb-6">
                &ldquo;{t(quoteKey)}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                <div
                  className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{t(nameKey)}</p>
                  <p className="text-slate-400 text-xs truncate">
                    {t(roleKey)} · {t(cityKey)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * CTA section with sign-up and login buttons (enhanced copy for investor pitch).
 * Sección CTA con botones de registro y login (copy mejorado para pitch a inversores).
 */
function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Decorative emerald glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('landing.cta.title')}</h2>
        <p className="mt-4 text-lg text-slate-400">{t('landing.cta.subtitle')}</p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 text-lg"
          >
            {t('landing.cta.button')}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 text-slate-300 hover:text-white font-medium transition-colors"
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
    <footer className="bg-slate-950 border-t border-slate-800">
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
 * Optimized for investor pitch: hero with image, how it works, features, testimonials.
 *
 * NexoRealLanding es la página de inicio pública de la plataforma.
 * Optimizada para pitch a inversores: hero con imagen, cómo funciona, features, testimonios.
 */
export default function NexoRealLanding() {
  return (
    <div className="min-h-screen bg-slate-900">
      <HeroSection />
      <HowItWorksSection />
      <FeaturedPropertiesSection />
      <FeaturesSection />
      <FeaturedToursSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
