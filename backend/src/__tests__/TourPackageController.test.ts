/**
 * @fileoverview Unit tests for TourPackageController
 * @description Tests for all tour package handlers including:
 *              - getTourPackages: paginated list with filters
 *              - getTourPackage: find by id, error handling
 *              - createTourPackage: 201 response
 *              - updateTourPackage: update and return
 *              - deleteTourPackage: 204 no content
 *              - uploadTourImages: upload files; no files 400; >10 images 400
 *              - deleteTourImage: remove at index; invalid index 400
 * @module __tests__/TourPackageController
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
  TourPackage: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  TourAvailability: { findAndCountAll: jest.fn(), findByPk: jest.fn(), init: jest.fn() },
  User: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), init: jest.fn() },
  Wallet: { findOne: jest.fn(), create: jest.fn(), init: jest.fn() },
  Commission: { findAll: jest.fn(), sum: jest.fn(), create: jest.fn(), init: jest.fn() },
  WithdrawalRequest: { findAll: jest.fn(), create: jest.fn(), init: jest.fn() },
}));

// ── Mock auth middleware ───────────────────────────────────────────────────────
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ── Mock R2Service ─────────────────────────────────────────────────────────────
const mockUploadImages = jest.fn();
const mockDeleteImage = jest.fn();
jest.mock('../services/R2Service', () => ({
  R2Service: jest.fn().mockImplementation(() => ({
    uploadImages: (...args: unknown[]) => mockUploadImages(...args),
    deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
  })),
}));

// ── Mock TourPackageService ────────────────────────────────────────────────────
const mockFindAll = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

jest.mock('../services/TourPackageService', () => ({
  tourPackageService: {
    findAll: (...args: unknown[]) => mockFindAll(...args),
    findById: (...args: unknown[]) => mockFindById(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

import { Request, Response, NextFunction } from 'express';
import {
  getTourPackages,
  getTourPackage,
  createTourPackage,
  updateTourPackage,
  deleteTourPackage,
  uploadTourImages,
  deleteTourImage,
} from '../controllers/TourPackageController';

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

const next: NextFunction = jest.fn();

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockTour = {
  id: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
  type: 'adventure',
  title: 'Trekking Cocora',
  destination: 'Salento',
  price: 250000,
  currency: 'COP',
  durationDays: 2,
  maxCapacity: 15,
  images: ['https://r2.example.com/tour1.jpg', 'https://r2.example.com/tour2.jpg'],
  status: 'active',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TourPackageController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getTourPackages ────────────────────────────────────────────────────────

  describe('getTourPackages', () => {
    const handler = (getTourPackages as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should return paginated list of tour packages', async () => {
      // Arrange
      mockFindAll.mockResolvedValue({ rows: [mockTour], count: 1 });
      const req = makeReq({ query: { page: '1', limit: '20' } });
      const { res, jsonData } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: unknown[]; pagination: unknown };
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.pagination).toBeDefined();
    });

    it('should pass all query params to service', async () => {
      // Arrange
      mockFindAll.mockResolvedValue({ rows: [], count: 0 });
      const req = makeReq({
        query: { type: 'adventure', destination: 'Salento', status: 'active' },
      });
      const { res } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'adventure', destination: 'Salento', status: 'active' })
      );
    });

    it('should parse numeric query params correctly', async () => {
      // Arrange
      mockFindAll.mockResolvedValue({ rows: [], count: 0 });
      const req = makeReq({ query: { minPrice: '100', maxPrice: '500', durationDays: '3' } });
      const { res } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 100, maxPrice: 500, durationDays: 3 })
      );
    });

    it('should return 500 when service throws', async () => {
      // Arrange
      mockFindAll.mockRejectedValue(new Error('DB error'));
      const req = makeReq({ query: {} });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

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
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(403);
    });
  });

  // ── getTourPackage ─────────────────────────────────────────────────────────

  describe('getTourPackage', () => {
    const handler = (getTourPackage as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should return tour package by id', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockTour);
      const req = makeReq({ params: { id: mockTour.id } });
      const { res, jsonData } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: typeof mockTour };
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTour);
    });

    it('should return 404 when tour not found', async () => {
      // Arrange
      const err = Object.assign(new Error('Not found'), { statusCode: 404, code: 'NOT_FOUND' });
      mockFindById.mockRejectedValue(err);
      const req = makeReq({ params: { id: 'nonexistent' } });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(404);
    });

    it('should return 500 on unexpected error', async () => {
      // Arrange
      mockFindById.mockRejectedValue(new Error('Unknown'));
      const req = makeReq({ params: { id: mockTour.id } });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });

  // ── createTourPackage ──────────────────────────────────────────────────────

  describe('createTourPackage', () => {
    const handler = (createTourPackage as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should create tour package and return 201', async () => {
      // Arrange
      mockCreate.mockResolvedValue(mockTour);
      const req = makeReq({
        body: {
          type: 'adventure',
          title: 'Trekking Test',
          destination: 'Salento',
          durationDays: 2,
          price: 200000,
        },
      });
      const { res, statusCode, jsonData } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(201);
      const data = jsonData.value as { success: boolean; data: unknown };
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTour);
    });

    it('should call service.create with req.body', async () => {
      // Arrange
      const body = {
        type: 'cultural',
        title: 'Tour',
        destination: 'Cartagena',
        durationDays: 1,
        price: 100000,
      };
      mockCreate.mockResolvedValue({ ...body, id: 'new-id' });
      const req = makeReq({ body });
      const { res } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(body);
    });

    it('should return 500 when creation fails', async () => {
      // Arrange
      mockCreate.mockRejectedValue(new Error('Write error'));
      const req = makeReq({ body: {} });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });

  // ── updateTourPackage ──────────────────────────────────────────────────────

  describe('updateTourPackage', () => {
    const handler = (updateTourPackage as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should update tour package and return updated data', async () => {
      // Arrange
      const updated = { ...mockTour, title: 'Updated Tour' };
      mockUpdate.mockResolvedValue(updated);
      const req = makeReq({ params: { id: mockTour.id }, body: { title: 'Updated Tour' } });
      const { res, jsonData } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: typeof updated };
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated Tour');
    });

    it('should call service.update with correct id and body', async () => {
      // Arrange
      mockUpdate.mockResolvedValue(mockTour);
      const body = { price: 300000 };
      const req = makeReq({ params: { id: mockTour.id }, body });
      const { res } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(mockTour.id, body);
    });

    it('should return 404 when tour not found on update', async () => {
      // Arrange
      const err = Object.assign(new Error('Not found'), { statusCode: 404, code: 'NOT_FOUND' });
      mockUpdate.mockRejectedValue(err);
      const req = makeReq({ params: { id: 'bad-id' }, body: {} });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(404);
    });
  });

  // ── deleteTourPackage ──────────────────────────────────────────────────────

  describe('deleteTourPackage', () => {
    const handler = (deleteTourPackage as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should delete tour package and return 204', async () => {
      // Arrange
      mockRemove.mockResolvedValue(undefined);
      const req = makeReq({ params: { id: mockTour.id } });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(204);
    });

    it('should call service.remove with the correct id', async () => {
      // Arrange
      mockRemove.mockResolvedValue(undefined);
      const req = makeReq({ params: { id: mockTour.id } });
      const { res } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(mockRemove).toHaveBeenCalledWith(mockTour.id);
    });

    it('should return 500 on deletion error', async () => {
      // Arrange
      mockRemove.mockRejectedValue(new Error('Delete failed'));
      const req = makeReq({ params: { id: mockTour.id } });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });

  // ── uploadTourImages ───────────────────────────────────────────────────────

  describe('uploadTourImages', () => {
    it('should upload images and return combined images array', async () => {
      // Arrange
      const tour = { ...mockTour, images: ['https://r2.example.com/old.jpg'] };
      mockFindById.mockResolvedValue(tour);
      mockUploadImages.mockResolvedValue(['https://r2.example.com/new1.jpg']);
      mockUpdate.mockResolvedValue({
        ...tour,
        images: ['https://r2.example.com/old.jpg', 'https://r2.example.com/new1.jpg'],
      });

      const files = [{ fieldname: 'images', originalname: 'test.jpg', buffer: Buffer.from('') }];
      const req = makeReq({ params: { id: tour.id }, files });
      const { res, jsonData } = makeRes();

      // Act
      await uploadTourImages(req as Request, res as Response, next);

      // Assert
      const data = jsonData.value as { images: string[] };
      expect(data.images).toContain('https://r2.example.com/old.jpg');
      expect(data.images).toContain('https://r2.example.com/new1.jpg');
    });

    it('should return 400 when no files are provided', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockTour);
      const req = makeReq({ params: { id: mockTour.id }, files: [] });
      const { res, statusCode } = makeRes();

      // Act
      await uploadTourImages(req as Request, res as Response, next);

      // Assert
      expect(statusCode.value).toBe(400);
    });

    it('should return 400 when files would exceed 10 image limit', async () => {
      // Arrange
      const tour = { ...mockTour, images: Array(9).fill('https://r2.example.com/t.jpg') };
      mockFindById.mockResolvedValue(tour);

      const files = [
        { fieldname: 'images', originalname: 'a.jpg', buffer: Buffer.from('') },
        { fieldname: 'images', originalname: 'b.jpg', buffer: Buffer.from('') },
      ];
      const req = makeReq({ params: { id: tour.id }, files });
      const { res, statusCode } = makeRes();

      // Act
      await uploadTourImages(req as Request, res as Response, next);

      // Assert
      expect(statusCode.value).toBe(400);
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      mockFindById.mockRejectedValue(new Error('Service error'));
      const req = makeReq({ params: { id: 'some-id' }, files: [] });
      const { res } = makeRes();
      const mockNext = jest.fn();

      // Act
      await uploadTourImages(req as Request, res as Response, mockNext as NextFunction);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── deleteTourImage ────────────────────────────────────────────────────────

  describe('deleteTourImage', () => {
    it('should delete image at valid index and return updated list', async () => {
      // Arrange
      const tour = {
        ...mockTour,
        images: ['https://r2.example.com/img0.jpg', 'https://r2.example.com/img1.jpg'],
      };
      mockFindById.mockResolvedValue(tour);
      mockDeleteImage.mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue({ ...tour, images: ['https://r2.example.com/img1.jpg'] });

      const req = makeReq({ params: { id: tour.id, imageIndex: '0' } });
      const { res, jsonData } = makeRes();

      // Act
      await deleteTourImage(req as Request, res as Response, next);

      // Assert
      const data = jsonData.value as { images: string[] };
      expect(data.images).not.toContain('https://r2.example.com/img0.jpg');
      expect(data.images).toContain('https://r2.example.com/img1.jpg');
    });

    it('should return 400 for negative image index', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockTour);
      const req = makeReq({ params: { id: mockTour.id, imageIndex: '-1' } });
      const { res, statusCode } = makeRes();

      // Act
      await deleteTourImage(req as Request, res as Response, next);

      // Assert
      expect(statusCode.value).toBe(400);
    });

    it('should return 400 for out-of-bounds image index', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockTour); // has 2 images
      const req = makeReq({ params: { id: mockTour.id, imageIndex: '99' } });
      const { res, statusCode } = makeRes();

      // Act
      await deleteTourImage(req as Request, res as Response, next);

      // Assert
      expect(statusCode.value).toBe(400);
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      mockFindById.mockRejectedValue(new Error('Not found'));
      const req = makeReq({ params: { id: 'bad-id', imageIndex: '0' } });
      const { res } = makeRes();
      const mockNext = jest.fn();

      // Act
      await deleteTourImage(req as Request, res as Response, mockNext as NextFunction);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
