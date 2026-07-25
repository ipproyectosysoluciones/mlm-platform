/**
 * @fileoverview Internal webhook routes — for n8n and internal services
 * @description Protected routes for internal service-to-service communication.
 *              All routes require the X-Internal-Secret header.
 *              Rutas protegidas para comunicación interna entre servicios.
 *              Todas las rutas requieren el encabezado X-Internal-Secret.
 * @module routes/webhook-internal.routes
 * @author MLM Development Team
 *
 * @example
 * // English: Call from n8n to confirm a reservation after payment
 * POST /webhooks/internal/reservation-confirm
 * Headers: { 'X-Internal-Secret': '<secret>' }
 * Body: { "reservationId": "uuid" }
 *
 * // Español: Llamada desde n8n para confirmar reserva luego del pago
 * POST /webhooks/internal/reservation-confirm
 * Headers: { 'X-Internal-Secret': '<secreto>' }
 * Body: { "reservationId": "uuid" }
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ReservationService } from '../services/ReservationService.js';
import { handleN8nAction } from '../controllers/N8nWebhookController.js';

const router = Router();

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Middleware to verify internal webhook secret
 * Middleware para verificar el secreto de webhook interno
 *
 * @param req - Express request / Solicitud Express
 * @param res - Express response / Respuesta Express
 * @param next - Next middleware / Siguiente middleware
 */
const verifyInternalSecret = (req: Request, res: Response, next: NextFunction): void => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_WEBHOOK_SECRET) {
    res.status(401).json({ message: 'Unauthorized / No autorizado' });
    return;
  }
  next();
};

// ============================================
// ROUTES / RUTAS
// ============================================

/**
 * @swagger
 * /webhooks/internal/reservation-confirm:
 *   post:
 *     summary: Confirm reservation / Confirmar reserva
 *     description: Confirms a reservation after payment verification (called by n8n)
 *     tags: [Webhook Internal]
 *     security:
 *       - headerSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationId
 *             properties:
 *               reservationId:
 *                 type: string
 *                 format: uuid
 *                 description: Reservation UUID / UUID de la reserva
 *     responses:
 *       200:
 *         description: Reservation confirmed / Reserva confirmada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reservationId:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Missing reservationId / reservationId requerido
 *       401:
 *         description: Missing or invalid X-Internal-Secret / Secreto interno faltante o inválido
 *       500:
 *         description: Internal error / Error interno
 */
router.post(
  '/reservation-confirm',
  verifyInternalSecret,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reservationId } = req.body;

      if (!reservationId) {
        res.status(400).json({ message: 'reservationId is required' });
        return;
      }

      const reservationService = new ReservationService();
      const reservation = await reservationService.confirm(reservationId);

      res.json({
        success: true,
        reservationId: reservation.id,
        status: reservation.status,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /webhooks/internal/n8n-action:
 *   post:
 *     summary: Process n8n workflow action / Procesar acción de workflow n8n
 *     description: Receives and persists an n8n workflow execution action (idempotent)
 *     tags: [Webhook Internal]
 *     security:
 *       - headerSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leadId
 *               - workflowName
 *               - actionType
 *               - n8nExecutionId
 *               - status
 *             properties:
 *               leadId:
 *                 type: string
 *                 format: uuid
 *                 description: Lead UUID / UUID del lead
 *               workflowName:
 *                 type: string
 *                 description: n8n workflow name / Nombre del workflow n8n
 *               actionType:
 *                 type: string
 *                 description: Action type / Tipo de acción
 *               n8nExecutionId:
 *                 type: string
 *                 description: n8n execution ID / ID de ejecución de n8n
 *               status:
 *                 type: string
 *                 description: Execution status / Estado de la ejecución
 *               payload:
 *                 type: object
 *                 description: Optional additional data / Datos adicionales opcionales
 *               errorMessage:
 *                 type: string
 *                 description: Error message if failed / Mensaje de error si falló
 *     responses:
 *       201:
 *         description: Execution recorded / Ejecución registrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 executionId:
 *                   type: string
 *                 leadId:
 *                   type: string
 *                 idempotent:
 *                   type: boolean
 *                   description: true if execution was already recorded / true si ya estaba registrada
 *       200:
 *         description: Idempotent — execution already recorded / Idempotente — ejecución ya registrada
 *       400:
 *         description: Missing required fields / Campos requeridos faltantes
 *       401:
 *         description: Missing or invalid X-Internal-Secret / Secreto interno faltante o inválido
 *       422:
 *         description: Unknown lead / Lead desconocido
 */
router.post('/n8n-action', verifyInternalSecret, handleN8nAction);

export default router;
