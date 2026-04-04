/**
 * @fileoverview Products sub-controllers barrel export
 * @description Barrel export for product sub-controllers
 * @module controllers/products
 *
 * @example
 * // English: Import from sub-controllers
 * import { getProducts, getProductById } from '../controllers/products';
 *
 * // Español: Importar desde sub-controladores
 * import { getProducts, getProductById } from '../controllers/products';
 */

// Product read controller (retrieval operations)
export { getProducts, getProductById } from './ProductReadController';

// Product write controller (admin CRUD)
export {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductAdmin,
  listProductsAdmin,
} from './ProductWriteController';

// Product inventory controller (stock management)
export {
  reserveStock,
  releaseStock,
  adjustStock,
  setInitialStock,
  recordReturn,
  getInventoryMovements,
} from './ProductInventoryController';
