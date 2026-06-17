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
import { ReservationService } from '../services/ReservationService';
import { handleN8nAction } from '../controllers/N8nWebhookController';

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
 * POST /webhooks/internal/reservation-confirm
 * @description Confirm a reservation (called by n8n after payment verification)
 *              Confirmar una reserva (llamado por n8n después de verificar el pago)
 * @security X-Internal-Secret header required / Requiere encabezado X-Internal-Secret
 * @body {{ reservationId: string }} Reservation UUID / UUID de la reserva
 * @returns {{ success: boolean, reservationId: string, status: string }}
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
 * POST /webhooks/internal/n8n-action
 * @description Process inbound n8n workflow action — idempotent execution persistence
 *              Procesar acción de workflow n8n entrante — persistencia idempotente de ejecución
 * @security X-Internal-Secret header required / Requiere encabezado X-Internal-Secret
 * @body {{ leadId: string, workflowName: string, actionType: string, n8nExecutionId: string,
 *          status: string, payload?: object, errorMessage?: string }}
 * @returns 201 {{ success: true, executionId: string, leadId: string, idempotent: false }}
 * @returns 200 {{ success: true, executionId: string, leadId: string, idempotent: true }}
 * @returns 400 {{ success: false, error: string }} — missing required fields
 * @returns 422 {{ success: false, error: string }} — unknown lead
 */
router.post('/n8n-action', verifyInternalSecret, handleN8nAction);

export default router;
