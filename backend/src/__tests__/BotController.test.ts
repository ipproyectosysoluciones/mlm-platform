/**
 * @fileoverview Unit tests for BotController — property/tour endpoints
 * @description Tests for getBotProperties and getBotTours handlers including:
 *              - Simplified property/tour list responses
 *              - Optional query parameter filtering (city, destination)
 *              - Limit cap at 10
 *              - Default status filters (available / active)
 *
 *              Tests para getBotProperties y getBotTours incluyendo:
 *              - Respuestas con listas simplificadas de propiedades/tours
 *              - Filtros opcionales por query param (ciudad, destino)
 *              - Límite máximo de 10
 *              - Filtros de estado por defecto (available / active)
 * @module __tests__/BotController
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
  TourAvailability: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  Wallet: {
    findOne: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
  },
  Commission: {
    findAll: jest.fn(),
    sum: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
  },
  WithdrawalRequest: {
    findAll: jest.fn(),
    create: jest.fn(),
    init: jest.fn(),
  },
}));

// ── Mock services ─────────────────────────────────────────────────────────────

/** Mock PropertyService singleton / Mock del singleton PropertyService */
const mockPropertyFindAll = jest.fn();
jest.mock('../services/PropertyService', () => ({
  propertyService: {
    findAll: (...args: unknown[]) => mockPropertyFindAll(...args),
  },
}));

/** Mock TourPackageService singleton / Mock del singleton TourPackageService */
const mockTourFindAll = jest.fn();
jest.mock('../services/TourPackageService', () => ({
  tourPackageService: {
    findAll: (...args: unknown[]) => mockTourFindAll(...args),
  },
}));

import { Request, Response, NextFunction } from 'express';
import { getBotProperties, getBotTours } from '../controllers/BotController';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a mock Express Request with optional query params.
 * Construye un Request de Express simulado con query params opcionales.
 */
function makeReq(query: Record<string, string> = {}): Partial<Request> {
  return { query } as Partial<Request>;
}

/**
 * Build a mock Express Response that captures json payload.
 * Construye un Response de Express simulado que captura el payload JSON.
 */
function makeRes(): { res: Partial<Response>; jsonData: { value: unknown } } {
  const jsonData = { value: undefined as unknown };
  const res: Partial<Response> = {
    json: jest.fn((data: unknown) => {
      jsonData.value = data;
      return res as Response;
    }),
    status: jest.fn().mockReturnThis(),
  };
  return { res, jsonData };
}

/** No-op next function / Función next sin operación */
const next: NextFunction = jest.fn();

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockProperties = [
  {
    id: 'prop-1',
    type: 'rental',
    title: 'Apartamento Poblado',
    price: 1500000,
    currency: 'COP',
    city: 'Medellín',
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 65,
    status: 'available',
  },
  {
    id: 'prop-2',
    type: 'sale',
    title: 'Casa Laureles',
    price: 450000000,
    currency: 'COP',
    city: 'Medellín',
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 120,
    status: 'available',
  },
];

