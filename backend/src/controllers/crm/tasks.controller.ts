/**
 * @fileoverview Tasks Controller - Task management endpoints
 * @description Handles CRUD operations for CRM tasks
 * @module controllers/crm/tasks
 */
import { Response } from 'express';
import { body } from 'express-validator';
import { crmService } from '../../services/CRMService';
import { AppError } from '../../middleware/error.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Validation rules for creating a task
 */
export const createTaskValidation = [
  body('title').notEmpty().withMessage('Task title is required'),
  body('type').optional().isIn(['call', 'email', 'meeting', 'follow_up', 'note', 'other']),
  body('description').optional().isString(),
  body('dueDate').optional().isISO8601().withMessage('Valid date is required'),
];

/**
 * Create a task for a lead
 */
export async function createTask(req: AuthenticatedRequest, res: Response) {
  const task = await crmService.createTask({
    leadId: req.params.leadId,
    userId: req.user!.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: task });
}

/**
 * Mark a task as completed
 */
export async function completeTask(req: AuthenticatedRequest, res: Response) {
  const task = await crmService.completeTask(req.params.taskId, req.user!.id);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');
  res.json({ success: true, data: task });
}

/**
 * Get tasks for a lead
 */
export async function getLeadTasks(req: AuthenticatedRequest, res: Response) {
  const tasks = await crmService.getLeadTasks(req.params.leadId, req.user!.id);
  res.json({ success: true, data: tasks });
}

/**
 * Get upcoming tasks
 */
export async function getUpcomingTasks(req: AuthenticatedRequest, res: Response) {
  const tasks = await crmService.getUpcomingTasks(req.user!.id);
  res.json({ success: true, data: tasks });
}
