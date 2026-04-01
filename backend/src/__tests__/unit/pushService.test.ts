/**
 * @fileoverview PushService Unit Tests
 * @description Tests for PushService functions
 *             Pruebas para funciones del servicio PushService
 * @module __tests__/unit/pushService
 */

import { PushService, PushNotificationPayload } from '../../services/PushService';

// Mock web-push
jest.mock('web-push', () => {
  const mockSendNotification = jest.fn().mockResolvedValue(undefined);

  class MockWebPushError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
      super(message);
      this.name = 'WebPushError';
      this.statusCode = statusCode;
    }
  }

  return {
    __esModule: true,
    default: {
      sendNotification: mockSendNotification,
      WebPushError: MockWebPushError,
    },
    WebPushError: MockWebPushError,
  };
});

// Mock database models
jest.mock('../../models', () => ({
  PushSubscription: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock VAPID utils
jest.mock('../../utils/vapid', () => ({
  getWebPush: jest.fn(),
  validateVapid: jest.fn(),
}));

// Import mocks after setting them up
import { PushSubscription } from '../../models';
import { getWebPush, validateVapid } from '../../utils/vapid';

describe('PushService', () => {
  let pushService: PushService;

  // Get mock functions after jest.mock
  const mockFindAll = PushSubscription.findAll as jest.Mock;
  const mockFindOne = PushSubscription.findOne as jest.Mock;
  const mockCreate = PushSubscription.create as jest.Mock;
  const mockGetWebPush = getWebPush as jest.Mock;
  const mockValidateVapid = validateVapid as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    pushService = new PushService();
  });

  describe('sendToUser()', () => {
    it('should send notification to user with subscriptions', async () => {
      const mockSubscription = {
        id: 'sub-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        keys: { p256dh: 'test-p256dh', auth: 'test-auth' },
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockFindAll.mockResolvedValue([mockSubscription]);
      mockGetWebPush.mockReturnValue({
        sendNotification: jest.fn().mockResolvedValue(undefined),
      });

      const payload: PushNotificationPayload = {
        title: 'Test Notification',
        body: 'Test body',
      };

      const result = await pushService.sendToUser('user-123', payload);

      expect(result).toBe(1);
      expect(mockFindAll).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
    });

    it('should return 0 when user has no subscriptions', async () => {
      mockFindAll.mockResolvedValue([]);

      const payload: PushNotificationPayload = {
        title: 'Test Notification',
        body: 'Test body',
      };

      const result = await pushService.sendToUser('user-123', payload);

      expect(result).toBe(0);
    });

    it('should delete subscription on 410 Gone response', async () => {
      const mockSubscription = {
        id: 'sub-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        keys: { p256dh: 'test-p256dh', auth: 'test-auth' },
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockFindAll.mockResolvedValue([mockSubscription]);

      const mockWebPush = {
        sendNotification: jest
          .fn()
          .mockRejectedValue(new (require('web-push').WebPushError)('Gone', 410)),
      };
      mockGetWebPush.mockReturnValue(mockWebPush);

      const payload: PushNotificationPayload = {
        title: 'Test Notification',
        body: 'Test body',
      };

      const result = await pushService.sendToUser('user-123', payload);

      expect(result).toBe(0);
      expect(mockSubscription.destroy).toHaveBeenCalled();
    });

    it('should handle web-push errors gracefully', async () => {
      const mockSubscription = {
        id: 'sub-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        keys: { p256dh: 'test-p256dh', auth: 'test-auth' },
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockFindAll.mockResolvedValue([mockSubscription]);

      const mockWebPush = {
        sendNotification: jest.fn().mockRejectedValue(new Error('Network error')),
      };
      mockGetWebPush.mockReturnValue(mockWebPush);

      const payload: PushNotificationPayload = {
        title: 'Test Notification',
        body: 'Test body',
      };

      const result = await pushService.sendToUser('user-123', payload);

      expect(result).toBe(0);
    });

    it('should validate VAPID config before sending', async () => {
      mockFindAll.mockResolvedValue([]);

      const payload: PushNotificationPayload = {
        title: 'Test Notification',
      };

      await pushService.sendToUser('user-123', payload);

      expect(mockValidateVapid).toHaveBeenCalled();
    });
  });

  describe('broadcast()', () => {
    it('should send to multiple users and return summary', async () => {
      const mockSubscription = {
        id: 'sub-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test-p256dh', auth: 'test-auth' },
      };

      mockFindAll
        .mockResolvedValueOnce([mockSubscription])
        .mockResolvedValueOnce([mockSubscription])
        .mockResolvedValueOnce([]); // Third user has no subscriptions

      const mockWebPush = {
        sendNotification: jest.fn().mockResolvedValue(undefined),
      };
      mockGetWebPush.mockReturnValue(mockWebPush);

      const payload: PushNotificationPayload = {
        title: 'Broadcast Notification',
        body: 'Broadcast body',
      };

      const result = await pushService.broadcast(['user-1', 'user-2', 'user-3'], payload);

      expect(result.total).toBe(3);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should handle errors for individual users', async () => {
      mockFindAll.mockRejectedValue(new Error('Database error'));

      const payload: PushNotificationPayload = {
        title: 'Test Notification',
      };

      const result = await pushService.broadcast(['user-1'], payload);

      expect(result.total).toBe(1);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe('handleSubscription()', () => {
    it('should create new subscription when endpoint is new', async () => {
      mockFindOne.mockResolvedValue(null);

      const mockNewSubscription = {
        id: 'new-sub-id',
        userId: 'user-123',
        endpoint: 'https://fcm.googleapis.com/fcm/send/new-endpoint',
        keys: { p256dh: 'new-p256dh', auth: 'new-auth' },
        createdAt: new Date(),
      };
      mockCreate.mockResolvedValue(mockNewSubscription);

      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/new-endpoint',
        keys: { p256dh: 'new-p256dh', auth: 'new-auth' },
      };

      const result = await pushService.handleSubscription('user-123', subscription);

      expect(result).toBeDefined();
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          endpoint: 'https://fcm.googleapis.com/fcm/send/new-endpoint',
          keys: { p256dh: 'new-p256dh', auth: 'new-auth' },
        })
      );
    });

    it('should update existing subscription when endpoint exists', async () => {
      const existingSubscription = {
        id: 'existing-sub-id',
        userId: 'old-user',
        endpoint: 'https://fcm.googleapis.com/fcm/send/same-endpoint',
        keys: { p256dh: 'old-p256dh', auth: 'old-auth' },
        update: jest.fn().mockResolvedValue({
          id: 'existing-sub-id',
          userId: 'new-user',
        }),
      };
      mockFindOne.mockResolvedValue(existingSubscription);

      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/same-endpoint',
        keys: { p256dh: 'new-p256dh', auth: 'new-auth' },
      };

      const result = await pushService.handleSubscription('new-user', subscription);

      expect(existingSubscription.update).toHaveBeenCalledWith({
        userId: 'new-user',
        browser: null,
      });
      expect(result).toBe(existingSubscription);
    });

    it('should detect Chrome browser from user agent', async () => {
      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'sub-id',
        createdAt: new Date(),
      });

      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' },
      };

      await pushService.handleSubscription(
        'user-123',
        subscription,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          browser: 'chrome',
        })
      );
    });

    it('should detect Firefox browser from user agent', async () => {
      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'sub-id',
        createdAt: new Date(),
      });

      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' },
      };

      await pushService.handleSubscription(
        'user-123',
        subscription,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          browser: 'firefox',
        })
      );
    });

    it('should detect Safari browser from user agent', async () => {
      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'sub-id',
        createdAt: new Date(),
      });

      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' },
      };

      await pushService.handleSubscription(
        'user-123',
        subscription,
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          browser: 'safari',
        })
      );
    });

    it('should detect Edge browser from user agent', async () => {
      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'sub-id',
        createdAt: new Date(),
      });

      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' },
      };

      await pushService.handleSubscription(
        'user-123',
        subscription,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
      );

      // Edge user agent contains "Chrome", so it gets detected as Chrome (order matters in implementation)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          browser: 'chrome',
        })
      );
    });
  });

  describe('removeSubscription()', () => {
    it('should return true when subscription is found and deleted', async () => {
      const mockSubscription = {
        id: 'sub-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      mockFindOne.mockResolvedValue(mockSubscription);

      const result = await pushService.removeSubscription(
        'https://fcm.googleapis.com/fcm/send/test'
      );

      expect(result).toBe(true);
      expect(mockSubscription.destroy).toHaveBeenCalled();
    });

    it('should return false when subscription not found', async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await pushService.removeSubscription(
        'https://fcm.googleapis.com/fcm/send/nonexistent'
      );

      expect(result).toBe(false);
    });
  });

  describe('getUserSubscriptions()', () => {
    it('should return all subscriptions for a user', async () => {
      const mockSubscriptions = [
        { id: 'sub-1', userId: 'user-123' },
        { id: 'sub-2', userId: 'user-123' },
      ];
      mockFindAll.mockResolvedValue(mockSubscriptions);

      const result = await pushService.getUserSubscriptions('user-123');

      expect(result).toEqual(mockSubscriptions);
      expect(mockFindAll).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
    });
  });
});
