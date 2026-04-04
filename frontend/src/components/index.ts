/**
 * @fileoverview Component exports
 * @description Centralized exports for all components
 * @module components
 */

// Platform & Price
export { PlatformBadge, default as PlatformBadgeDefault } from './PlatformBadge';
export { PriceDisplay, default as PriceDisplayDefault } from './PriceDisplay';

// Product Components
export { ProductCard, default as ProductCardDefault } from './ProductCard';
export { ProductModal, default as ProductModalDefault } from './ProductModal';

// Order Components
export { OrderSummary, default as OrderSummaryDefault } from './OrderSummary';
export { CheckoutForm, default as CheckoutFormDefault } from './CheckoutForm';
export { OrderStatus, default as OrderStatusDefault } from './OrderStatus';
export type { OrderStatusProps } from './OrderStatus';

// UI Components
export { EmptyState, default as EmptyStateDefault } from './EmptyState';
export { ErrorToast, ErrorToastContainer, default as ErrorToastDefault } from './ErrorToast';
export { default as OfflineBanner } from './OfflineBanner';

// Gift Cards
export { GiftCardCreateForm, GiftCardCreateFormDefault } from './GiftCards';

// Checkout
export { GiftCardRedeem, GiftCardRedeemDefault } from './Checkout';

// Route Guards
export { ProtectedRoute, AdminRoute, PublicRoute, PublicProfileRoute } from './routes';
