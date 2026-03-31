/**
 * @fileoverview Commission Controllers Barrel Export
 * @description Re-exports all commission-related controller modules from a single entry point.
 *              Re-exporta todos los módulos de controladores de comisiones desde un único punto de entrada.
 * @module controllers/commissions
 * @author MLM Development Team
 *
 * @example
 * // English: Import from sub-controllers
 * import { getAllConfigs, createConfig } from '../controllers/commissions';
 *
 * // Español: Importar desde sub-controladores
 * import { getAllConfigs, createConfig } from '../controllers/commissions';
 */

// CommissionConfig Read Controller exports
export { getAllConfigs, getConfigById, getActiveRates } from './CommissionConfigReadController';

// CommissionConfig Write Controller exports
export { createConfig, updateConfig, deleteConfig } from './CommissionConfigWriteController';
