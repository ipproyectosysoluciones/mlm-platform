/**
 * @fileoverview ReservationController - Reservation booking endpoints
 * @description Controller for public reservation creation and admin CRUD operations.
 *              Public routes: create, get by ID.
 *              Admin routes: list, create, update, cancel, confirm.
 *              Rutas públicas: crear, obtener por ID.
 *              Rutas admin: listar, crear, actualizar, cancelar, confirmar.
 * @module controllers/ReservationController
 * @author MLM Development Team
 *
 * @example
 * // English: Create a property reservation
 * POST /api/reservations
 *
 * // Español: Crear una reserva de propiedad
 * POST /api/reservations
 */
import { Request, Response } from 'express';
import { reservationService } from '../services/ReservationService';
import { logger } from '../utils/logger';
import { hasStatusCode, getErrorMessage } from '../utils/HttpError.js';

// ============================================
// HANDLERS
// ============================================

/**
 * GET /api/admin/reservations — Admin: list all reservations with filters
 * GET /api/admin/reservations — Admin: listar todas las reservas con filtros
 *
 * @route GET /api/admin/reservations
 * @access Admin
 */
export const getReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, userId, vendorId, paymentStatus, page, limit } = req.query as Record<
      string,
      string | undefined
    >;

    const result = await reservationService.findAll({
      type: type as 'property' | 'tour' | undefined,
      status,
      userId,
      vendorId,
      paymentStatus,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.reservations,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to get reservations');
    const statusCode = hasStatusCode(error) ? error.statusCode : 500;
    logger.error({ err: error }, 'Get reservations error');
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message,
      },
    });
  }
};

/**
 * GET /api/reservations/:id — Get reservation by ID
 * GET /api/reservations/:id — Obtener reserva por ID
 *
 * @route GET /api/reservations/:id
 * @access Public
 */
export const getReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await reservationService.findById(req.params.id);

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to get reservation');
    const statusCode = hasStatusCode(error) ? error.statusCode : 500;
    logger.error({ err: error }, 'Get reservation error');
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message,
      },
    });
  }
};

/**
 * POST /api/reservations — Create a new reservation (public)
 * POST /api/reservations — Crear una nueva reserva (público)
 *
 * @route POST /api/reservations
 * @access Public
 */
export const createReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await reservationService.create(req.body);

    res.status(201).json({
      success: true,
      data: reservation,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to create reservation');
    const statusCode = hasStatusCode(error) ? error.statusCode : 500;
    logger.error({ err: error }, 'Create reservation error');
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message,
      },
    });
  }
};

/**
 * PUT /api/admin/reservations/:id — Admin: update a reservation
 * PUT /api/admin/reservations/:id — Admin: actualizar una reserva
 *
 * @route PUT /api/admin/reservations/:id
 * @access Admin
 */
export const updateReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await reservationService.update(req.params.id, req.body);

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to update reservation');
    const statusCode = hasStatusCode(error) ? error.statusCode : 500;
    logger.error({ err: error }, 'Update reservation error');
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message,
      },
    });
  }
};

/**
 * POST /api/admin/reservations/:id/cancel — Admin: cancel a reservation
 * POST /api/admin/reservations/:id/cancel — Admin: cancelar una reserva
 *
 * @route POST /api/admin/reservations/:id/cancel
 * @access Admin
 */
export const cancelReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await reservationService.cancel(req.params.id, req.body.reason);

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to cancel reservation');
    const statusCode = hasStatusCode(error) ? error.statusCode : 500;
    logger.error({ err: error }, 'Cancel reservation error');
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message,
      },
    });
  }
};

/**
 * POST /api/admin/reservations/:id/confirm — Admin: confirm a reservation
 * POST /api/admin/reservations/:id/confirm — Admin: confirmar una reserva
 *
 * @route POST /api/admin/reservations/:id/confirm
 * @access Admin
 */
export const confirmReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await reservationService.confirm(req.params.id);

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to confirm reservation');
    const statusCode = hasStatusCode(error) ? error.statusCode : 500;
    logger.error({ err: error }, 'Confirm reservation error');
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message,
      },
    });
  }
};
