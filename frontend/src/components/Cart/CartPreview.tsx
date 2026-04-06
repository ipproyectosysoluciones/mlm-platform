/**
 * @fileoverview CartPreview Component - Read-only cart display for recovery flow
 * @description Displays cart items, quantities, and totals in a read-only card format.
 *              Used during cart recovery to show the user what they're about to restore.
 *              Muestra items del carrito, cantidades y totales en formato de solo lectura.
 *              Usado durante la recuperación para mostrar al usuario qué va a restaurar.
 * @module components/Cart/CartPreview
 * @author Nexo Real Development Team
 */

import { ShoppingCart, Package } from 'lucide-react';
import { PriceDisplay } from '../PriceDisplay';
import { cn } from '../../utils/cn';
import type { CartResponse, CartItemResponse } from '../../services/cartService';

// ============================================
// Types / Tipos
// ============================================

interface CartPreviewProps {
  cart: CartResponse;
  className?: string;
}

interface CartPreviewItemProps {
  item: CartItemResponse;
}

// ============================================
// CartPreviewItem / Item de vista previa
// ============================================

/**
 * Single cart item row (read-only)
 * Fila de item del carrito (solo lectura)
 */
function CartPreviewItem({ item }: CartPreviewItemProps) {
  const productName = item.product?.name ?? 'Product';
  const platform = item.product?.platform ?? '';

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      {/* Product Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700">
          <Package className="h-5 w-5 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{productName}</p>
          {platform && (
            <p className="text-xs text-slate-400 capitalize">{platform.replace('_', ' ')}</p>
          )}
        </div>
      </div>

      {/* Quantity & Price */}
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm text-slate-400">×{item.quantity}</span>
        <PriceDisplay
          amount={Number(item.subtotal) || item.quantity * Number(item.unitPrice)}
          size="sm"
          className="text-white"
        />
      </div>
    </div>
  );
}

// ============================================
// CartPreview / Vista previa del carrito
// ============================================

/**
 * CartPreview component - Read-only cart display for recovery
 * Componente CartPreview - Vista de solo lectura del carrito para recuperación
 */
export function CartPreview({ cart, className }: CartPreviewProps) {
  const items = cart.items ?? [];
  const totalAmount = Number(cart.totalAmount) || 0;
  const itemCount = cart.itemCount ?? items.length;

  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-slate-700 bg-slate-800', className)}
    >
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 px-5 py-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <ShoppingCart className="h-5 w-5 text-purple-400" />
          Your Cart
          <span className="ml-auto text-sm font-normal text-slate-400">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </h3>
      </div>

      {/* Items List */}
      <div className="divide-y divide-slate-700/50 px-5">
        {items.length > 0 ? (
          items.map((item) => <CartPreviewItem key={item.id} item={item} />)
        ) : (
          <div className="py-8 text-center text-sm text-slate-400">No items in this cart</div>
        )}
      </div>

      {/* Total */}
      {items.length > 0 && (
        <div className="border-t border-slate-700 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-white">Total</span>
            <PriceDisplay amount={totalAmount} size="lg" className="text-green-400" />
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPreview;
