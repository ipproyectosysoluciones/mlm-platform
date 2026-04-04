/**
 * @fileoverview ProductCatalog Page - Modern landing page with hero section and filters
 * @description Beautiful landing page with hero, product cards, type/category filters, and modern design
 * @module pages/ProductCatalog
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Zap,
  Star,
  ArrowRight,
  Play,
  Music,
  Tv,
  Video,
  Package,
  Download,
  Calendar,
  Wrench,
  Search,
  X,
  ChevronDown,
  Filter,
} from 'lucide-react';

import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorToast } from '../components/ErrorToast';
import { productService, categoryService } from '../services/api';
import type {
  Product,
  StreamingPlatform,
  ProductType,
  GenericProductListParams,
  Category,
} from '../types';
import { cn } from '../utils/cn';

/**
 * Filter option interface
 */
interface FilterOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Platform filter chips configuration with icons
 */
const platforms: FilterOption[] = [
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
 * Product type filter configuration
 */
const productTypes: FilterOption[] = [
  { value: 'all', label: 'products.types.all', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'physical', label: 'products.types.physical', icon: <Package className="w-4 h-4" /> },
  { value: 'digital', label: 'products.types.digital', icon: <Download className="w-4 h-4" /> },
  {
    value: 'subscription',
    label: 'products.types.subscription',
    icon: <Calendar className="w-4 h-4" />,
  },
  { value: 'service', label: 'products.types.service', icon: <Wrench className="w-4 h-4" /> },
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
 * Category sidebar component
 */
function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading,
}: {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          selectedCategory === null
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        All Categories
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            selectedCategory === category.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

/**
 * Filter sidebar component
 */
function FilterSidebar({
  platforms,
  selectedPlatform,
  productTypes,
  selectedType,
  categories,
  selectedCategory,
  searchQuery,
  onPlatformChange,
  onTypeChange,
  onCategoryChange,
  onSearchChange,
  onClearFilters,
  showFilters,
  onToggleFilters,
}: {
  platforms: FilterOption[];
  selectedPlatform: StreamingPlatform | 'all';
  productTypes: FilterOption[];
  selectedType: ProductType | 'all';
  categories: Category[];
  selectedCategory: string | null;
  searchQuery: string;
  onPlatformChange: (platform: StreamingPlatform | 'all') => void;
  onTypeChange: (type: ProductType | 'all') => void;
  onCategoryChange: (categoryId: string | null) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('products.search')}
          className="w-full pl-10 pr-4 py-2 bg-muted border border-transparent rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile filter toggle */}
      <button
        onClick={onToggleFilters}
        className="lg:hidden w-full flex items-center justify-between px-4 py-2 bg-muted rounded-lg text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
      </button>

      {/* Filters */}
      <div className={cn('space-y-6', !showFilters && 'hidden lg:block')}>
        {/* Product Type Filter */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {t('products.filterByType')}
          </h3>
          <div className="space-y-1">
            {productTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => onTypeChange(type.value as ProductType | 'all')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedType === type.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {type.icon}
                {t(type.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {t('products.filterByCategory')}
          </h3>
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={onCategoryChange}
            isLoading={false}
          />
        </div>

        {/* Platform Filter */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {t('products.filterByPlatform')}
          </h3>
          <div className="space-y-1">
            {platforms.map((platform) => (
              <button
                key={platform.value}
                onClick={() => onPlatformChange(platform.value as StreamingPlatform | 'all')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedPlatform === platform.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {platform.icon}
                {t(platform.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={onClearFilters}
          className="w-full px-4 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-colors"
        >
          {t('products.clearFilters')}
        </button>
      </div>
    </div>
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
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter state
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatform | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  /**
   * Load products from API with filters
   */
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: GenericProductListParams = {
        page,
        limit: 12,
      };

      if (selectedPlatform !== 'all') {
        params.platform = selectedPlatform;
      }

      if (selectedType !== 'all') {
        params.type = selectedType;
      }

      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await productService.getProducts(params);
      setProducts(response.products as unknown as Product[]);
      setTotalPages(response.totalPages);
      setTotalProducts(response.total);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(t('products.error'));
    } finally {
      setIsLoading(false);
    }
  }, [t, page, selectedPlatform, selectedType, selectedCategory, searchQuery]);

  /**
   * Load categories from API
   */
  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryService.getTree();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /**
   * Handle platform filter change
   */
  const handlePlatformChange = (platform: StreamingPlatform | 'all') => {
    setSelectedPlatform(platform);
    setPage(1);
  };

  /**
   * Handle type filter change
   */
  const handleTypeChange = (type: ProductType | 'all') => {
    setSelectedType(type);
    setPage(1);
  };

  /**
   * Handle category filter change
   */
  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  /**
   * Handle search change with debounce
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSelectedPlatform('all');
    setSelectedType('all');
    setSelectedCategory(null);
    setSearchQuery('');
    setPage(1);
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

  // Check if any filters are active
  const hasActiveFilters =
    selectedPlatform !== 'all' ||
    selectedType !== 'all' ||
    selectedCategory !== null ||
    searchQuery !== '';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Products Section */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Our Products</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {hasActiveFilters
                ? `${totalProducts} products found`
                : 'Choose from our wide selection of premium products'}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-4">
                <FilterSidebar
                  platforms={platforms}
                  selectedPlatform={selectedPlatform}
                  productTypes={productTypes}
                  selectedType={selectedType}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  searchQuery={searchQuery}
                  onPlatformChange={handlePlatformChange}
                  onTypeChange={handleTypeChange}
                  onCategoryChange={handleCategoryChange}
                  onSearchChange={handleSearchChange}
                  onClearFilters={handleClearFilters}
                  showFilters={showFilters}
                  onToggleFilters={() => setShowFilters(!showFilters)}
                />
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
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
                  title={hasActiveFilters ? t('products.emptyFiltered') : t('products.empty')}
                  description={hasActiveFilters ? t('products.emptyFilteredHint') : ''}
                  actionLabel={t('products.clearFilters')}
                  onAction={handleClearFilters}
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
                  {totalPages > 1 && (
                    <div className="mt-12 flex justify-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
