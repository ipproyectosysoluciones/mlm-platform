/**
 * @fileoverview Reservation Routes - Public reservation endpoints
 * @description Routes for creating reservations and retrieving a single reservation
 *              without requiring admin authentication.
 *              Rutas para crear reservas y obtener una reserva individual
 *              sin requerir autenticación de administrador.
 * @module routes/reservation.routes
 * @author MLM Development Team
 */
import { Router } from 'express';
import { createReservation, getReservation } from '../controllers/ReservationController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: reservations
 *     description: Unified bookings for properties and tours / Reservas unificadas para propiedades y tours
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a reservation / Crear una reserva
 *     description: Public endpoint to create a property or tour reservation.
 *                  Endpoint público para crear una reserva de propiedad o tour.
 *     tags: [reservations]
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
 *                 example: "property"
 *               userId:
 *                 type: string
 *                 format: uuid
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *                 description: Required when type=property / Requerido cuando type=property
 *               checkIn:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-01"
 *               checkOut:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-07"
 *               tourPackageId:
 *                 type: string
 *                 format: uuid
 *                 description: Required when type=tour / Requerido cuando type=tour
 *               tourDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-15"
 *               groupSize:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               guestName:
 *                 type: string
 *                 maxLength: 200
 *                 example: "John Doe"
 *               guestEmail:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               guestPhone:
 *                 type: string
 *                 maxLength: 50
 *               totalPrice:
 *                 type: number
 *                 minimum: 0
 *                 example: 500.00
 *               currency:
 *                 type: string
 *                 example: "USD"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reservation created / Reserva creada
 *       400:
 *         description: Validation error / Error de validación
 *       500:
 *         description: Server error / Error del servidor
 */
router.post('/', createReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Get reservation by ID / Obtener reserva por ID
 *     description: Public endpoint to retrieve reservation details.
 *                  Endpoint público para obtener los detalles de una reserva.
 *     tags: [reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID / UUID de la reserva
 *     responses:
 *       200:
 *         description: Reservation details / Detalles de la reserva
 *       404:
 *         description: Reservation not found / Reserva no encontrada
 */
router.get('/:id', getReservation);

export default router;
