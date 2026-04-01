/**
 * @fileoverview Analytics Controller - CRM analytics and reporting endpoints
 * @description Handles analytics reports and data export
 * @module controllers/crm/analytics
 */
import { Response } from 'express';
import { crmService } from '../../services/CRMService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Get analytics report by period
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
 * Export analytics report to CSV
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
