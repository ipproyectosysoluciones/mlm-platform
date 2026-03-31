/**
 * @fileoverview CommissionConfigController - Admin endpoints for commission configuration
 * @description CRUD operations for commission rate configurations by business type
 *              Operaciones CRUD para configuraciones de tasas de comisión por tipo de negocio
 * @module controllers/CommissionConfigController
 * @author MLM Development Team
 *
 * @deprecated Use imports from '../controllers/commissions' instead
 * @example
 * // English: New import pattern
 * import { getAllConfigs, createConfig, updateConfig, deleteConfig } from '../controllers/commissions';
 *
 * // Español: Nuevo patrón de importación
 * import { getAllConfigs, createConfig, updateConfig, deleteConfig } from '../controllers/commissions';
 */

// Re-export from sub-controllers for backward compatibility
export {
  getAllConfigs,
  getConfigById,
  getActiveRates,
  createConfig,
  updateConfig,
  deleteConfig,
} from './commissions';
