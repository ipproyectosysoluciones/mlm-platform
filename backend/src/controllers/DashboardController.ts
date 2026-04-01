/**
 * @fileoverview DashboardController - User dashboard and statistics endpoints
 * @description Handles the main user dashboard with statistics, referrals, and commissions overview.
 *              Gestiona el dashboard principal del usuario con estadísticas, referidos y vista general de comisiones.
 *              This file re-exports from sub-controllers for backward compatibility.
 * @module controllers/DashboardController
 * @author MLM Development Team
 */

// Re-export from sub-controllers
export { getDashboardUser } from './dashboard/DashboardUserController';
export { getDashboardStats } from './dashboard/DashboardStatsController';
export { getDashboardCommissions } from './dashboard/DashboardCommissionsController';
export { getDashboardReferrals } from './dashboard/DashboardReferralsController';

// Main dashboard aggregator - combines all sub-controller data
export { getDashboard } from './dashboard/DashboardController';
