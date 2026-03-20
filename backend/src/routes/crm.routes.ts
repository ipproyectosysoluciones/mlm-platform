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
  addCommunication,
  getLeadCommunications,
  getUpcomingTasks,
  createLeadValidation,
  updateLeadValidation,
} from '../controllers/CRMController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticateToken);

// Stats
router.get('/stats', asyncHandler(getCRMStats));

// Tasks
router.get('/tasks', asyncHandler(getUpcomingTasks));

// Leads CRUD
router.get('/', asyncHandler(getLeads));
router.get('/:id', asyncHandler(getLeadById));
router.post('/', validate(createLeadValidation), asyncHandler(createLead));
router.put('/:id', validate(updateLeadValidation), asyncHandler(updateLead));
router.delete('/:id', asyncHandler(deleteLead));

// Lead Tasks
router.post('/:leadId/tasks', asyncHandler(createTask));
router.patch('/tasks/:taskId/complete', asyncHandler(completeTask));

// Lead Communications
router.get('/:leadId/communications', asyncHandler(getLeadCommunications));
router.post('/:leadId/communications', asyncHandler(addCommunication));

export default router;
