/**
 * @fileoverview Unit tests for ReservationController
 * @description Tests for all reservation handlers including:
 *              - getReservations: paginated list with filters
 *              - getReservation: find by id, error handling
 *              - createReservation: 201 response
 *              - updateReservation: update and return
 *              - cancelReservation: cancel with reason from body
 *              - confirmReservation: confirm reservation
 * @module __tests__/ReservationController
 */

// ── Mock database before importing any services ───────────────────────────────
jest.mock('../config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    }),
    query: jest.fn(),
    sync: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
  },
  resetSequelize: jest.fn(),
}));

// ── Mock models ───────────────────────────────────────────────────────────────
jest.mock('../models', () => ({
  Property: { findAndCountAll: jest.fn(), findByPk: jest.fn(), init: jest.fn() },
  TourPackage: { findAndCountAll: jest.fn(), findByPk: jest.fn(), init: jest.fn() },
  TourAvailability: { findAndCountAll: jest.fn(), findByPk: jest.fn(), init: jest.fn() },
  User: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), init: jest.fn() },
  Wallet: { findOne: jest.fn(), create: jest.fn(), init: jest.fn() },
  Commission: { findAll: jest.fn(), sum: jest.fn(), create: jest.fn(), init: jest.fn() },
  WithdrawalRequest: { findAll: jest.fn(), create: jest.fn(), init: jest.fn() },
  Reservation: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
}));

// ── Mock ReservationService ────────────────────────────────────────────────────
const mockFindAll = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockCancel = jest.fn();
const mockConfirm = jest.fn();

jest.mock('../services/ReservationService', () => ({
  reservationService: {
    findAll: (...args: unknown[]) => mockFindAll(...args),
    findById: (...args: unknown[]) => mockFindById(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    cancel: (...args: unknown[]) => mockCancel(...args),
    confirm: (...args: unknown[]) => mockConfirm(...args),
  },
}));

import { Request, Response } from 'express';
import {
  getReservations,
  getReservation,
  createReservation,
  updateReservation,
  cancelReservation,
  confirmReservation,
} from '../controllers/ReservationController';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    query: {},
    params: {},
    body: {},
    headers: {},
    ...overrides,
  } as Partial<Request>;
}

