/**
 * @fileoverview CartRecoveryNotif — Sonner toast replacement
 * @description Replaces the custom positioned notification component with Sonner toast().
 *              Reemplaza el componente de notificación personalizado con toast() de Sonner.
 * @module components/Cart/CartRecoveryNotif
 * @author Nexo Real Development Team
 */

import { toast } from 'sonner';

// ============================================
// Types / Tipos
// ============================================

/** Props for cart recovery toast / Props para toast de recuperación de carrito */
interface CartRecoveryToastOptions {
  /** Number of items in the abandoned cart / Cantidad de items en el carrito abandonado */
  itemCount: number;
  /** Total monetary amount / Monto total */
  totalAmount: number;
  /** Callback when user clicks "Resume Shopping" / Callback al hacer clic en "Retomar compra" */
  onResume: () => void;
  /** Callback when toast is dismissed / Callback al descartar el toast */
  onDismiss: () => void;
}

// ============================================
// Toast function / Función toast
// ============================================

/**
 * Show a cart recovery toast using Sonner (replaces custom CartRecoveryNotif component).
 * Muestra un toast de recuperación de carrito usando Sonner (reemplaza CartRecoveryNotif).
 *
 * @param options — Cart recovery configuration / Configuración de recuperación de carrito
 */
export function showCartRecoveryToast({
  itemCount,
  totalAmount,
  onResume,
  onDismiss,
}: CartRecoveryToastOptions): void {
  const formattedTotal = totalAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const itemLabel = itemCount === 1 ? 'item' : 'items';

  toast('Your cart is waiting!', {
    description: `${itemCount} ${itemLabel} · $${formattedTotal}`,
    action: {
      label: 'Resume Shopping',
      onClick: onResume,
    },
    onDismiss,
  });
}
