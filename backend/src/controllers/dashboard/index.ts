/**
 * @fileoverview Dashboard sub-controllers barrel export
 * @description Barrel export for dashboard sub-controllers
 * @module controllers/dashboard
 *
 * @example
 * // English: Import from sub-controllers
 * import { getDashboard } from '../controllers/dashboard';
 *
 * // Español: Importar desde sub-controladores
 * import { getDashboard } from '../controllers/dashboard';
 */

// User controller
export { getDashboardUser } from './DashboardUserController.js';

// Stats controller
export { getDashboardStats } from './DashboardStatsController.js';

// Commissions controller
export { getDashboardCommissions } from './DashboardCommissionsController.js';

// Referrals controller
export { getDashboardReferrals } from './DashboardReferralsController.js';

// Main dashboard aggregator
export { getDashboard } from './DashboardController.js';
