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

// Static paths FIRST (before :id)
router.get('/stats', asyncHandler(getCRMStats));
router.get('/analytics/report', asyncHandler(getAnalyticsReport));
router.get('/alerts', asyncHandler(getCRMAlerts));
router.get('/analytics/export', asyncHandler(exportAnalyticsReport));
router.get('/tasks', asyncHandler(getUpcomingTasks));
router.post('/import', asyncHandler(importLeads));
router.get('/export', asyncHandler(exportLeads));

// Tasks (static path for task completion)
router.patch('/tasks/:taskId/complete', asyncHandler(completeTask));

// Leads CRUD (must come after static paths)
router.get('/', asyncHandler(getLeads));
router.post('/', validate(createLeadValidation), asyncHandler(createLead));
router.put('/:id', validate(updateLeadValidation), asyncHandler(updateLead));
router.delete('/:id', asyncHandler(deleteLead));

// Dynamic routes with params LAST
router.get('/:id', asyncHandler(getLeadById));

// Lead-specific sub-resources
router.post('/:leadId/tasks', validate(createTaskValidation), asyncHandler(createTask));
router.get('/:leadId/tasks', asyncHandler(getLeadTasks));
router.get('/:leadId/communications', asyncHandler(getLeadCommunications));
router.post('/:leadId/communications', asyncHandler(addCommunication));

export default router;
