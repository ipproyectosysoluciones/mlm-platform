/**
 * @fileoverview TaskController - Task management endpoints
 * @description Handles task creation, completion, and retrieval for CRM leads.
 *              Gestiona la creación, completado y recuperación de tareas para leads.
 * @module controllers/crm/TaskController
 * @author MLM Development Team
 */

import { Response } from 'express';
import { body } from 'express-validator';
import { crmService } from '../../services/CRMService';
import { AppError } from '../../middleware/error.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Validation rules for creating a task
 * Reglas de validación para crear una tarea
 */
export const createTaskValidation = [
  body('title').notEmpty().withMessage('Task title is required'),
  body('type').optional().isIn(['call', 'email', 'meeting', 'follow_up', 'note', 'other']),
  body('description').optional().isString(),
  body('dueDate').optional().isISO8601().withMessage('Valid date is required'),
];

/**
 * Create a task for a lead
 * Crea una tarea para un lead
 *
 * @param req - Path params: leadId, Body: type, title, description, dueDate
 * @param res - Response with created task
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
 * Marca una tarea como completada
 *
 * @param req - Path params: taskId
 * @param res - Response with completed task
 * @throws {AppError} 404 - If task not found
 */
export async function completeTask(req: AuthenticatedRequest, res: Response) {
  const task = await crmService.completeTask(req.params.taskId, req.user!.id);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');
  res.json({ success: true, data: task });
}

/**
 * Get tasks for a lead
 * Obtiene las tareas de un lead
 *
 * @param req - Path params: leadId
 * @param res - Response with tasks list
 */
export async function getLeadTasks(req: AuthenticatedRequest, res: Response) {
  const tasks = await crmService.getLeadTasks(req.params.leadId, req.user!.id);
  res.json({ success: true, data: tasks });
}

/**
 * Get upcoming tasks
 * Obtiene tareas próximas
 *
 * @param req - Authenticated request
 * @param res - Response with upcoming tasks (limit default 10)
 */
export async function getUpcomingTasks(req: AuthenticatedRequest, res: Response) {
  const tasks = await crmService.getUpcomingTasks(req.user!.id);
  res.json({ success: true, data: tasks });
}
