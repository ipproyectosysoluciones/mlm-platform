/**
 * @fileoverview DashboardController - User dashboard and statistics endpoints
 * @description Handles the main user dashboard with statistics, referrals, and commissions overview.
 *              Gestiona el dashboard principal del usuario con estadísticas, referidos y vista general de comisiones.
 *              This file re-exports from sub-controllers for backward compatibility.
 * @module controllers/DashboardController
 * @author MLM Development Team
 */

// Re-export from sub-controllers
export { getDashboardUser } from './dashboard/DashboardUserController.js';
export { getDashboardStats } from './dashboard/DashboardStatsController.js';
export { getDashboardCommissions } from './dashboard/DashboardCommissionsController.js';
export { getDashboardReferrals } from './dashboard/DashboardReferralsController.js';

// Main dashboard aggregator - combines all sub-controller data
export { getDashboard } from './dashboard/DashboardController.js';
