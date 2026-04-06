/**
 * @fileoverview CartRecoveryNotif Component - Toast notification for cart recovery
 * @description Displays a dismissible notification when a cart recovery is detected.
 *              Shows item count and total, with a link to resume shopping.
 *              Muestra una notificación descartable cuando se detecta una recuperación de carrito.
 *              Muestra cantidad de items y total, con enlace para retomar la compra.
 * @module components/Cart/CartRecoveryNotif
 * @author Nexo Real Development Team
 */

import { useState } from 'react';
import { ShoppingCart, X, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

// ============================================
// Types / Tipos
// ============================================

interface CartRecoveryNotifProps {
  itemCount: number;
  totalAmount: number;
  onResume: () => void;
  onDismiss: () => void;
  className?: string;
}

// ============================================
// Component / Componente
// ============================================

/**
 * CartRecoveryNotif component - Toast notification for cart recovery
 * Componente CartRecoveryNotif - Notificación toast para recuperación de carrito
 */
export function CartRecoveryNotif({
  itemCount,
  totalAmount,
  onResume,
  onDismiss,
  className,
}: CartRecoveryNotifProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-label="Cart recovery notification"
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm',
        'animate-in slide-in-from-bottom-5 fade-in duration-300',
        className
      )}
    >
      <div className="overflow-hidden rounded-xl border border-purple-500/30 bg-slate-800 shadow-xl shadow-purple-500/10">
        {/* Header with dismiss */}
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
            <ShoppingCart className="h-5 w-5 text-purple-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Your cart is waiting!</p>
            <p className="mt-1 text-sm text-slate-400">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · $
              {totalAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action */}
        <div className="border-t border-slate-700 px-4 py-3">
          <button
            onClick={onResume}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
              'bg-purple-600 text-white transition-colors',
              'hover:bg-purple-500',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800'
            )}
          >
            Resume Shopping
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartRecoveryNotif;
