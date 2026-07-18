/**
 * @fileoverview OrderController - Order API endpoints for streaming subscriptions
 * @description Handles order creation, listing, and retrieval with authentication.
 *             Gestión de endpoints de pedidos con autenticación.
 * @module controllers/OrderController
 * @author MLM Development Team
 * @version 3.0.0
 * @deprecated Use sub-controllers in controllers/orders/ instead
 *
 * @example
 * // English: Import from sub-controllers (recommended)
 * import { createOrder, getOrders, getOrderById } from '../controllers/orders/index.js';
 *
 * // Español: Importar desde sub-controladores (recomendado)
 * import { createOrder, getOrders, getOrderById } from '../controllers/orders/index.js';
 */

// Re-export from sub-controllers for backward compatibility
// These are the primary exports now
export { createOrder } from './orders/OrderWriteController.js';
export { getOrders, getOrderById } from './orders/OrderReadController.js';
