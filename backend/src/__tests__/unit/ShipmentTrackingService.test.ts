/**
 * @fileoverview ShipmentTrackingService Unit Tests
 * @description Tests for shipment tracking, status updates, and idempotency.
 * @module __tests__/unit/ShipmentTrackingService.test
 */

// Mock sequelize first
const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockImplementation(() => Promise.resolve(mockTransaction)),
    query: jest.fn(),
    sync: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
  },
  resetSequelize: jest.fn(),
}));

// Mock all models needed by the service
const mockShipmentTracking = {
  create: jest.fn(),
  findOne: jest.fn(),
  init: jest.fn(),
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
};

const mockOrder = {
  findByPk: jest.fn(),
  init: jest.fn(),
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
};

jest.mock('../../models', () => ({
  ShipmentTracking: mockShipmentTracking,
  Order: mockOrder,
  VendorOrder: {
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  DeliveryProvider: {
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
}));

// Mock AppError
jest.mock('../../middleware/error.middleware', () => ({
  AppError: class AppError extends Error {
    constructor(
      public statusCode: number,
      public code: string,
      message: string
    ) {
      super(message);
      this.name = 'AppError';
    }
  },
}));

// Now import after mocks are in place
import { ShipmentTrackingService } from '../../services/ShipmentTrackingService';

describe('ShipmentTrackingService', () => {
  let service: ShipmentTrackingService;

  beforeEach(() => {
    service = new ShipmentTrackingService();
    jest.clearAllMocks();
  });

  describe('addTracking', () => {
    it('should create tracking record for order', async () => {
      const mockOrderInstance = { id: 'order-uuid', update: jest.fn() };
      const mockTracking = {
        id: 'tracking-uuid',
        orderId: 'order-uuid',
        trackingNumber: 'TRACK123',
        status: 'picked_up',
      };

      (mockOrder.findByPk as jest.Mock).mockResolvedValue(mockOrderInstance);
      (mockShipmentTracking.create as jest.Mock).mockResolvedValue(mockTracking);

      const result = await service.addTracking('order-uuid', {
        trackingNumber: 'TRACK123',
      });

      expect(result.trackingNumber).toBe('TRACK123');
      expect(mockOrderInstance.update).toHaveBeenCalledWith({ shippingStatus: 'shipped' });
    });

    it('should throw error when order not found', async () => {
      (mockOrder.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addTracking('non-existent', {
          trackingNumber: 'TRACK123',
        })
      ).rejects.toThrow('Order not found');
    });
  });

  describe('updateStatus', () => {
    it('should append new status to statusHistory', async () => {
      const mockTrackingInstance = {
        id: 'tracking-uuid',
        trackingNumber: 'TRACK123',
        statusHistory: [{ status: 'pending', timestamp: new Date() }],
        orderId: 'order-uuid',
        update: jest.fn(),
        reload: jest.fn().mockResolvedValue({
          id: 'tracking-uuid',
          status: 'in_transit',
        }),
      };

      const mockOrderInstance = {
        id: 'order-uuid',
        update: jest.fn(),
      };

      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue(mockTrackingInstance);
      (mockOrder.findByPk as jest.Mock).mockResolvedValue(mockOrderInstance);

      const result = await service.updateStatus('TRACK123', 'in_transit', 'Package in transit');

      expect(result.status).toBe('in_transit');
    });

    it('should update order shipping status based on tracking status', async () => {
      const mockOrderInstance = {
        id: 'order-uuid',
        update: jest.fn(),
      };

      const mockTrackingInstance = {
        id: 'tracking-uuid',
        trackingNumber: 'TRACK123',
        statusHistory: [],
        orderId: 'order-uuid',
        update: jest.fn(),
        reload: jest.fn().mockResolvedValue({
          id: 'tracking-uuid',
          status: 'delivered',
        }),
      };

      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue(mockTrackingInstance);
      (mockOrder.findByPk as jest.Mock).mockResolvedValue(mockOrderInstance);

      await service.updateStatus('TRACK123', 'delivered');

      expect(mockOrderInstance.update).toHaveBeenCalledWith({ shippingStatus: 'delivered' });
    });

    it('should throw error when tracking not found', async () => {
      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateStatus('NONEXISTENT', 'delivered')).rejects.toThrow(
        'Shipment tracking not found'
      );
    });
  });

  describe('isDuplicateUpdate', () => {
    it('should return true if same status and timestamp exists', async () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      const mockTracking = {
        trackingNumber: 'TRACK123',
        statusHistory: [{ status: 'in_transit', timestamp }],
      };

      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue(mockTracking);

      const result = await service.isDuplicateUpdate('TRACK123', 'in_transit', timestamp);

      expect(result).toBe(true);
    });

    it('should return false if status does not exist', async () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      const mockTracking = {
        trackingNumber: 'TRACK123',
        statusHistory: [{ status: 'pending', timestamp }],
      };

      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue(mockTracking);

      const result = await service.isDuplicateUpdate('TRACK123', 'in_transit', timestamp);

      expect(result).toBe(false);
    });

    it('should return false if tracking not found', async () => {
      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.isDuplicateUpdate('TRACK123', 'delivered', new Date());

      expect(result).toBe(false);
    });
  });

  describe('handleWebhookUpdate', () => {
    it('should add new status to history (not duplicate)', async () => {
      const mockTrackingInstance = {
        id: 'tracking-uuid',
        trackingNumber: 'TRACK123',
        status: 'pending',
        statusHistory: [{ status: 'pending', timestamp: new Date() }],
        orderId: 'order-uuid',
        update: jest.fn(),
        reload: jest.fn().mockResolvedValue({
          id: 'tracking-uuid',
          status: 'in_transit',
          statusHistory: [
            { status: 'pending', timestamp: new Date() },
            { status: 'in_transit', timestamp: new Date() },
          ],
        }),
      };

      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue(mockTrackingInstance);

      const result = await service.handleWebhookUpdate('TRACK123', 'in_transit');

      expect(result.isNew).toBe(true);
    });

    it('should return isNew=false for duplicate status', async () => {
      const existingTimestamp = new Date('2024-01-01T10:00:00Z');
      const mockTrackingInstance = {
        id: 'tracking-uuid',
        trackingNumber: 'TRACK123',
        status: 'in_transit',
        statusHistory: [
          { status: 'pending', timestamp: existingTimestamp },
          { status: 'in_transit', timestamp: existingTimestamp },
        ],
        orderId: null,
        update: jest.fn(),
        reload: jest.fn(),
      };

      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue(mockTrackingInstance);

      const result = await service.handleWebhookUpdate('TRACK123', 'in_transit');

      expect(result.isNew).toBe(false);
      expect(mockTrackingInstance.update).not.toHaveBeenCalled();
    });
  });

  describe('getByOrder', () => {
    it('should return tracking for order', async () => {
      const mockTracking = { id: 'tracking-uuid', orderId: 'order-uuid' };
      const mockProvider = { id: 'provider-uuid', name: 'Test Provider' };

      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue({
        ...mockTracking,
        provider: mockProvider,
      });

      const result = await service.getByOrder('order-uuid');

      expect(result).toBeDefined();
    });

    it('should return null when no tracking exists', async () => {
      (mockShipmentTracking.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getByOrder('order-uuid');

      expect(result).toBeNull();
    });
  });
});
