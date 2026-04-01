/**
 * @fileoverview CRM Routes - Customer Relationship Management API endpoints
 * @description Router for /api/crm endpoints
 * @module routes/crm
 */
import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getCRMStats,
  createTask,
  completeTask,
  importLeads,
  exportLeads,
  addCommunication,
  getLeadCommunications,
  getLeadTasks,
  getUpcomingTasks,
  getAnalyticsReport,
  getCRMAlerts,
  exportAnalyticsReport,
  createLeadValidation,
  updateLeadValidation,
  createTaskValidation,
} from '../../controllers/crm';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /crm/stats:
 *   get:
 *     summary: Obtener estadísticas del CRM / Get CRM statistics
 *     description: Retorna conteos de leads por estado y tareas pendientes.
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', asyncHandler(getCRMStats));

/**
 * @swagger
 * /crm/analytics/report:
 *   get:
 *     summary: Obtener reporte de analítica por período
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/report', asyncHandler(getAnalyticsReport));

/**
 * @swagger
 * /crm/alerts:
 *   get:
 *     summary: Obtener alertas de CRM
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 */
router.get('/alerts', asyncHandler(getCRMAlerts));

/**
 * @swagger
 * /crm/analytics/export:
 *   get:
 *     summary: Exportar reporte de analítica
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/export', asyncHandler(exportAnalyticsReport));

/**
 * @swagger
 * /crm/tasks:
 *   get:
 *     summary: Obtener tareas próximas
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 */
router.get('/tasks', asyncHandler(getUpcomingTasks));

// Leads CRUD
router.get('/', asyncHandler(getLeads));
router.get('/:id', asyncHandler(getLeadById));
router.post('/', validate(createLeadValidation), asyncHandler(createLead));
router.post('/import', asyncHandler(importLeads));
router.get('/export', asyncHandler(exportLeads));
router.put('/:id', validate(updateLeadValidation), asyncHandler(updateLead));
router.delete('/:id', asyncHandler(deleteLead));

// Tasks
router.post('/:leadId/tasks', validate(createTaskValidation), asyncHandler(createTask));
router.patch('/tasks/:taskId/complete', asyncHandler(completeTask));
router.get('/:leadId/tasks', asyncHandler(getLeadTasks));

// Communications
router.get('/:leadId/communications', asyncHandler(getLeadCommunications));
router.post('/:leadId/communications', asyncHandler(addCommunication));

export default router;
