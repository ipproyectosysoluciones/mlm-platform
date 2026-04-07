/**
 * @fileoverview ReservationService - Business logic for unified booking system
 * @description Service layer for CRUD operations on reservations (properties and tours).
 *              Handles pagination, filtering, tour availability tracking, and status transitions.
 *              Capa de servicios para operaciones CRUD en reservas (propiedades y tours).
 *              Gestiona paginación, filtrado, disponibilidad de tours y transiciones de estado.
 * @module services/ReservationService
 * @author MLM Development Team
 *
 * @example
 * // English: Find all pending property reservations
 * const result = await reservationService.findAll({ type: 'property', status: 'pending' });
 *
 * // Español: Buscar todas las reservas de propiedad pendientes
 * const result = await reservationService.findAll({ type: 'property', status: 'pending' });
 */
import { WhereOptions } from 'sequelize';
import { Reservation, Property, TourPackage, TourAvailability, User } from '../models';
import type { ReservationAttributes, ReservationCreationAttributes } from '../models/Reservation';
import { CalendarService } from './CalendarService';

// ============================================
// TYPES
// ============================================

/**
 * Input parameters for listing reservations
 * Parámetros de entrada para listar reservas
 */
export interface ReservationFilters {
  /** Page number (1-based) / Número de página (base 1) */
  page?: number;
  /** Page size / Tamaño de página */
  limit?: number;
  /** Reservation type filter / Filtro de tipo de reserva */
  type?: 'property' | 'tour';
  /** Status filter / Filtro de estado */
  status?: string;
  /** Filter by user ID / Filtrar por ID de usuario */
  userId?: string;
  /** Filter by vendor ID / Filtrar por ID de vendedor */
  vendorId?: string;
  /** Filter by payment status / Filtrar por estado de pago */
  paymentStatus?: string;
}

/**
 * Paginated result for reservations
 * Resultado paginado de reservas
 */
export interface ReservationPaginatedResult {
  reservations: Reservation[];
  total: number;
  page: number;
  totalPages: number;
}

// ============================================
// SERVICE CLASS
// ============================================

/**
 * ReservationService - Handles all reservation business logic
 * ReservationService - Gestiona toda la lógica de negocio de reservas
 */
export class ReservationService {
  /**
   * List reservations with optional filters and pagination
   * Listar reservas con filtros opcionales y paginación
   *
   * @param params - Pagination and filter parameters / Parámetros de paginación y filtros
   * @returns Paginated list of reservations with includes / Lista paginada de reservas con includes
   */
  async findAll(params: ReservationFilters = {}): Promise<ReservationPaginatedResult> {
    const {
      type,
      status,
      userId,
      vendorId,
      paymentStatus,
      page = 1,
      limit: rawLimit = 20,
    } = params;

    // Enforce maximum limit / Aplicar límite máximo
    const limit = Math.min(rawLimit, 100);
    const offset = (page - 1) * limit;

    // Build where clause / Construir cláusula where
    const where: WhereOptions<ReservationAttributes> = {};

    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status as ReservationAttributes['status'];
    }
    if (userId) {
      where.userId = userId;
    }
    if (vendorId) {
      where.vendorId = vendorId;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus as ReservationAttributes['paymentStatus'];
    }

