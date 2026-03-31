/**
 * @fileoverview Orders sub-controllers barrel export
 * @description Barrel export for order sub-controllers
 * @module controllers/orders
 *
 * @example
 * // English: Import from sub-controllers
 * import { createOrder, getOrders, getOrderById } from '../controllers/orders';
 *
 * // Español: Importar desde sub-controladores
 * import { createOrder, getOrders, getOrderById } from '../controllers/orders';
 */

// Order write controller (creation operations)
export { createOrder } from './OrderWriteController';

// Order read controller (retrieval operations)
export { getOrders, getOrderById } from './OrderReadController';
