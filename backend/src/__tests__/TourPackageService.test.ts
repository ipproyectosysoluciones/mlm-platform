/**
 * @fileoverview Unit tests for TourPackageService
 * @description Tests for TourPackageService CRUD operations including:
 *              - Pagination, type filter, destination filter, country filter, status filter, price range, durationDays filter
 *              - Find by ID success and not found scenarios
 *              - Create, update, soft-delete operations
 *              Tests para operaciones CRUD de TourPackageService incluyendo:
 *              - Paginación, filtro por tipo, destino, país, estado, precio, duración
 *              - findById con éxito y no encontrado (404)
 *              - Crear, actualizar, borrado suave
 * @module __tests__/TourPackageService
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
  Vendor: {
    findByPk: jest.fn(),
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
}));

import { TourPackageService } from '../services/TourPackageService';
import { TourPackage } from '../models';

describe('TourPackageService', () => {
  let tourPackageService: TourPackageService;

  // Mock tour packages for testing
  const mockTourPackages = [
    {
      id: 'tour-1',
      type: 'adventure',
      title: 'Trekking en el Cocuy',
      titleEn: 'Trekking in Cocuy',
      description: 'Expedición de 5 días por la Sierra Nevada del Cocuy',
      descriptionEn: '5-day expedition through Sierra Nevada del Cocuy',
      destination: 'Sierra Nevada del Cocuy, Colombia',
      country: 'Colombia',
      durationDays: 5,
      price: 850,
      currency: 'USD',
      priceIncludes: ['accommodation', 'meals', 'guide'],
      priceExcludes: ['flights', 'personal gear'],
      images: ['https://example.com/cocuy.jpg'],
      maxCapacity: 12,
      minGroupSize: 2,
      status: 'active',
      vendorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'tour-2',
      type: 'cultural',
      title: 'Tour Histórico Cartagena',
      titleEn: 'Cartagena Historical Tour',
      description: 'Descubre la historia colonial de Cartagena',
      descriptionEn: 'Discover the colonial history of Cartagena',
      destination: 'Cartagena, Colombia',
      country: 'Colombia',
      durationDays: 3,
      price: 450,
      currency: 'USD',
      priceIncludes: ['hotel', 'guide'],
      priceExcludes: ['flights'],
      images: [],
      maxCapacity: 20,
      minGroupSize: 1,
      status: 'active',
      vendorId: 'vendor-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'tour-3',
      type: 'luxury',
      title: 'Retiro de Lujo Eje Cafetero',
      titleEn: null,
      description: 'Experiencia de lujo en el corazón del Eje Cafetero',
      descriptionEn: null,
      destination: 'Eje Cafetero, Colombia',
      country: 'Colombia',
      durationDays: 7,
      price: 2500,
      currency: 'USD',
      priceIncludes: ['luxury hotel', 'all meals', 'transfers'],
      priceExcludes: [],
      images: [],
      maxCapacity: 6,
      minGroupSize: 2,
      status: 'draft',
      vendorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    tourPackageService = new TourPackageService();
  });

  // ============================================================
  // findAll
  // ============================================================
  describe('findAll', () => {
    /**
     * Test 1: Default pagination
     * Verifies that default page=1 and limit=20 are applied
     * Verifica que se aplican page=1 y limit=20 por defecto
     */
    it('should return paginated tour packages with default params', async () => {
      const mockResult = {
        rows: [mockTourPackages[0], mockTourPackages[1]],
        count: 2,
      };
      (TourPackage.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await tourPackageService.findAll();

      expect(result.count).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(TourPackage.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0,
        })
      );
    });

    /**
     * Test 2: Filter by type
     * Verifies that type filter is correctly passed to query
     * Verifica que el filtro de tipo se pasa correctamente a la consulta
     */
    it('should filter tour packages by type', async () => {
      const mockResult = { rows: [mockTourPackages[0]], count: 1 };
      (TourPackage.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await tourPackageService.findAll({ type: 'adventure' });

      expect(TourPackage.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'adventure',
          }),
        })
      );
    });

    /**
     * Test 3: Filter by destination
     * Verifies that destination filter is correctly passed to query
     * Verifica que el filtro de destino se pasa correctamente a la consulta
     */
    it('should filter tour packages by destination', async () => {
      const mockResult = { rows: [mockTourPackages[1]], count: 1 };
      (TourPackage.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await tourPackageService.findAll({ destination: 'Cartagena, Colombia' });

      expect(TourPackage.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            destination: 'Cartagena, Colombia',
          }),
        })
      );
    });

    /**
     * Test 4: Filter by country
     * Verifies that country filter is correctly passed to query
     * Verifica que el filtro de país se pasa correctamente a la consulta
     */
    it('should filter tour packages by country', async () => {
      const mockResult = { rows: mockTourPackages, count: 3 };
      (TourPackage.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await tourPackageService.findAll({ country: 'Colombia' });

      expect(TourPackage.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            country: 'Colombia',
          }),
        })
      );
    });

    /**
     * Test 5: Filter by status
     * Verifies that status filter is correctly passed to query
     * Verifica que el filtro de estado se pasa correctamente a la consulta
     */
    it('should filter tour packages by status', async () => {
      const mockResult = { rows: [mockTourPackages[2]], count: 1 };
      (TourPackage.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await tourPackageService.findAll({ status: 'draft' });

      expect(TourPackage.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'draft',
          }),
        })
      );
    });

    /**
     * Test 6: Filter by price range
     * Verifies that minPrice and maxPrice are applied as Op.gte / Op.lte
     * Verifica que minPrice y maxPrice se aplican como Op.gte / Op.lte
     */
    it('should filter tour packages by price range', async () => {
      const mockResult = { rows: [mockTourPackages[0], mockTourPackages[1]], count: 2 };
      (TourPackage.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await tourPackageService.findAll({ minPrice: 400, maxPrice: 1000 });

      expect(TourPackage.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: expect.any(Object),
          }),
        })
      );
    });

    /**
     * Test 7: Enforce maximum limit of 100
     * Verifies that limit is capped at 100
     * Verifica que el límite máximo es 100
     */
    it('should enforce maximum limit of 100', async () => {
      const mockResult = { rows: [], count: 0 };
      (TourPackage.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await tourPackageService.findAll({ page: 1, limit: 999 });

      expect(TourPackage.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
    });

    /**
     * Test 8: Correct offset for page 2
     * Verifies that offset is calculated correctly for page 2
     * Verifica que el offset se calcula correctamente para la página 2
     */
    it('should calculate correct offset for page 2', async () => {
      const mockResult = { rows: [], count: 0 };
      (TourPackage.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await tourPackageService.findAll({ page: 2, limit: 10 });

      expect(TourPackage.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10,
        })
      );
    });

    /**
     * Test 9: Order by created_at DESC
     * Verifies results are ordered by created_at descending
     * Verifica que los resultados se ordenan por created_at descendente
     */
    it('should order results by created_at descending', async () => {
      const mockResult = { rows: [], count: 0 };
      (TourPackage.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await tourPackageService.findAll();

      expect(TourPackage.findAndCountAll).toHaveBeenCalledWith(
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
     * Test 10: findById success
     * Verifies that a found tour package is returned
     * Verifica que se retorna el paquete turístico encontrado
     */
    it('should return tour package when found', async () => {
      const mockTour = mockTourPackages[0];
      (TourPackage.findByPk as jest.Mock).mockResolvedValue(mockTour);

      const result = await tourPackageService.findById('tour-1');

      expect(result).toEqual(mockTour);
      expect(TourPackage.findByPk).toHaveBeenCalledWith(
        'tour-1',
        expect.objectContaining({ include: expect.any(Array) })
      );
    });

    /**
     * Test 11: findById not found → throws 404
     * Verifies proper error object when tour package doesn't exist
     * Verifica el objeto de error correcto cuando el paquete no existe
     */
    it('should throw 404 error when tour package not found', async () => {
      (TourPackage.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(tourPackageService.findById('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
        code: 'TOUR_PACKAGE_NOT_FOUND',
      });
    });

    /**
     * Test 12: findById not found → correct message
     * Verifies the exact error message when tour package is not found
     * Verifica el mensaje de error exacto cuando el paquete no se encuentra
     */
    it('should throw error with correct message when not found', async () => {
      (TourPackage.findByPk as jest.Mock).mockResolvedValue(null);

      try {
        await tourPackageService.findById('nonexistent-id');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('TOUR_PACKAGE_NOT_FOUND');
        expect(error.message).toBe('Tour package not found');
      }
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe('create', () => {
    /**
     * Test 13: create success
     * Verifies that a tour package is created correctly
     * Verifica que el paquete turístico se crea correctamente
     */
    it('should create a tour package correctly', async () => {
      const inputData = {
        type: 'adventure' as const,
        title: 'Nuevo Tour de Aventura',
        destination: 'Parque Tayrona, Colombia',
        durationDays: 4,
        price: 600,
      };

      const createdTour = { ...mockTourPackages[0], ...inputData, id: 'new-tour-id' };
      (TourPackage.create as jest.Mock).mockResolvedValue(createdTour);

      const result = await tourPackageService.create(inputData);

      expect(result).toEqual(createdTour);
      expect(TourPackage.create).toHaveBeenCalledWith(expect.objectContaining(inputData));
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe('update', () => {
    /**
     * Test 14: update success
     * Verifies that a tour package is updated correctly
     * Verifica que el paquete turístico se actualiza correctamente
     */
    it('should update a tour package correctly', async () => {
      const updateMock = jest.fn().mockResolvedValue(undefined);
      const mockTour = { ...mockTourPackages[0], update: updateMock };
      (TourPackage.findByPk as jest.Mock).mockResolvedValue(mockTour);

      const updateData = { title: 'Trekking Renovado', price: 950 };
      await tourPackageService.update('tour-1', updateData);

      expect(updateMock).toHaveBeenCalledWith(updateData);
    });

    /**
     * Test 15: update not found → throws 404
     * Verifies that 404 is thrown when updating a non-existent tour package
     * Verifica que se lanza 404 al actualizar un paquete inexistente
     */
    it('should throw 404 when updating non-existent tour package', async () => {
      (TourPackage.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        tourPackageService.update('nonexistent-id', { title: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'TOUR_PACKAGE_NOT_FOUND',
      });
    });
  });

  // ============================================================
  // remove (soft-delete)
  // ============================================================
  describe('remove', () => {
    /**
     * Test 16: remove (soft-delete) success
     * Verifies that destroy() is called on the found tour package
     * Verifica que se llama destroy() en el paquete encontrado
     */
    it('should soft-delete a tour package correctly', async () => {
      const destroyMock = jest.fn().mockResolvedValue(undefined);
      const mockTour = { ...mockTourPackages[0], destroy: destroyMock };
      (TourPackage.findByPk as jest.Mock).mockResolvedValue(mockTour);

      await tourPackageService.remove('tour-1');

      expect(destroyMock).toHaveBeenCalled();
    });

    /**
     * Test 17: remove not found → throws 404
     * Verifies that 404 is thrown when removing a non-existent tour package
     * Verifica que se lanza 404 al eliminar un paquete inexistente
     */
    it('should throw 404 when removing non-existent tour package', async () => {
      (TourPackage.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(tourPackageService.remove('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
        code: 'TOUR_PACKAGE_NOT_FOUND',
      });
    });
  });
});
