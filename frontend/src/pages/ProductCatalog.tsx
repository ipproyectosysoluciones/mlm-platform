/**
 * @fileoverview ProductCatalog Page - Modern landing page with hero section
 * @description Beautiful landing page with hero, product cards, animations, and modern design
 * @module pages/ProductCatalog
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, Star, ArrowRight, Play, Music, Tv, Video } from 'lucide-react';

import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorToast } from '../components/ErrorToast';
import { productService } from '../services/api';
import type { Product, StreamingPlatform, ProductListResponse } from '../types';
import { cn } from '../utils/cn';

/**
 * Platform filter chips configuration with icons
 */
const platforms: { value: StreamingPlatform | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'products.platforms.all', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'netflix', label: 'products.platforms.netflix', icon: <Tv className="w-4 h-4" /> },
  {
    value: 'disney_plus',
    label: 'products.platforms.disney_plus',
    icon: <Star className="w-4 h-4" />,
  },
  { value: 'spotify', label: 'products.platforms.spotify', icon: <Music className="w-4 h-4" /> },
  { value: 'hbo_max', label: 'products.platforms.hbo_max', icon: <Play className="w-4 h-4" /> },
  {
    value: 'amazon_prime',
    label: 'products.platforms.amazon_prime',
    icon: <Zap className="w-4 h-4" />,
  },
  {
    value: 'youtube_premium',
    label: 'products.platforms.youtube_premium',
    icon: <Video className="w-4 h-4" />,
  },
];

/**
 * Loading skeleton component for product grid
 */
function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border bg-card">
      <div className="aspect-video bg-muted" />
      <div className="flex flex-col gap-4 p-6">
        <div className="h-6 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="mt-auto flex gap-3 pt-3">
          <div className="h-10 flex-1 rounded bg-muted" />
          <div className="h-10 w-28 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

/**
 * Hero Section Component
 */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 py-20 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full mb-8">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">Premium Streaming</span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Stream Everything
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            One Platform
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
          Get access to Netflix, Spotify, Disney+, HBO Max, and more premium services at unbeatable
          prices.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
            <span className="flex items-center gap-2">
              Browse Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * ProductCatalog page component
 */
export default function ProductCatalog() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatform | 'all'>('all');

  /**
   * Load products from API
   */
  const loadProducts = useCallback(
    async (platform?: StreamingPlatform | 'all') => {
      setIsLoading(true);
      setError(null);

      try {
        const params: { platform?: StreamingPlatform } = {};
        if (platform && platform !== 'all') {
          params.platform = platform;
        }

        const response: ProductListResponse = await productService.getProducts(params);
        setProducts(response.products);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError(t('products.error'));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  // Initial load
  useEffect(() => {
    loadProducts(selectedPlatform);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle platform filter change
   */
  const handlePlatformChange = (platform: StreamingPlatform | 'all') => {
    setSelectedPlatform(platform);
    loadProducts(platform);
  };

  /**
   * Handle buy now button click
   */
  const handleBuyNow = (product: Product) => {
    navigate(`/checkout/${product.id}`);
  };

  /**
   * Handle view details button click
   */
  const handleViewDetails = (product: Product) => {
    navigate(`/checkout/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Products Section */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Our Products</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose from our wide selection of premium streaming services
            </p>
          </div>

          {/* Platform Filter Chips */}
          <div className="mb-12 flex flex-wrap justify-center gap-3">
            {platforms.map((platform) => (
              <button
                key={platform.value}
                onClick={() => handlePlatformChange(platform.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedPlatform === platform.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {platform.icon}
                {t(platform.label)}
              </button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <ErrorToast
              message={error}
              isVisible={!!error}
              onClose={() => setError(null)}
              className="mb-8"
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && products.length === 0 && (
            <EmptyState
              title={selectedPlatform === 'all' ? t('products.empty') : t('products.emptyFiltered')}
              description={selectedPlatform !== 'all' ? t('products.emptyFilteredHint') : ''}
              actionLabel={t('products.clearFilters')}
              onAction={() => handlePlatformChange('all')}
            />
          )}

          {/* Product Grid */}
          {!isLoading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuyNow={handleBuyNow}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
