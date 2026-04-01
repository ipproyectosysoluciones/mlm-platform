/**
 * @fileoverview AnalyticsController - CRM analytics and reporting endpoints
 * @description Handles CRM statistics, analytics reports, alerts, and data exports.
 *              Gestiona estadísticas, reportes analíticos, alertas y exportación de datos.
 * @module controllers/crm/AnalyticsController
 * @author MLM Development Team
 */

import { Response } from 'express';
import { crmService } from '../../services/CRMService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Get CRM statistics
 * Obtiene estadísticas de CRM
 *
 * @param req - Authenticated request
 * @param res - Response with CRM stats (total, byStatus, bySource, conversionRate)
 */
export async function getCRMStats(req: AuthenticatedRequest, res: Response) {
  const stats = await crmService.getCRMStats(req.user!.id);
  res.json({ success: true, data: stats });
}

/**
 * Get analytics report by period
 * Obtiene reporte de analítica por período
 *
 * @param req - Query params: period (week, month, quarter, year, custom)
 * @param res - Response with period analytics
 */
export async function getAnalyticsReport(req: AuthenticatedRequest, res: Response) {
  const period = (req.query.period as 'week' | 'month' | 'quarter' | 'year' | 'custom') || 'month';
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  const report = await crmService.getAnalyticsReport(req.user!.id, {
    period,
    dateFrom,
    dateTo,
  });
  res.json({ success: true, data: report });
}

/**
 * Get CRM alerts
 * Obtiene alertas de CRM (leads inactivos, tareas vencidas)
 *
 * @param req - Query params: daysInactive (default 7)
 * @param res - Response with alerts
 */
export async function getCRMAlerts(req: AuthenticatedRequest, res: Response) {
  const daysInactive = req.query.daysInactive ? parseInt(req.query.daysInactive as string) : 7;
  const alerts = await crmService.getCRMAlerts(req.user!.id, daysInactive);
  res.json({ success: true, data: alerts });
}

/**
 * Export analytics report
 * Exporta reporte de analítica a CSV
 *
 * @param req - Query params: period, dateFrom, dateTo
 * @param res - CSV file download
 */
export async function exportAnalyticsReport(req: AuthenticatedRequest, res: Response) {
  const period = (req.query.period as 'week' | 'month' | 'quarter' | 'year' | 'custom') || 'month';
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  const csv = await crmService.exportAnalyticsReport(req.user!.id, {
    period,
    dateFrom,
    dateTo,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=crm-analytics-${new Date().toISOString().split('T')[0]}.csv`
  );
  res.send(csv);
}
