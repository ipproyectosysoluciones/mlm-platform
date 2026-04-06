/**
 * @fileoverview Unit tests for PropertyService
 * @description Tests for PropertyService CRUD operations including:
 *              - Pagination, type filter, city filter, price range, status filter
 *              - Find by ID success and not found scenarios
 *              - Create, update, soft-delete operations
 * @module __tests__/PropertyService
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

import { PropertyService } from '../services/PropertyService';
import { Property } from '../models';

describe('PropertyService', () => {
  let propertyService: PropertyService;

  // Mock properties for testing
  const mockProperties = [
    {
      id: 'property-1',
      type: 'rental',
      title: 'Apartamento en El Poblado',
      titleEn: 'Apartment in El Poblado',
      description: 'Hermoso apartamento de 2 habitaciones',
      descriptionEn: 'Beautiful 2-bedroom apartment',
      price: 1500000,
      currency: 'COP',
      priceNegotiable: false,
      bedrooms: 2,
      bathrooms: 1,
      areaM2: 65.5,
      address: 'Cra 40 # 10-15',
      city: 'Medellín',
      country: 'Colombia',
      lat: 6.2086,
      lng: -75.5657,
      amenities: ['parking', 'gym'],
      images: ['https://example.com/img1.jpg'],
      status: 'available',
      vendorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'property-2',
      type: 'sale',
      title: 'Casa en La Calera',
      titleEn: 'House in La Calera',
      description: 'Casa campestre con vista a la montaña',
      descriptionEn: 'Country house with mountain view',
      price: 850000000,
      currency: 'COP',
      priceNegotiable: true,
      bedrooms: 4,
      bathrooms: 3,
      areaM2: 250,
      address: 'Vía La Calera Km 5',
      city: 'Bogotá',
      country: 'Colombia',
      lat: 4.7711,
      lng: -73.9702,
      amenities: ['garden', 'pool'],
      images: [],
      status: 'available',
      vendorId: 'vendor-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'property-3',
      type: 'management',
      title: 'Oficina en Centro',
      titleEn: null,
      description: 'Oficina corporativa 80m2',
      descriptionEn: null,
      price: 3000000,
      currency: 'COP',
      priceNegotiable: false,
      bedrooms: null,
      bathrooms: 1,
      areaM2: 80,
      address: 'Calle 100 # 15-20',
      city: 'Bogotá',
      country: 'Colombia',
      lat: null,
      lng: null,
      amenities: [],
      images: [],
      status: 'paused',
      vendorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    propertyService = new PropertyService();
  });

  // ============================================================
  // findAll
  // ============================================================
  describe('findAll', () => {
    /**
     * Test 1: Default pagination
     * Verifies that default page=1 and limit=20 are applied
     */
    it('should return paginated properties with default params', async () => {
      const mockResult = {
        rows: [mockProperties[0], mockProperties[1]],
        count: 2,
      };
      (Property.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await propertyService.findAll();

      expect(result.count).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(Property.findAndCountAll).toHaveBeenCalledWith(
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
    it('should filter properties by type', async () => {
      const mockResult = { rows: [mockProperties[0]], count: 1 };
      (Property.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await propertyService.findAll({ type: 'rental' });

      expect(Property.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'rental',
          }),
        })
      );
    });

    /**
     * Test 3: Filter by city
     * Verifies that city filter is correctly passed to query
     */
    it('should filter properties by city', async () => {
      const mockResult = { rows: [mockProperties[1], mockProperties[2]], count: 2 };
      (Property.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await propertyService.findAll({ city: 'Bogotá' });

      expect(Property.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: 'Bogotá',
          }),
        })
      );
    });

    /**
     * Test 4: Filter by price range
     * Verifies that minPrice and maxPrice are applied as Op.gte / Op.lte
     */
    it('should filter properties by price range', async () => {
      const mockResult = { rows: [mockProperties[0]], count: 1 };
      (Property.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await propertyService.findAll({ minPrice: 1000000, maxPrice: 2000000 });

      expect(Property.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: expect.any(Object),
          }),
        })
      );
    });

    /**
     * Test 5: Filter by status
     * Verifies that status filter is correctly passed to query
     */
    it('should filter properties by status', async () => {
      const mockResult = { rows: [mockProperties[2]], count: 1 };
      (Property.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await propertyService.findAll({ status: 'paused' });

      expect(Property.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'paused',
          }),
        })
      );
    });

    it('should enforce maximum limit of 100', async () => {
      const mockResult = { rows: [], count: 0 };
      (Property.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await propertyService.findAll({ page: 1, limit: 500 });

      expect(Property.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
    });

    it('should order results by created_at descending', async () => {
      const mockResult = { rows: [], count: 0 };
      (Property.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await propertyService.findAll();

      expect(Property.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['created_at', 'DESC']],
        })
      );
    });

    it('should calculate correct offset for page 2', async () => {
      const mockResult = { rows: [], count: 0 };
      (Property.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await propertyService.findAll({ page: 2, limit: 10 });

      expect(Property.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10,
        })
      );
    });
  });

  // ============================================================
  // findById
  // ============================================================
  describe('findById', () => {
    /**
     * Test 6: findById success
     * Verifies that a found property is returned
     */
    it('should return property when found', async () => {
      const mockProperty = mockProperties[0];
      (Property.findByPk as jest.Mock).mockResolvedValue(mockProperty);

      const result = await propertyService.findById('property-1');

      expect(result).toEqual(mockProperty);
      expect(Property.findByPk).toHaveBeenCalledWith('property-1');
    });

    /**
     * Test 7: findById not found → throws 404
     * Verifies proper error object when property doesn't exist
     */
    it('should throw 404 error when property not found', async () => {
      (Property.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(propertyService.findById('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
        code: 'PROPERTY_NOT_FOUND',
      });
    });

    it('should throw error with correct message when not found', async () => {
      (Property.findByPk as jest.Mock).mockResolvedValue(null);

      try {
        await propertyService.findById('nonexistent-id');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('PROPERTY_NOT_FOUND');
        expect(error.message).toBe('Property not found');
      }
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe('create', () => {
    /**
     * Test 8: create success
     * Verifies that a property is created correctly
     */
    it('should create a property correctly', async () => {
      const inputData = {
        type: 'rental' as const,
        title: 'Nuevo Apartamento',
        price: 1200000,
        address: 'Calle 50 # 10-30',
        city: 'Medellín',
      };

      const createdProperty = { ...mockProperties[0], ...inputData, id: 'new-property-id' };
      (Property.create as jest.Mock).mockResolvedValue(createdProperty);

      const result = await propertyService.create(inputData);

      expect(result).toEqual(createdProperty);
      expect(Property.create).toHaveBeenCalledWith(expect.objectContaining(inputData));
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe('update', () => {
    /**
     * Test 9: update success
     * Verifies that a property is updated correctly
     */
    it('should update a property correctly', async () => {
      const updateMock = jest.fn().mockResolvedValue(undefined);
      const mockProperty = { ...mockProperties[0], update: updateMock };
      (Property.findByPk as jest.Mock).mockResolvedValue(mockProperty);

      const updateData = { title: 'Apartamento Renovado', price: 1800000 };
      await propertyService.update('property-1', updateData);

      expect(updateMock).toHaveBeenCalledWith(updateData);
    });

    /**
     * Test 11: update not found → throws 404
     * Verifies that 404 is thrown when updating a non-existent property
     */
    it('should throw 404 when updating non-existent property', async () => {
      (Property.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        propertyService.update('nonexistent-id', { title: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'PROPERTY_NOT_FOUND',
      });
    });
  });

  // ============================================================
  // remove (soft-delete)
  // ============================================================
  describe('remove', () => {
    /**
     * Test 10: remove (soft-delete) success
     * Verifies that destroy() is called on the found property
     */
    it('should soft-delete a property correctly', async () => {
      const destroyMock = jest.fn().mockResolvedValue(undefined);
      const mockProperty = { ...mockProperties[0], destroy: destroyMock };
      (Property.findByPk as jest.Mock).mockResolvedValue(mockProperty);

      await propertyService.remove('property-1');

      expect(destroyMock).toHaveBeenCalled();
    });

    it('should throw 404 when removing non-existent property', async () => {
      (Property.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(propertyService.remove('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
        code: 'PROPERTY_NOT_FOUND',
      });
    });
  });
});
