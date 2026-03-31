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
export { getDashboardUser } from './DashboardUserController';

// Stats controller
export { getDashboardStats } from './DashboardStatsController';

// Commissions controller
export { getDashboardCommissions } from './DashboardCommissionsController';

// Referrals controller
export { getDashboardReferrals } from './DashboardReferralsController';

// Main dashboard aggregator
export { getDashboard } from './DashboardController';