function makeRes(): {
  res: Partial<Response>;
  statusCode: { value: number };
  jsonData: { value: unknown };
} {
  const statusCode = { value: 200 };
  const jsonData = { value: undefined as unknown };
  const res: Partial<Response> = {
    json: jest.fn((data: unknown) => {
      jsonData.value = data;
      return res as Response;
    }),
    status: jest.fn((code: number) => {
      statusCode.value = code;
      return res as Response;
    }),
    send: jest.fn().mockReturnThis(),
  };
  return { res, statusCode, jsonData };
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockReservation = {
  id: 'res-001',
  type: 'property',
  status: 'pending',
  userId: 'user-001',
  vendorId: 'vendor-001',
  paymentStatus: 'pending',
  totalAmount: 1500000,
  currency: 'COP',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReservationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getReservations ────────────────────────────────────────────────────────

  describe('getReservations', () => {
    it('should return paginated list of reservations', async () => {
      // Arrange
      mockFindAll.mockResolvedValue({
        reservations: [mockReservation],
        total: 1,
        page: 1,
        totalPages: 1,
      });
      const req = makeReq({ query: { page: '1', limit: '20' } });
      const { res, jsonData } = makeRes();

      // Act
      await getReservations(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: unknown[]; pagination: unknown };
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.pagination).toBeDefined();
    });

    it('should pass filter query params to service', async () => {
      // Arrange
      mockFindAll.mockResolvedValue({ reservations: [], total: 0, page: 1, totalPages: 0 });
      const req = makeReq({
        query: { type: 'property', status: 'pending', userId: 'user-001' },
      });
      const { res } = makeRes();

      // Act
      await getReservations(req as Request, res as Response);

      // Assert
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'property', status: 'pending', userId: 'user-001' })
      );
    });

    it('should parse page and limit as integers', async () => {
      // Arrange
      mockFindAll.mockResolvedValue({ reservations: [], total: 0, page: 2, totalPages: 0 });
      const req = makeReq({ query: { page: '2', limit: '10' } });
      const { res } = makeRes();

      // Act
      await getReservations(req as Request, res as Response);

      // Assert
      expect(mockFindAll).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 10 }));
    });

    it('should return 500 when service throws', async () => {
      // Arrange
      mockFindAll.mockRejectedValue(new Error('DB error'));
      const req = makeReq({ query: {} });
      const { res, statusCode } = makeRes();

      // Act
      await getReservations(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });

    it('should return custom status code on known error', async () => {
      // Arrange
      const err = Object.assign(new Error('Forbidden'), { statusCode: 403, code: 'FORBIDDEN' });
      mockFindAll.mockRejectedValue(err);
      const req = makeReq({ query: {} });
      const { res, statusCode } = makeRes();

      // Act
      await getReservations(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(403);
    });
  });

  // ── getReservation ─────────────────────────────────────────────────────────

  describe('getReservation', () => {
    it('should return reservation by id', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockReservation);
      const req = makeReq({ params: { id: mockReservation.id } });
      const { res, jsonData } = makeRes();

      // Act
      await getReservation(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: typeof mockReservation };
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockReservation);
    });

    it('should return 404 when reservation not found', async () => {
      // Arrange
      const err = Object.assign(new Error('Not found'), { statusCode: 404, code: 'NOT_FOUND' });
      mockFindById.mockRejectedValue(err);
      const req = makeReq({ params: { id: 'nonexistent' } });
      const { res, statusCode } = makeRes();

      // Act
      await getReservation(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(404);
    });

    it('should return 500 on unexpected error', async () => {
      // Arrange
      mockFindById.mockRejectedValue(new Error('Unexpected'));
      const req = makeReq({ params: { id: 'some-id' } });
      const { res, statusCode } = makeRes();

      // Act
      await getReservation(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });

  // ── createReservation ──────────────────────────────────────────────────────

  describe('createReservation', () => {
    it('should create reservation and return 201', async () => {
      // Arrange
      mockCreate.mockResolvedValue(mockReservation);
      const req = makeReq({
        body: {
          type: 'property',
          userId: 'user-001',
          propertyId: 'prop-001',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
        },
      });
      const { res, statusCode, jsonData } = makeRes();

      // Act
      await createReservation(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(201);
      const data = jsonData.value as { success: boolean; data: unknown };
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockReservation);
    });

    it('should call service.create with req.body', async () => {
      // Arrange
      const body = { type: 'tour', userId: 'u1', tourId: 't1' };
      mockCreate.mockResolvedValue({ ...body, id: 'new-res' });
      const req = makeReq({ body });
      const { res } = makeRes();

      // Act
      await createReservation(req as Request, res as Response);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(body);
    });

    it('should return 400 when creation fails with validation error', async () => {
      // Arrange
      const err = Object.assign(new Error('Validation failed'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
      mockCreate.mockRejectedValue(err);
      const req = makeReq({ body: {} });
      const { res, statusCode } = makeRes();

      // Act
      await createReservation(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(400);
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      mockCreate.mockRejectedValue(new Error('DB write error'));
      const req = makeReq({ body: {} });
      const { res, statusCode } = makeRes();

      // Act
      await createReservation(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });

  // ── updateReservation ──────────────────────────────────────────────────────

  describe('updateReservation', () => {
    it('should update reservation and return updated data', async () => {
      // Arrange
      const updated = { ...mockReservation, status: 'confirmed' };
      mockUpdate.mockResolvedValue(updated);
      const req = makeReq({ params: { id: mockReservation.id }, body: { status: 'confirmed' } });
      const { res, jsonData } = makeRes();

      // Act
      await updateReservation(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: typeof updated };
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('confirmed');
    });

    it('should call service.update with correct id and body', async () => {
      // Arrange
      mockUpdate.mockResolvedValue(mockReservation);
      const body = { paymentStatus: 'paid' };
      const req = makeReq({ params: { id: mockReservation.id }, body });
      const { res } = makeRes();

      // Act
      await updateReservation(req as Request, res as Response);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(mockReservation.id, body);
    });

    it('should return 404 when reservation not found on update', async () => {
      // Arrange
      const err = Object.assign(new Error('Not found'), { statusCode: 404, code: 'NOT_FOUND' });
      mockUpdate.mockRejectedValue(err);
      const req = makeReq({ params: { id: 'bad-id' }, body: {} });
      const { res, statusCode } = makeRes();

      // Act
      await updateReservation(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(404);
    });
  });

  // ── cancelReservation ──────────────────────────────────────────────────────

  describe('cancelReservation', () => {
    it('should cancel reservation with reason from body', async () => {
      // Arrange
      const cancelled = { ...mockReservation, status: 'cancelled' };
      mockCancel.mockResolvedValue(cancelled);
      const req = makeReq({
        params: { id: mockReservation.id },
        body: { reason: 'Customer request' },
      });
      const { res, jsonData } = makeRes();

      // Act
      await cancelReservation(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: typeof cancelled };
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('cancelled');
    });

    it('should call service.cancel with id and reason', async () => {
      // Arrange
      mockCancel.mockResolvedValue({ ...mockReservation, status: 'cancelled' });
      const req = makeReq({
        params: { id: mockReservation.id },
        body: { reason: 'No show' },
      });
      const { res } = makeRes();

      // Act
      await cancelReservation(req as Request, res as Response);

      // Assert
      expect(mockCancel).toHaveBeenCalledWith(mockReservation.id, 'No show');
    });

    it('should handle cancel without reason (undefined body.reason)', async () => {
      // Arrange
      mockCancel.mockResolvedValue({ ...mockReservation, status: 'cancelled' });
      const req = makeReq({ params: { id: mockReservation.id }, body: {} });
      const { res } = makeRes();

      // Act
      await cancelReservation(req as Request, res as Response);

      // Assert
      expect(mockCancel).toHaveBeenCalledWith(mockReservation.id, undefined);
    });

    it('should return 500 when cancel fails', async () => {
      // Arrange
      mockCancel.mockRejectedValue(new Error('Cancel failed'));
      const req = makeReq({ params: { id: 'bad-id' }, body: { reason: 'test' } });
      const { res, statusCode } = makeRes();

      // Act
      await cancelReservation(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });

  // ── confirmReservation ─────────────────────────────────────────────────────

  describe('confirmReservation', () => {
    it('should confirm reservation and return confirmed data', async () => {
      // Arrange
      const confirmed = { ...mockReservation, status: 'confirmed' };
      mockConfirm.mockResolvedValue(confirmed);
      const req = makeReq({ params: { id: mockReservation.id } });
      const { res, jsonData } = makeRes();

      // Act
      await confirmReservation(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: typeof confirmed };
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('confirmed');
    });

    it('should call service.confirm with the reservation id', async () => {
      // Arrange
      mockConfirm.mockResolvedValue({ ...mockReservation, status: 'confirmed' });
      const req = makeReq({ params: { id: mockReservation.id } });
      const { res } = makeRes();

      // Act
      await confirmReservation(req as Request, res as Response);

      // Assert
      expect(mockConfirm).toHaveBeenCalledWith(mockReservation.id);
    });

    it('should return 404 when reservation not found on confirm', async () => {
      // Arrange
      const err = Object.assign(new Error('Not found'), { statusCode: 404, code: 'NOT_FOUND' });
      mockConfirm.mockRejectedValue(err);
      const req = makeReq({ params: { id: 'nonexistent' } });
      const { res, statusCode } = makeRes();

      // Act
      await confirmReservation(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(404);
    });

    it('should return 500 on unexpected confirm error', async () => {
      // Arrange
      mockConfirm.mockRejectedValue(new Error('Unexpected failure'));
      const req = makeReq({ params: { id: mockReservation.id } });
      const { res, statusCode } = makeRes();

      // Act
      await confirmReservation(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });
});