    // Build includes based on type filter / Construir includes según el tipo
    const include: any[] = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName'],
      },
    ];

    if (!type || type === 'property') {
      include.push({
        model: Property,
        as: 'property',
        required: false,
      });
    }

    if (!type || type === 'tour') {
      include.push({
        model: TourPackage,
        as: 'tourPackage',
        required: false,
      });
    }

    const { rows, count } = await Reservation.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    return {
      reservations: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Find a reservation by its primary key, including related models
   * Buscar una reserva por su clave primaria, incluyendo modelos relacionados
   *
   * @param id - Reservation UUID / UUID de la reserva
   * @returns Reservation with includes / Reserva con includes
   * @throws { statusCode: 404, code: 'RESERVATION_NOT_FOUND', message: string } when not found
   */
  async findById(id: string): Promise<Reservation> {
    const reservation = await Reservation.findByPk(id, {
      include: [
        {
          model: Property,
          as: 'property',
          required: false,
        },
        {
          model: TourPackage,
          as: 'tourPackage',
          required: false,
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    if (!reservation) {
      throw {
        statusCode: 404,
        code: 'RESERVATION_NOT_FOUND',
        message: 'Reservation not found',
      };
    }

    return reservation;
  }

  /**
   * Create a new reservation and update tour availability if applicable
   * Crear una nueva reserva y actualizar disponibilidad del tour si aplica
   *
   * @param data - Reservation creation data / Datos de creación de reserva
   * @returns Created reservation / Reserva creada
   */
  async create(data: ReservationCreationAttributes): Promise<Reservation> {
    const reservation = await Reservation.create(data as ReservationAttributes);

    // Update TourAvailability if this is a tour reservation
    // Actualizar TourAvailability si es una reserva de tour
    if (data.type === 'tour' && data.tourPackageId && data.tourDate) {
      const groupSize = data.groupSize ?? 1;

      await TourAvailability.increment('bookedSpots', {
        by: groupSize,
        where: {
          tourPackageId: data.tourPackageId,
          date: data.tourDate,
        },
      });
    }

    return reservation;
  }

  /**
   * Update a reservation by ID
   * Actualizar una reserva por ID
   *
   * @param id - Reservation UUID / UUID de la reserva
   * @param data - Partial update data / Datos parciales de actualización
   * @returns Updated reservation / Reserva actualizada
   * @throws { statusCode: 404, code: 'RESERVATION_NOT_FOUND', message: string } when not found
   */
  async update(id: string, data: Partial<ReservationAttributes>): Promise<Reservation> {
    const reservation = await this.findById(id);
    await reservation.update(data);
    return reservation;
  }

  /**
   * Cancel a reservation and restore tour availability if applicable
   * Cancelar una reserva y restaurar disponibilidad del tour si aplica
   *
   * @param id - Reservation UUID / UUID de la reserva
   * @param reason - Optional cancellation reason / Razón de cancelación opcional
   * @returns Cancelled reservation / Reserva cancelada
   * @throws { statusCode: 404, code: 'RESERVATION_NOT_FOUND', message: string } when not found
   */
  async cancel(id: string, reason?: string): Promise<Reservation> {
    const reservation = await this.findById(id);

    // Build admin notes / Construir notas de admin
    let adminNotes = reservation.adminNotes || '';
    if (reason) {
      const prefix = adminNotes ? `${adminNotes}\n` : '';
      adminNotes = `${prefix}Cancelled: ${reason}`;
    }

    reservation.status = 'cancelled';
    if (reason) {
      reservation.adminNotes = adminNotes;
    }
    await reservation.save();

    // Restore TourAvailability if it was a tour reservation
    // Restaurar TourAvailability si era una reserva de tour
    if (reservation.type === 'tour' && reservation.tourPackageId && reservation.tourDate) {
      const groupSize = reservation.groupSize ?? 1;

      await TourAvailability.decrement('bookedSpots', {
        by: groupSize,
        where: {
          tourPackageId: reservation.tourPackageId,
          date: reservation.tourDate,
        },
      });
    }

    return reservation;
  }

  /**
   * Confirm a reservation (set status to 'confirmed')
   * Confirmar una reserva (establecer estado a 'confirmed')
   *
   * @param id - Reservation UUID / UUID de la reserva
   * @returns Confirmed reservation / Reserva confirmada
   * @throws { statusCode: 404, code: 'RESERVATION_NOT_FOUND', message: string } when not found
   */
  async confirm(id: string): Promise<Reservation> {
    const reservation = await this.findById(id);
    reservation.status = 'confirmed';
    await reservation.save();

    // Non-blocking calendar sync — don't await
    // Sincronización de calendario no bloqueante — no usar await
    const calendarService = new CalendarService();
    const payload = {
      reservationId: reservation.id,
      type: reservation.type,
      guestName: reservation.guestName,
      guestEmail: reservation.guestEmail,
      guestPhone: reservation.guestPhone ?? null,
      title:
        reservation.type === 'property'
          ? ((reservation as any).property?.title ?? 'Propiedad')
          : ((reservation as any).tourPackage?.title ?? 'Tour'),
      startDate:
        reservation.type === 'property'
          ? (reservation.checkIn ?? '')
          : (reservation.tourDate ?? ''),
      endDate: reservation.type === 'property' ? (reservation.checkOut ?? null) : null,
      notes: reservation.notes ?? null,
      vendorId: reservation.vendorId ?? null,
    };
    calendarService.notifyReservationConfirmed(payload).catch((err: unknown) => {
      console.error('[ReservationService] Calendar sync error:', err);
    });

    return reservation;
  }
}

/**
 * Singleton instance of ReservationService
 * Instancia singleton de ReservationService
 */
export const reservationService = new ReservationService();
