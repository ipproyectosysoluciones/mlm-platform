/**
 * @fileoverview Unit tests for PropertyController
 * @description Tests for all property handlers including:
 *              - getProperties: paginated list with filters
 *              - getProperty: find by id, error handling
 *              - createProperty: 201 response
 *              - updateProperty: update and return
 *              - deleteProperty: 200 success message
 *              - uploadPropertyImages: upload files; no files 400; >10 images 400
 *              - deletePropertyImage: remove at index; invalid index 400
 * @module __tests__/PropertyController
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
  Property: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  TourPackage: { findAndCountAll: jest.fn(), findByPk: jest.fn(), init: jest.fn() },
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

// ── Mock PropertyService ───────────────────────────────────────────────────────
const mockFindAll = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

jest.mock('../services/PropertyService', () => ({
  propertyService: {
    findAll: (...args: unknown[]) => mockFindAll(...args),
    findById: (...args: unknown[]) => mockFindById(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

import { Request, Response, NextFunction } from 'express';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  deletePropertyImage,
} from '../controllers/PropertyController';

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

const mockProperty = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  type: 'rental',
  title: 'Apartamento Poblado',
  price: 1500000,
  currency: 'COP',
  city: 'Medellín',
  images: ['https://r2.example.com/img1.jpg', 'https://r2.example.com/img2.jpg'],
  status: 'available',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PropertyController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getProperties ─────────────────────────────────────────────────────────

  describe('getProperties', () => {
    const handler = (getProperties as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should return paginated list of properties', async () => {
      // Arrange
      mockFindAll.mockResolvedValue({ rows: [mockProperty], count: 1 });
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

    it('should pass query params to service', async () => {
      // Arrange
      mockFindAll.mockResolvedValue({ rows: [], count: 0 });
      const req = makeReq({ query: { city: 'Bogotá', status: 'available', type: 'rental' } });
      const { res } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'Bogotá', status: 'available', type: 'rental' })
      );
    });

    it('should parse numeric query params correctly', async () => {
      // Arrange
      mockFindAll.mockResolvedValue({ rows: [], count: 0 });
      const req = makeReq({ query: { minPrice: '100', maxPrice: '500', bedrooms: '2' } });
      const { res } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 100, maxPrice: 500, bedrooms: 2 })
      );
    });

    it('should return error 500 when service throws', async () => {
      // Arrange
      const err = new Error('DB error');
      mockFindAll.mockRejectedValue(err);
      const req = makeReq({ query: {} });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });

    it('should return custom statusCode when service throws with statusCode', async () => {
      // Arrange
      const err = Object.assign(new Error('Not Found'), { statusCode: 404, code: 'NOT_FOUND' });
      mockFindAll.mockRejectedValue(err);
      const req = makeReq({ query: {} });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(404);
    });
  });

  // ── getProperty ───────────────────────────────────────────────────────────

  describe('getProperty', () => {
    const handler = (getProperty as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should return property by id', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProperty);
      const req = makeReq({ params: { id: mockProperty.id } });
      const { res, jsonData } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: typeof mockProperty };
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProperty);
    });

    it('should return 404 when property not found', async () => {
      // Arrange
      const err = Object.assign(new Error('Property not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
      mockFindById.mockRejectedValue(err);
      const req = makeReq({ params: { id: 'nonexistent-id' } });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(404);
    });

    it('should return 500 on unexpected error', async () => {
      // Arrange
      mockFindById.mockRejectedValue(new Error('Unexpected'));
      const req = makeReq({ params: { id: mockProperty.id } });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });

  // ── createProperty ────────────────────────────────────────────────────────

  describe('createProperty', () => {
    const handler = (createProperty as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should create property and return 201', async () => {
      // Arrange
      mockCreate.mockResolvedValue(mockProperty);
      const req = makeReq({
        body: {
          type: 'rental',
          title: 'Test Property',
          price: 1000,
          address: '123 St',
          city: 'Bogotá',
        },
      });
      const { res, statusCode, jsonData } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(201);
      const data = jsonData.value as { success: boolean; data: unknown };
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProperty);
    });

    it('should call service.create with req.body', async () => {
      // Arrange
      const body = { type: 'sale', title: 'Casa', price: 500000, address: 'Calle 1', city: 'Cali' };
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
      mockCreate.mockRejectedValue(new Error('DB write error'));
      const req = makeReq({ body: {} });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });

  // ── updateProperty ────────────────────────────────────────────────────────

  describe('updateProperty', () => {
    const handler = (updateProperty as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should update property and return updated data', async () => {
      // Arrange
      const updated = { ...mockProperty, title: 'Updated Title' };
      mockUpdate.mockResolvedValue(updated);
      const req = makeReq({ params: { id: mockProperty.id }, body: { title: 'Updated Title' } });
      const { res, jsonData } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; data: typeof updated };
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated Title');
    });

    it('should call service.update with correct id and body', async () => {
      // Arrange
      mockUpdate.mockResolvedValue(mockProperty);
      const body = { price: 2000000 };
      const req = makeReq({ params: { id: mockProperty.id }, body });
      const { res } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(mockProperty.id, body);
    });

    it('should return 404 when property not found on update', async () => {
      // Arrange
      const err = Object.assign(new Error('Not found'), { statusCode: 404, code: 'NOT_FOUND' });
      mockUpdate.mockRejectedValue(err);
      const req = makeReq({ params: { id: 'non-existent' }, body: {} });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(404);
    });
  });

  // ── deleteProperty ────────────────────────────────────────────────────────

  describe('deleteProperty', () => {
    const handler = (deleteProperty as unknown[]).at(-1) as (
      req: Request,
      res: Response
    ) => Promise<void>;

    it('should delete property and return success message', async () => {
      // Arrange
      mockRemove.mockResolvedValue(undefined);
      const req = makeReq({ params: { id: mockProperty.id } });
      const { res, jsonData } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      const data = jsonData.value as { success: boolean; message: string };
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted');
    });

    it('should call service.remove with the correct id', async () => {
      // Arrange
      mockRemove.mockResolvedValue(undefined);
      const req = makeReq({ params: { id: mockProperty.id } });
      const { res } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(mockRemove).toHaveBeenCalledWith(mockProperty.id);
    });

    it('should return 500 on deletion error', async () => {
      // Arrange
      mockRemove.mockRejectedValue(new Error('Delete failed'));
      const req = makeReq({ params: { id: mockProperty.id } });
      const { res, statusCode } = makeRes();

      // Act
      await handler(req as Request, res as Response);

      // Assert
      expect(statusCode.value).toBe(500);
    });
  });

  // ── uploadPropertyImages ──────────────────────────────────────────────────

  describe('uploadPropertyImages', () => {
    it('should upload images and return combined images array', async () => {
      // Arrange
      const property = { ...mockProperty, images: ['https://r2.example.com/old.jpg'] };
      mockFindById.mockResolvedValue(property);
      mockUploadImages.mockResolvedValue(['https://r2.example.com/new1.jpg']);
      mockUpdate.mockResolvedValue({
        ...property,
        images: ['https://r2.example.com/old.jpg', 'https://r2.example.com/new1.jpg'],
      });

      const files = [{ fieldname: 'images', originalname: 'test.jpg', buffer: Buffer.from('') }];
      const req = makeReq({ params: { id: property.id }, files });
      const { res, jsonData } = makeRes();

      // Act
      await uploadPropertyImages(req as Request, res as Response, next);

      // Assert
      const data = jsonData.value as { images: string[] };
      expect(data.images).toContain('https://r2.example.com/old.jpg');
      expect(data.images).toContain('https://r2.example.com/new1.jpg');
    });

    it('should return 400 when no files are provided', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProperty);
      const req = makeReq({ params: { id: mockProperty.id }, files: [] });
      const { res, statusCode } = makeRes();

      // Act
      await uploadPropertyImages(req as Request, res as Response, next);

      // Assert
      expect(statusCode.value).toBe(400);
    });

    it('should return 400 when files would exceed 10 image limit', async () => {
      // Arrange
      const property = {
        ...mockProperty,
        images: Array(9).fill('https://r2.example.com/img.jpg'),
      };
      mockFindById.mockResolvedValue(property);

      // 9 existing + 2 new = 11 > 10
      const files = [
        { fieldname: 'images', originalname: 'a.jpg', buffer: Buffer.from('') },
        { fieldname: 'images', originalname: 'b.jpg', buffer: Buffer.from('') },
      ];
      const req = makeReq({ params: { id: property.id }, files });
      const { res, statusCode } = makeRes();

      // Act
      await uploadPropertyImages(req as Request, res as Response, next);

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
      await uploadPropertyImages(req as Request, res as Response, mockNext as NextFunction);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── deletePropertyImage ───────────────────────────────────────────────────

  describe('deletePropertyImage', () => {
    it('should delete image at valid index and return updated list', async () => {
      // Arrange
      const property = {
        ...mockProperty,
        images: ['https://r2.example.com/img0.jpg', 'https://r2.example.com/img1.jpg'],
      };
      mockFindById.mockResolvedValue(property);
      mockDeleteImage.mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue({ ...property, images: ['https://r2.example.com/img1.jpg'] });

      const req = makeReq({ params: { id: property.id, imageIndex: '0' } });
      const { res, jsonData } = makeRes();

      // Act
      await deletePropertyImage(req as Request, res as Response, next);

      // Assert
      const data = jsonData.value as { images: string[] };
      expect(data.images).not.toContain('https://r2.example.com/img0.jpg');
      expect(data.images).toContain('https://r2.example.com/img1.jpg');
    });

    it('should return 400 for invalid image index (negative)', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProperty);
      const req = makeReq({ params: { id: mockProperty.id, imageIndex: '-1' } });
      const { res, statusCode } = makeRes();

      // Act
      await deletePropertyImage(req as Request, res as Response, next);

      // Assert
      expect(statusCode.value).toBe(400);
    });

    it('should return 400 for invalid image index (out of bounds)', async () => {
      // Arrange
      mockFindById.mockResolvedValue(mockProperty); // has 2 images
      const req = makeReq({ params: { id: mockProperty.id, imageIndex: '99' } });
      const { res, statusCode } = makeRes();

      // Act
      await deletePropertyImage(req as Request, res as Response, next);

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
      await deletePropertyImage(req as Request, res as Response, mockNext as NextFunction);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
