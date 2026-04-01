/**
 * @fileoverview ProductController - Product API endpoints for streaming subscriptions
 * @description Handles product listing, filtering, and retrieval for e-commerce.
 *             Gestión de endpoints de productos para suscripciones de streaming.
 *             This file now re-exports from sub-controllers.
 * @module controllers/ProductController
 * @author MLM Development Team
 *
 * @example
 * // English: GET /api/products - List all products
 * const response = await fetch('/api/products?page=1&limit=20');
 *
 * // Español: GET /api/products - Listar todos los productos
 * const response = await fetch('/api/products?page=1&limit=20');
 */

// Re-export from sub-controllers
export { getProducts, getProductById } from './products/ProductReadController';
