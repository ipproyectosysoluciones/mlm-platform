/**
 * CRM Routes - Gestión de Leads, Tareas y Comunicaciones
 * CRM Routes - Leads, Tasks, and Communications Management
 *
 * Endpoints para manejar prospectos, tareas y seguimiento de clientes.
 * Endpoints for managing prospects, tasks, and client follow-up.
 *
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
  addCommunication,
  getLeadCommunications,
  getUpcomingTasks,
  createLeadValidation,
  updateLeadValidation,
  createTaskValidation,
} from '../controllers/CRMController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

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
 *     responses:
 *       200:
 *         description: Estadísticas del CRM / CRM statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLeads:
 *                   type: integer
 *                   description: Total de leads / Total leads
 *                 leadsByStatus:
 *                   type: object
 *                   description: Leads por estado / Leads by status
 *                 pendingTasks:
 *                   type: integer
 *                   description: Tareas pendientes / Pending tasks
 */
router.get('/stats', asyncHandler(getCRMStats));

/**
 * @swagger
 * /crm/tasks:
 *   get:
 *     summary: Obtener tareas próximas / Get upcoming tasks
 *     description: Retorna lista de tareas pendientes ordenadas por fecha.
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filtrar por estado / Filter by status
 *     responses:
 *       200:
 *         description: Lista de tareas / Tasks list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       status: { type: string }
 *                       priority: { type: string }
 *                       dueDate: { type: string }
 */
router.get('/tasks', asyncHandler(getUpcomingTasks));

/**
 * @swagger
 * /crm:
 *   get:
 *     summary: Obtener lista de leads / Get leads list
 *     description: Retorna lista paginada de leads con filtros opcionales.
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, contacted, qualified, proposal, negotiation, won, lost]
 *         description: Filtrar por estado / Filter by status
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [website, referral, social, landing_page, manual, other]
 *         description: Filtrar por fuente / Filter by source
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, email o empresa / Search by name, email or company
 *       - in: query
 *         name: createdAtFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha desde de creación / Creation date from
 *       - in: query
 *         name: createdAtTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha hasta de creación / Creation date to
 *       - in: query
 *         name: valueMin
 *         schema:
 *           type: number
 *         description: Valor mínimo del lead / Minimum lead value
 *       - in: query
 *         name: valueMax
 *         schema:
 *           type: number
 *         description: Valor máximo del lead / Maximum lead value
 *       - in: query
 *         name: nextFollowUpFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha desde de próximo seguimiento / Next follow-up from
 *       - in: query
 *         name: nextFollowUpTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha hasta de próximo seguimiento / Next follow-up to
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página / Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Límite de resultados / Results limit
 *     responses:
 *       200:
 *         description: Lista de leads / Leads list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *                 count:
 *                   type: integer
 */
router.get('/', asyncHandler(getLeads));

/**
 * @swagger
 * /crm/{id}:
 *   get:
 *     summary: Obtener lead por ID / Get lead by ID
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del lead / Lead ID
 *     responses:
 *       200:
 *         description: Datos del lead / Lead data
 *       404:
 *         description: Lead no encontrado / Lead not found
 */
router.get('/:id', asyncHandler(getLeadById));

/**
 * @swagger
 * /crm:
 *   post:
 *     summary: Crear nuevo lead / Create new lead
 *     description: Crea un nuevo prospecto en el CRM.
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del lead / Lead name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del lead / Lead email
 *               phone:
 *                 type: string
 *                 description: Teléfono (opcional) / Phone (optional)
 *               source:
 *                 type: string
 *                 description: Fuente del lead (opcional) / Lead source (optional)
 *               notes:
 *                 type: string
 *                 description: Notas adicionales (opcional) / Additional notes (optional)
 *     responses:
 *       201:
 *         description: Lead creado / Lead created
 *       400:
 *         description: Datos inválidos / Invalid data
 */
router.post('/', validate(createLeadValidation), asyncHandler(createLead));

/**
 * @swagger
 * /crm/import:
 *   post:
 *     summary: Importar leads desde CSV / Import leads from CSV
 *     description: Importa múltiples leads desde contenido CSV
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               csv:
 *                 type: string
 *                 description: Contenido del archivo CSV / CSV file content
 *     responses:
 *       200:
 *         description: Resultados de importación / Import results
 *       400:
 *         description: CSV inválido / Invalid CSV
 */
router.post('/import', asyncHandler(importLeads));

/**
 * @swagger
 * /crm/{id}:
 *   put:
 *     summary: Actualizar lead / Update lead
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [new, contacted, qualified, converted, lost]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead actualizado / Lead updated
 *       404:
 *         description: Lead no encontrado / Lead not found
 */
router.put('/:id', validate(updateLeadValidation), asyncHandler(updateLead));

/**
 * @swagger
 * /crm/{id}:
 *   delete:
 *     summary: Eliminar lead / Delete lead
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead eliminado / Lead deleted
 *       404:
 *         description: Lead no encontrado / Lead not found
 */
router.delete('/:id', asyncHandler(deleteLead));

/**
 * @swagger
 * /crm/{leadId}/tasks:
 *   post:
 *     summary: Crear tarea para lead / Create task for lead
 *     description: Asocia una nueva tarea a un lead específico.
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del lead / Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título de la tarea / Task title
 *               description:
 *                 type: string
 *                 description: Descripción (opcional) / Description (optional)
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de vencimiento (opcional) / Due date (optional)
 *     responses:
 *       201:
 *         description: Tarea creada / Task created
 */
router.post('/:leadId/tasks', validate(createTaskValidation), asyncHandler(createTask));

/**
 * @swagger
 * /crm/tasks/{taskId}/complete:
 *   patch:
 *     summary: Completar tarea / Complete task
 *     description: Marca una tarea como completada.
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarea / Task ID
 *     responses:
 *       200:
 *         description: Tarea completada / Task completed
 *       404:
 *         description: Tarea no encontrada / Task not found
 */
router.patch('/tasks/:taskId/complete', asyncHandler(completeTask));

/**
 * @swagger
 * /crm/{leadId}/communications:
 *   get:
 *     summary: Obtener comunicaciones del lead / Get lead communications
 *     description: Retorna historial de comunicaciones de un lead.
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de comunicaciones / Communications list
 */
router.get('/:leadId/communications', asyncHandler(getLeadCommunications));

/**
 * @swagger
 * /crm/{leadId}/communications:
 *   post:
 *     summary: Agregar comunicación / Add communication
 *     description: Registra una nueva comunicación con el lead.
 *     tags: [crm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [call, email, meeting, note]
 *                 description: Tipo de comunicación / Communication type
 *               content:
 *                 type: string
 *                 description: Contenido de la comunicación / Communication content
 *     responses:
 *       201:
 *         description: Comunicación registrada / Communication logged
 */
router.post('/:leadId/communications', asyncHandler(addCommunication));

export default router;
