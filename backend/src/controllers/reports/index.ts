/**
 * @fileoverview Reports barrel export
 * @description Re-exports report functions from sub-controllers
 * @module controllers/reports
 *
 * @example
 * // English: Import from sub-controllers
 * import { getCommissionsReport } from '../controllers/reports';
 * import { getAnalyticsReport, exportAnalyticsReport } from '../controllers/reports';
 *
 * // Español: Importar desde sub-controladores
 * import { getCommissionsReport } from '../controllers/reports';
 * import { getAnalyticsReport, exportAnalyticsReport } from '../controllers/reports';
 */

// Admin - StatsController (commissions report)
export { getCommissionsReport } from '../admin/StatsController';

// CRM - AnalyticsController (analytics reports)
export { getAnalyticsReport, exportAnalyticsReport } from '../crm/AnalyticsController';
