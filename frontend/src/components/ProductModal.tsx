/**
 * @fileoverview ProductModal Component - Full product details modal
 * @description Modal component showing full product details with description and duration
 * @module components/ProductModal
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Check } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';
import { PriceDisplay } from './PriceDisplay';
import type { Product } from '../types';
import { cn } from '../utils/cn';

/**
 * ProductModal props
 */
interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onBuyNow?: (product: Product) => void;
  className?: string;
}

/**
 * Default product images by platform
 */
const defaultImages: Record<string, string> = {
  netflix: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&h=500&fit=crop',
  disney_plus: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&h=500&fit=crop',
  spotify: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=500&fit=crop',
  hbo_max: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=800&h=500&fit=crop',
  amazon_prime: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&h=500&fit=crop',
  youtube_premium:
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=500&fit=crop',
  apple_tv_plus:
    'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&h=500&fit=crop',
};

/**
 * ProductModal component - Displays full product details in a modal
 * Componente de modal de producto - Muestra detalles completos del producto en un modal
 */
export function ProductModal({ product, isOpen, onClose, onBuyNow, className }: ProductModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const imageUrl = product.imageUrl || defaultImages[product.platform];
  const durationLabel = t('products.days', { count: product.durationDays });
  const perMonth = product.durationDays <= 30 ? t('products.perMonth') : t('products.perYear');

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm',
        'animate-in fade-in duration-200',
        className
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={cn(
          'relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl',
          'border border-slate-700 bg-slate-800 shadow-2xl',
          'animate-in zoom-in-95 duration-200'
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            'absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white',
            'transition-colors hover:bg-black/70',
            'focus:outline-none focus:ring-2 focus:ring-purple-500'
          )}
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Product Image */}
        <div className="relative aspect-video overflow-hidden bg-slate-700">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

          {/* Platform Badge */}
          <div className="absolute bottom-4 left-4">
            <PlatformBadge platform={product.platform} size="lg" />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-4 p-6">
          {/* Title and Price */}
          <div className="flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-2xl font-bold text-white">
              {product.name}
            </h2>
            <div className="text-right">
              <PriceDisplay amount={product.price} size="xl" />
              <span className="text-sm text-slate-400">{perMonth}</span>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="h-5 w-5 text-purple-400" />
            <span>{durationLabel}</span>
          </div>

          {/* Description */}
          {product.description && <p className="text-slate-300">{product.description}</p>}

          {/* Features List (placeholder - can be customized per product) */}
          <div className="rounded-lg bg-slate-700/50 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {t('products.features')}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="h-4 w-4 text-green-400" />
                {t('products.access')}
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="h-4 w-4 text-green-400" />
                {t('products.hdQuality')}
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="h-4 w-4 text-green-400" />
                {t('products.cancelAnytime')}
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <button
            onClick={handleBuyNow}
            disabled={!product.isActive}
            className={cn(
              'mt-2 w-full rounded-xl bg-purple-600 py-3 text-lg font-semibold text-white',
              'transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25',
              'disabled:bg-slate-600 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800'
            )}
          >
            {product.isActive ? t('products.buyNow') : t('products.unavailable')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
