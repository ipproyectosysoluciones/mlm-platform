/**
 * @fileoverview Unit tests for ReservationService
 * @description Tests for ReservationService CRUD operations including:
 *              - Pagination, type filter, status filter, userId filter, max limit enforcement
 *              - Find by ID success and not found (404)
 *              - Create property reservation, create tour reservation (TourAvailability.increment)
 *              - Update success, update not found
 *              - Cancel success (TourAvailability.decrement for tours), cancel not found
 *              - Confirm success, confirm not found
 * @module __tests__/ReservationService
 */

// Mock sequelize before importing models
jest.mock('../config/database', () => {
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };

  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
      query: jest.fn(),
      sync: jest.fn().mockResolvedValue({}),
      authenticate: jest.fn().mockResolvedValue(undefined),
    },
    resetSequelize: jest.fn(),
  };
});

// Mock all models
jest.mock('../models', () => ({
  Reservation: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  },
  Property: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  TourPackage: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  TourAvailability: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  Vendor: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
}));

import { ReservationService } from '../services/ReservationService';
import { Reservation, TourAvailability } from '../models';

describe('ReservationService', () => {
  let reservationService: ReservationService;

  // Mock property reservation
  const mockPropertyReservation = {
    id: 'reservation-1',
    type: 'property' as const,
    status: 'pending' as const,
    userId: 'user-1',
    vendorId: null,
    propertyId: 'property-1',
    checkIn: '2026-07-01',
    checkOut: '2026-07-07',
    tourPackageId: null,
    tourDate: null,
    groupSize: 1,
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    guestPhone: '+1234567890',
    totalPrice: 700.0,
    currency: 'USD',
    paymentStatus: 'pending' as const,
    paymentId: null,
    notes: null,
    adminNotes: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock tour reservation
  const mockTourReservation = {
    id: 'reservation-2',
    type: 'tour' as const,
    status: 'pending' as const,
    userId: 'user-2',
    vendorId: 'vendor-1',
    propertyId: null,
    checkIn: null,
    checkOut: null,
    tourPackageId: 'tour-1',
    tourDate: '2026-08-15',
    groupSize: 3,
    guestName: 'Jane Smith',
    guestEmail: 'jane@example.com',
    guestPhone: null,
    totalPrice: 450.0,
    currency: 'USD',
    paymentStatus: 'paid' as const,
    paymentId: 'paypal-abc123',
    notes: 'Vegetarian meals please',
    adminNotes: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reservationService = new ReservationService();
  });

  // ============================================================
  // findAll
  // ============================================================
  describe('findAll', () => {
    /**
     * Test 1: Default pagination params
     * Verifies default page=1, limit=20 are applied
     */
    it('should return paginated reservations with default params', async () => {
      const mockResult = {
        rows: [mockPropertyReservation, mockTourReservation],
        count: 2,
      };
      (Reservation.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await reservationService.findAll();

      expect(result.total).toBe(2);
      expect(result.reservations).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(Reservation.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0,
        })
      );
    });

    /**
     * Test 2: Filter by type
     * Verifies that type filter is correctly passed to query
     */
    it('should filter reservations by type', async () => {
      const mockResult = { rows: [mockPropertyReservation], count: 1 };
      (Reservation.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await reservationService.findAll({ type: 'property' });

      expect(Reservation.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'property',
          }),
        })
      );
    });

    /**
     * Test 3: Filter by status
     * Verifies that status filter is correctly passed to query
     */
    it('should filter reservations by status', async () => {
      const mockResult = { rows: [mockTourReservation], count: 1 };
      (Reservation.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await reservationService.findAll({ status: 'confirmed' });

      expect(Reservation.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'confirmed',
          }),
        })
      );
    });

    /**
     * Test 4: Filter by userId
     * Verifies that userId filter is correctly passed to query
     */
    it('should filter reservations by userId', async () => {
      const mockResult = { rows: [mockPropertyReservation], count: 1 };
      (Reservation.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await reservationService.findAll({ userId: 'user-1' });

      expect(Reservation.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
        })
      );
    });

    /**
     * Test 5: Enforce max limit of 100
     * Verifies limit is capped at 100 regardless of input
     */
    it('should enforce maximum limit of 100', async () => {
      const mockResult = { rows: [], count: 0 };
      (Reservation.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await reservationService.findAll({ page: 1, limit: 999 });

      expect(Reservation.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
    });

    /**
     * Test 6: Correct ordering
     * Verifies results are ordered by created_at DESC
     */
    it('should order results by created_at descending', async () => {
      const mockResult = { rows: [], count: 0 };
      (Reservation.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await reservationService.findAll();

      expect(Reservation.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['created_at', 'DESC']],
        })
      );
    });
  });

  // ============================================================
  // findById
  // ============================================================
  describe('findById', () => {
    /**
     * Test 7: findById success
     * Verifies that a found reservation is returned
     */
    it('should return reservation when found', async () => {
      (Reservation.findByPk as jest.Mock).mockResolvedValue(mockPropertyReservation);

      const result = await reservationService.findById('reservation-1');

      expect(result).toEqual(mockPropertyReservation);
      expect(Reservation.findByPk).toHaveBeenCalledWith(
        'reservation-1',
        expect.objectContaining({ include: expect.any(Array) })
      );
    });

    /**
     * Test 8: findById not found → throws 404
     * Verifies proper error object when reservation doesn't exist
     */
    it('should throw 404 error when reservation not found', async () => {
      (Reservation.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(reservationService.findById('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
        code: 'RESERVATION_NOT_FOUND',
      });
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe('create', () => {
    /**
     * Test 9: Create property reservation
     * Verifies that a property reservation is created, TourAvailability NOT called
     */
    it('should create a property reservation without calling TourAvailability', async () => {
      (Reservation.create as jest.Mock).mockResolvedValue(mockPropertyReservation);

      const inputData = {
        type: 'property' as const,
        userId: 'user-1',
        propertyId: 'property-1',
        checkIn: '2026-07-01',
        checkOut: '2026-07-07',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        totalPrice: 700.0,
      };

      const result = await reservationService.create(inputData);

      expect(result).toEqual(mockPropertyReservation);
      expect(Reservation.create).toHaveBeenCalledWith(expect.objectContaining(inputData));
      expect(TourAvailability.increment).not.toHaveBeenCalled();
    });

    /**
     * Test 10: Create tour reservation
     * Verifies TourAvailability.increment is called with correct params
     */
    it('should create a tour reservation and increment TourAvailability bookedSpots', async () => {
      (Reservation.create as jest.Mock).mockResolvedValue(mockTourReservation);
      (TourAvailability.increment as jest.Mock).mockResolvedValue([]);

      const inputData = {
        type: 'tour' as const,
        userId: 'user-2',
        tourPackageId: 'tour-1',
        tourDate: '2026-08-15',
        groupSize: 3,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        totalPrice: 450.0,
      };

      const result = await reservationService.create(inputData);

      expect(result).toEqual(mockTourReservation);
      expect(TourAvailability.increment).toHaveBeenCalledWith('bookedSpots', {
        by: 3,
        where: {
          tourPackageId: 'tour-1',
          date: '2026-08-15',
        },
      });
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe('update', () => {
    /**
     * Test 11: Update success
     * Verifies reservation is updated and returned
     */
    it('should update a reservation correctly', async () => {
      const updateMock = jest.fn().mockResolvedValue(undefined);
      const mockReservation = { ...mockPropertyReservation, update: updateMock };
      (Reservation.findByPk as jest.Mock).mockResolvedValue(mockReservation);

      const updateData = { status: 'confirmed' as const, adminNotes: 'Verified guest ID' };
      await reservationService.update('reservation-1', updateData);

      expect(updateMock).toHaveBeenCalledWith(updateData);
    });

    /**
     * Test 12: Update not found → throws 404
     * Verifies 404 is thrown when updating non-existent reservation
     */
    it('should throw 404 when updating non-existent reservation', async () => {
      (Reservation.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        reservationService.update('nonexistent-id', { status: 'confirmed' })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'RESERVATION_NOT_FOUND',
      });
    });
  });

  // ============================================================
  // cancel
  // ============================================================
  describe('cancel', () => {
    /**
     * Test 13: Cancel tour reservation
     * Verifies status is set to cancelled and TourAvailability.decrement is called
     */
    it('should cancel a tour reservation and decrement TourAvailability bookedSpots', async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);
      const mockReservation = {
        ...mockTourReservation,
        adminNotes: null,
        save: saveMock,
      };
      (Reservation.findByPk as jest.Mock).mockResolvedValue(mockReservation);
      (TourAvailability.decrement as jest.Mock).mockResolvedValue([]);

      await reservationService.cancel('reservation-2', 'Guest requested');

      expect(mockReservation.status).toBe('cancelled');
      expect(saveMock).toHaveBeenCalled();
      expect(TourAvailability.decrement).toHaveBeenCalledWith('bookedSpots', {
        by: 3,
        where: {
          tourPackageId: 'tour-1',
          date: '2026-08-15',
        },
      });
    });

    /**
     * Test 14: Cancel property reservation
     * Verifies status is set to cancelled, TourAvailability NOT called
     */
    it('should cancel a property reservation without calling TourAvailability', async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);
      const mockReservation = {
        ...mockPropertyReservation,
        save: saveMock,
      };
      (Reservation.findByPk as jest.Mock).mockResolvedValue(mockReservation);

      await reservationService.cancel('reservation-1');

      expect(mockReservation.status).toBe('cancelled');
      expect(saveMock).toHaveBeenCalled();
      expect(TourAvailability.decrement).not.toHaveBeenCalled();
    });

    /**
     * Test 15: Cancel not found → throws 404
     */
    it('should throw 404 when cancelling non-existent reservation', async () => {
      (Reservation.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(reservationService.cancel('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
        code: 'RESERVATION_NOT_FOUND',
      });
    });
  });

  // ============================================================
  // confirm
  // ============================================================
  describe('confirm', () => {
    /**
     * Test 16: Confirm success
     * Verifies status is set to confirmed and saved
     */
    it('should confirm a reservation correctly', async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);
      const mockReservation = { ...mockPropertyReservation, save: saveMock };
      (Reservation.findByPk as jest.Mock).mockResolvedValue(mockReservation);

      await reservationService.confirm('reservation-1');

      expect(mockReservation.status).toBe('confirmed');
      expect(saveMock).toHaveBeenCalled();
    });

    /**
     * Test 17: Confirm not found → throws 404
     */
    it('should throw 404 when confirming non-existent reservation', async () => {
      (Reservation.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(reservationService.confirm('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
        code: 'RESERVATION_NOT_FOUND',
      });
    });
  });
});