const mockTours = [
  {
    id: 'tour-1',
    type: 'adventure',
    title: 'Trekking Cocora',
    destination: 'Salento',
    price: 250000,
    currency: 'COP',
    durationDays: 2,
    maxCapacity: 15,
    status: 'active',
  },
  {
    id: 'tour-2',
    type: 'cultural',
    title: 'Tour Histórico Cartagena',
    destination: 'Cartagena',
    price: 180000,
    currency: 'COP',
    durationDays: 1,
    maxCapacity: 20,
    status: 'active',
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BotController — property/tour endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getBotProperties ────────────────────────────────────────────────────────

  describe('getBotProperties', () => {
    it('should return simplified properties list', async () => {
      // Arrange / Preparar
      mockPropertyFindAll.mockResolvedValue({ rows: mockProperties, count: 2 });
      const req = makeReq({});
      const { res, jsonData } = makeRes();

      // Act / Actuar
      await getBotProperties(req as Request, res as Response, next);

      // Assert / Afirmar
      const data = jsonData.value as { properties: unknown[]; total: number };
      expect(data.properties).toHaveLength(2);
      expect(data.total).toBe(2);

      // Simplified fields only — no raw model data
      const first = data.properties[0] as Record<string, unknown>;
      expect(first).toHaveProperty('id', 'prop-1');
      expect(first).toHaveProperty('type', 'rental');
      expect(first).toHaveProperty('title', 'Apartamento Poblado');
      expect(first).toHaveProperty('price', 1500000);
      expect(first).toHaveProperty('currency', 'COP');
      expect(first).toHaveProperty('city', 'Medellín');
      expect(first).toHaveProperty('bedrooms', 2);
      expect(first).toHaveProperty('bathrooms', 1);
      expect(first).toHaveProperty('areaM2', 65);
    });

    it('should filter by city when provided', async () => {
      // Arrange / Preparar
      mockPropertyFindAll.mockResolvedValue({ rows: [mockProperties[0]], count: 1 });
      const req = makeReq({ city: 'Medellín' });
      const { res } = makeRes();

      // Act / Actuar
      await getBotProperties(req as Request, res as Response, next);

      // Assert — service was called with city filter
      expect(mockPropertyFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'Medellín' })
      );
    });

    it('should cap limit at 10', async () => {
      // Arrange / Preparar — request limit of 50 must be capped to 10
      mockPropertyFindAll.mockResolvedValue({ rows: [], count: 0 });
      const req = makeReq({ limit: '50' });
      const { res } = makeRes();

      // Act / Actuar
      await getBotProperties(req as Request, res as Response, next);

      // Assert — service called with limit ≤ 10
      expect(mockPropertyFindAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
    });

    it('should default status to available', async () => {
      // Arrange / Preparar
      mockPropertyFindAll.mockResolvedValue({ rows: [], count: 0 });
      const req = makeReq({});
      const { res } = makeRes();

      // Act / Actuar
      await getBotProperties(req as Request, res as Response, next);

      // Assert — always sends status=available regardless of request
      expect(mockPropertyFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'available' })
      );
    });

    it('should call next with error when service throws', async () => {
      // Arrange / Preparar
      const serviceError = new Error('DB connection failed');
      mockPropertyFindAll.mockRejectedValue(serviceError);
      const req = makeReq({});
      const { res } = makeRes();

      // Act / Actuar
      await getBotProperties(req as Request, res as Response, next);

      // Assert — error passed to next()
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  // ── getBotTours ─────────────────────────────────────────────────────────────

  describe('getBotTours', () => {
    it('should return simplified tours list', async () => {
      // Arrange / Preparar
      mockTourFindAll.mockResolvedValue({ rows: mockTours, count: 2 });
      const req = makeReq({});
      const { res, jsonData } = makeRes();

      // Act / Actuar
      await getBotTours(req as Request, res as Response, next);

      // Assert / Afirmar
      const data = jsonData.value as { tours: unknown[]; total: number };
      expect(data.tours).toHaveLength(2);
      expect(data.total).toBe(2);

      // Simplified fields only
      const first = data.tours[0] as Record<string, unknown>;
      expect(first).toHaveProperty('id', 'tour-1');
      expect(first).toHaveProperty('type', 'adventure');
      expect(first).toHaveProperty('title', 'Trekking Cocora');
      expect(first).toHaveProperty('destination', 'Salento');
      expect(first).toHaveProperty('price', 250000);
      expect(first).toHaveProperty('currency', 'COP');
      expect(first).toHaveProperty('durationDays', 2);
      expect(first).toHaveProperty('maxCapacity', 15);
    });

    it('should filter by destination when provided', async () => {
      // Arrange / Preparar
      mockTourFindAll.mockResolvedValue({ rows: [mockTours[0]], count: 1 });
      const req = makeReq({ destination: 'Salento' });
      const { res } = makeRes();

      // Act / Actuar
      await getBotTours(req as Request, res as Response, next);

      // Assert — service was called with destination filter
      expect(mockTourFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ destination: 'Salento' })
      );
    });

    it('should cap limit at 10', async () => {
      // Arrange / Preparar — request limit of 100 must be capped to 10
      mockTourFindAll.mockResolvedValue({ rows: [], count: 0 });
      const req = makeReq({ limit: '100' });
      const { res } = makeRes();

      // Act / Actuar
      await getBotTours(req as Request, res as Response, next);

      // Assert — service called with limit ≤ 10
      expect(mockTourFindAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
    });

    it('should default status to active', async () => {
      // Arrange / Preparar
      mockTourFindAll.mockResolvedValue({ rows: [], count: 0 });
      const req = makeReq({});
      const { res } = makeRes();

      // Act / Actuar
      await getBotTours(req as Request, res as Response, next);

      // Assert — always sends status=active
      expect(mockTourFindAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('should call next with error when service throws', async () => {
      // Arrange / Preparar
      const serviceError = new Error('Tour service unavailable');
      mockTourFindAll.mockRejectedValue(serviceError);
      const req = makeReq({});
      const { res } = makeRes();

      // Act / Actuar
      await getBotTours(req as Request, res as Response, next);

      // Assert — error passed to next()
      expect(next).toHaveBeenCalledWith(serviceError);
    });

    it('should apply maxPrice filter when provided', async () => {
      // Arrange / Preparar
      mockTourFindAll.mockResolvedValue({ rows: [], count: 0 });
      const req = makeReq({ maxPrice: '300000' });
      const { res } = makeRes();

      // Act / Actuar
      await getBotTours(req as Request, res as Response, next);

      // Assert — service called with maxPrice filter
      expect(mockTourFindAll).toHaveBeenCalledWith(expect.objectContaining({ maxPrice: 300000 }));
    });
  });
});
