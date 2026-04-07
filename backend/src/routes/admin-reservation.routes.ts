/**
 * @fileoverview Admin Reservation Routes - Admin reservation management endpoints
 * @description Routes for admin CRUD operations on reservations including listing,
 *              creating, updating, cancelling, and confirming reservations.
 *              Rutas para operaciones CRUD de admin en reservas incluyendo listar,
 *              crear, actualizar, cancelar y confirmar reservas.
 * @module routes/admin-reservation.routes
 * @author MLM Development Team
 */
import { Router } from 'express';
import {
  getReservations,
  getReservation,
  createReservation,
  updateReservation,
  cancelReservation,
  confirmReservation,
} from '../controllers/ReservationController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: admin-reservations
 *     description: Admin reservation management / Gestión de reservas (Admin)
 */

/**
 * @swagger
 * /admin/reservations:
 *   get:
 *     summary: List all reservations (admin) / Listar todas las reservas (admin)
 *     description: Admin endpoint to list reservations with filters and pagination.
 *                  Endpoint admin para listar reservas con filtros y paginación.
 *     tags: [admin-reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [property, tour]
 *         description: Filter by reservation type / Filtrar por tipo de reserva
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed, no_show]
 *         description: Filter by status / Filtrar por estado
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID / Filtrar por ID de usuario
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vendor ID / Filtrar por ID de vendedor
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, refunded, failed]
 *         description: Filter by payment status / Filtrar por estado de pago
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Reservation list with pagination / Lista de reservas con paginación
 *       401:
 *         description: Unauthorized / No autorizado
 *       403:
 *         description: Forbidden - not an admin / Prohibido - no es admin
 */
router.get('/', getReservations);

/**
 * @swagger
 * /admin/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID (admin) / Obtener reserva por ID (admin)
 *     tags: [admin-reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation details / Detalles de la reserva
 *       404:
 *         description: Reservation not found / Reserva no encontrada
 */
router.get('/:id', getReservation);

/**
 * @swagger
 * /admin/reservations:
 *   post:
 *     summary: Create reservation (admin) / Crear reserva (admin)
 *     tags: [admin-reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - userId
 *               - guestName
 *               - guestEmail
 *               - totalPrice
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [property, tour]
 *               userId:
 *                 type: string
 *                 format: uuid
 *               guestName:
 *                 type: string
 *               guestEmail:
 *                 type: string
 *                 format: email
 *               totalPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Reservation created / Reserva creada
 *       401:
 *         description: Unauthorized / No autorizado
 */
router.post('/', createReservation);

/**
 * @swagger
 * /admin/reservations/{id}:
 *   put:
 *     summary: Update reservation (admin) / Actualizar reserva (admin)
 *     tags: [admin-reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed, no_show]
 *               adminNotes:
 *                 type: string
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, refunded, failed]
 *               paymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation updated / Reserva actualizada
 *       404:
 *         description: Reservation not found / Reserva no encontrada
 */
router.put('/:id', updateReservation);

/**
 * @swagger
 * /admin/reservations/{id}/cancel:
 *   post:
 *     summary: Cancel reservation / Cancelar reserva
 *     description: Cancels a reservation and restores tour availability if applicable.
 *                  Cancela una reserva y restaura disponibilidad del tour si aplica.
 *     tags: [admin-reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Cancellation reason / Razón de cancelación
 *                 example: "Guest requested cancellation"
 *     responses:
 *       200:
 *         description: Reservation cancelled / Reserva cancelada
 *       404:
 *         description: Reservation not found / Reserva no encontrada
 */
router.post('/:id/cancel', cancelReservation);

/**
 * @swagger
 * /admin/reservations/{id}/confirm:
 *   post:
 *     summary: Confirm reservation / Confirmar reserva
 *     tags: [admin-reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation confirmed / Reserva confirmada
 *       404:
 *         description: Reservation not found / Reserva no encontrada
 */
router.post('/:id/confirm', confirmReservation);

export default router;
