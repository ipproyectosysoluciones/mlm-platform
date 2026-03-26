/**
 * @fileoverview ProductCard Component - Product display card
 * @description Card component displaying product with name, platform, price, image, and Buy Now button
 * @module components/ProductCard
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';
import { PriceDisplay } from './PriceDisplay';
import type { Product } from '../types';
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
 * ProductCard component - Displays product information in a card format
 * Componente de tarjeta de producto - Muestra información del producto en formato de tarjeta
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

  const imageUrl = product.imageUrl || defaultImages[product.platform];
  const durationLabel = t('products.days', { count: product.durationDays });
  const perMonth = product.durationDays <= 30 ? t('products.perMonth') : t('products.perYear');
  const monthlyPrice =
    product.durationDays > 30 ? (product.price / 12).toFixed(2) : product.price.toFixed(2);

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

        {/* Platform Badge */}
        <div className="absolute left-3 top-3">
          <PlatformBadge platform={product.platform} size="sm" />
        </div>

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

        {/* Duration */}
        <p className="text-sm text-slate-400">{durationLabel}</p>

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
            disabled={!product.isActive || isLoading}
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
