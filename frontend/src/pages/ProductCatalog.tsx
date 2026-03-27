/**
 * @fileoverview ProductCatalog Page - Product listing with filters
 * @description Product listing page with platform filter chips, responsive grid, loading skeletons, empty state, and error handling
 * @module pages/ProductCatalog
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorToast } from '../components/ErrorToast';
import { productService } from '../services/api';
import type { Product, StreamingPlatform, ProductListResponse } from '../types';
import { cn } from '../utils/cn';

/**
 * Platform filter chips configuration
 */
const platforms: { value: StreamingPlatform | 'all'; label: string }[] = [
  { value: 'all', label: 'products.platforms.all' },
  { value: 'netflix', label: 'products.platforms.netflix' },
  { value: 'disney_plus', label: 'products.platforms.disney_plus' },
  { value: 'spotify', label: 'products.platforms.spotify' },
  { value: 'hbo_max', label: 'products.platforms.hbo_max' },
  { value: 'amazon_prime', label: 'products.platforms.amazon_prime' },
  { value: 'youtube_premium', label: 'products.platforms.youtube_premium' },
  { value: 'apple_tv_plus', label: 'products.platforms.apple_tv_plus' },
];

/**
 * Loading skeleton component for product grid
 */
function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      <div className="aspect-video bg-slate-700" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-6 w-3/4 rounded bg-slate-700" />
        <div className="h-4 w-1/2 rounded bg-slate-700" />
        <div className="h-4 w-1/3 rounded bg-slate-700" />
        <div className="mt-auto flex gap-2 pt-2">
          <div className="h-10 flex-1 rounded bg-slate-700" />
          <div className="h-10 w-24 rounded bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

/**
 * ProductCatalog page component
 * Componente de página de catálogo de productos
 */
export default function ProductCatalog() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatform | 'all'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  /**
   * Load products from API
   */
  const loadProducts = useCallback(
    async (page: number = 1, platform?: StreamingPlatform | 'all') => {
      setIsLoading(true);
      setError(null);

      try {
        const params: { page: number; limit: number; platform?: StreamingPlatform } = {
          page,
          limit: pagination.limit,
        };

        if (platform && platform !== 'all') {
          params.platform = platform;
        }

        const response: ProductListResponse = await productService.getProducts(params);
        setProducts(response.products);
        setPagination({
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
        });
      } catch (err) {
        console.error('Failed to load products:', err);
        setError(t('products.error'));
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit, t]
  );

  // Initial load
  useEffect(() => {
    loadProducts(1, selectedPlatform);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle platform filter change
   */
  const handlePlatformChange = (platform: StreamingPlatform | 'all') => {
    setSelectedPlatform(platform);
    loadProducts(1, platform);
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
    // Could open a modal here, for now navigate to checkout
    navigate(`/checkout/${product.id}`);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadProducts(newPage, selectedPlatform);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t('products.title')}</h1>
          <p className="mt-2 text-slate-400">{t('products.subtitle')}</p>
        </div>

        {/* Platform Filter Chips */}
        <div className="mb-8 flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <button
              key={platform.value}
              onClick={() => handlePlatformChange(platform.value)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all',
                selectedPlatform === platform.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
            >
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
            className="mb-6"
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
          <>
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    pagination.page === 1
                      ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  )}
                >
                  {t('common.previous')}
                </button>

                <span className="text-sm text-slate-400">
                  {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    pagination.page === pagination.totalPages
                      ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  )}
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
