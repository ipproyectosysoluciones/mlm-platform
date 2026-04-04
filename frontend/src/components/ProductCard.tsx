/**
 * @fileoverview ProductCard Component - Generic product display card
 * @description Card component displaying all 4 product types (physical, digital, subscription, service)
 *              with type-specific badges and indicators
 * @module components/ProductCard
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Loader2, Package, Download, Calendar, Wrench } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';
import { PriceDisplay } from './PriceDisplay';
import type { Product, ProductType } from '../types';
import { cn } from '../utils/cn';

/**
 * ProductCard props
 */
interface ProductCardProps {
  product: Product;
  onBuyNow?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Default product images by platform
 */
const defaultImages: Record<string, string> = {
  netflix: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=250&fit=crop',
  disney_plus: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=250&fit=crop',
  spotify: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=250&fit=crop',
  hbo_max: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&h=250&fit=crop',
  amazon_prime: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=250&fit=crop',
  youtube_premium:
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop',
  apple_tv_plus:
    'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=400&h=250&fit=crop',
};

/**
 * Default images by product type
 */
const typeDefaultImages: Record<ProductType, string> = {
  physical: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=250&fit=crop',
  digital: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop',
  subscription: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=250&fit=crop',
  service: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
};

/**
 * Get type icon
 */
function getTypeIcon(type: ProductType | undefined) {
  switch (type) {
    case 'physical':
      return <Package className="w-4 h-4" />;
    case 'digital':
      return <Download className="w-4 h-4" />;
    case 'subscription':
      return <Calendar className="w-4 h-4" />;
    case 'service':
      return <Wrench className="w-4 h-4" />;
    default:
      return <Calendar className="w-4 h-4" />;
  }
}

/**
 * Get type badge color
 */
function getTypeBadgeColor(type: ProductType | undefined): string {
  switch (type) {
    case 'physical':
      return 'bg-amber-500/90 text-white';
    case 'digital':
      return 'bg-blue-500/90 text-white';
    case 'subscription':
      return 'bg-purple-500/90 text-white';
    case 'service':
      return 'bg-emerald-500/90 text-white';
    default:
      return 'bg-gray-500/90 text-white';
  }
}

/**
 * Get type label
 */
function getTypeLabel(type: ProductType | undefined, t: (key: string) => string): string {
  switch (type) {
    case 'physical':
      return t('products.types.physical');
    case 'digital':
      return t('products.types.digital');
    case 'subscription':
      return t('products.types.subscription');
    case 'service':
      return t('products.types.service');
    default:
      return t('products.types.subscription');
  }
}

/**
 * ProductCard component - Displays product information in a card format for all 4 types
 * Componente de tarjeta de producto - Muestra información del producto para todos los tipos
 */
export function ProductCard({
  product,
  onBuyNow,
  onViewDetails,
  isLoading = false,
  className,
}: ProductCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Extended product type (with generic product support)
  const extendedProduct = product as Product & {
    type?: ProductType;
    stock?: number;
    isDigital?: boolean;
    images?: string[];
  };

  // Get image URL - prioritize: product.images[0], product.imageUrl, type default, platform default
  const imageUrl =
    (extendedProduct.images && extendedProduct.images[0]) ||
    product.imageUrl ||
    typeDefaultImages[extendedProduct.type || 'subscription'] ||
    defaultImages[product.platform] ||
    typeDefaultImages.subscription;

  const durationLabel = t('products.days', { count: product.durationDays });
  const perMonth = product.durationDays <= 30 ? t('products.perMonth') : t('products.perYear');
  const productType = extendedProduct.type;

  const handleBuyNow = () => {
    if (!isLoading && onBuyNow) {
      onBuyNow(product);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800 transition-all duration-300',
        'hover:border-slate-600 hover:shadow-xl hover:shadow-purple-500/10',
        isHovered && 'scale-[1.02]',
        !product.isActive && 'opacity-60',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-video overflow-hidden bg-slate-700">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-700">
            <span className="text-4xl font-bold text-slate-500">{product.name.charAt(0)}</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              getTypeBadgeColor(productType)
            )}
          >
            {getTypeIcon(productType)}
            {getTypeLabel(productType, t)}
          </span>
        </div>

        {/* Platform Badge */}
        <div className="absolute right-3 top-3">
          <PlatformBadge platform={product.platform} size="sm" />
        </div>

        {/* Stock Badge for Physical Products */}
        {productType === 'physical' && extendedProduct.stock !== undefined && (
          <div className="absolute bottom-3 right-3">
            <span
              className={cn(
                'rounded-full px-2 py-1 text-xs font-medium',
                extendedProduct.stock > 0
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              )}
            >
              {extendedProduct.stock > 0
                ? `${t('products.inStock')}: ${extendedProduct.stock}`
                : t('products.outOfStock')}
            </span>
          </div>
        )}

        {/* Digital indicator */}
        {productType === 'digital' && (
          <div className="absolute bottom-3 right-3">
            <span className="rounded-full bg-blue-500/90 px-2 py-1 text-xs font-medium text-white">
              <Download className="inline-block w-3 h-3 mr-1" />
              {t('products.digital')}
            </span>
          </div>
        )}

        {/* Inactive overlay */}
        {!product.isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
              {t('products.unavailable')}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg font-semibold text-white line-clamp-2">{product.name}</h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <PriceDisplay amount={product.price} size="lg" />
          <span className="text-sm text-slate-400">{perMonth}</span>
        </div>

        {/* Duration / Subscription Info */}
        {productType === 'subscription' && (
          <p className="text-sm text-slate-400">{durationLabel}</p>
        )}

        {/* Service Info */}
        {productType === 'service' && (
          <p className="text-sm text-slate-400 flex items-center gap-1">
            <Wrench className="w-4 h-4" />
            {t('products.service')}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2">
          <button
            onClick={handleViewDetails}
            className={cn(
              'flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-white transition-colors',
              'hover:border-slate-500 hover:bg-slate-700'
            )}
          >
            {t('products.viewDetails')}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={
              !product.isActive ||
              isLoading ||
              (productType === 'physical' && (extendedProduct.stock || 0) <= 0)
            }
            className={cn(
              'flex flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
              'bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            {t('products.buyNow')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
