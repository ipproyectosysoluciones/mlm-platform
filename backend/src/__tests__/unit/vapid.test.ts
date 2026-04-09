/**
 * @fileoverview VAPID Utils Unit Tests
 * @description Tests for VAPID key management functions
 *             Pruebas para funciones de gestión de claves VAPID
 * @module __tests__/unit/vapid
 */

import { getVapidPublicKey, getWebPush, validateVapid, vapidConfig } from '../../utils/vapid';

// Mock web-push
jest.mock('web-push', () => {
  const mockSetVapidDetails = jest.fn();
  const mockGenerateVAPIDKeys = jest.fn().mockReturnValue({
    publicKey: 'mock-public-key-12345',
    privateKey: 'mock-private-key-67890',
  });

  return {
    __esModule: true,
    default: {
      setVapidDetails: mockSetVapidDetails,
      generateVAPIDKeys: mockGenerateVAPIDKeys,
    },
    setVapidDetails: mockSetVapidDetails,
    generateVAPIDKeys: mockGenerateVAPIDKeys,
  };
});

// Mock the config module
jest.mock('../../config/vapid', () => ({
  vapidConfig: {
    publicKey: 'test-public-key',
    privateKey: 'test-private-key',
    subject: 'mailto:test@example.com',
  },
  validateVapidConfig: jest.fn(),
  generateKeys: jest.fn().mockReturnValue({
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key',
  }),
  VapidKeys: {},
}));

// Import mocks
import webpush from 'web-push';

describe('VAPID Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVapidPublicKey()', () => {
    it('should return the public key from config', () => {
      const publicKey = getVapidPublicKey();

      expect(publicKey).toBe('test-public-key');
    });

    it('should validate config before returning', async () => {
      const { validateVapidConfig } = await import('../../config/vapid');

      getVapidPublicKey();

      expect(validateVapidConfig).toHaveBeenCalled();
    });
  });

  describe('getWebPush()', () => {
    it('should return the web-push module', () => {
      const result = getWebPush();

      expect(result).toBe(webpush);
    });

    it('should configure VAPID details on each call', () => {
      getWebPush();

      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:test@example.com',
        'test-public-key',
        'test-private-key'
      );
    });

    it('should validate config before configuring', async () => {
      const { validateVapidConfig } = await import('../../config/vapid');

      getWebPush();

      expect(validateVapidConfig).toHaveBeenCalled();
    });
  });

  describe('validateVapid()', () => {
    it('should call validateVapidConfig', async () => {
      const { validateVapidConfig } = await import('../../config/vapid');

      validateVapid();

      expect(validateVapidConfig).toHaveBeenCalled();
    });
  });

  describe('generateKeys()', () => {
    it('should generate valid VAPID keys', async () => {
      const { generateKeys: generateKeysFromConfig } = await import('../../config/vapid');

      const keys = generateKeysFromConfig();

      expect(keys).toHaveProperty('publicKey');
      expect(keys).toHaveProperty('privateKey');
    });
  });

  describe('Error handling', () => {
    it('should throw error when VAPID keys are missing (via config)', async () => {
      // Re-mock with empty config
      jest.doMock('../../config/vapid', () => ({
        vapidConfig: {
          publicKey: '',
          privateKey: '',
          subject: 'mailto:test@example.com',
        },
        validateVapidConfig: jest.fn().mockImplementation(() => {
          throw new Error('VAPID keys are not configured');
        }),
      }));

      // Need to re-import to get new mock
      jest.resetModules();
      const { validateVapid } = await import('../../utils/vapid');

      expect(() => validateVapid()).toThrow('VAPID keys are not configured');
    });

    it('should throw error when getting public key with missing config', async () => {
      jest.doMock('../../config/vapid', () => ({
        vapidConfig: {
          publicKey: '',
          privateKey: '',
          subject: 'mailto:test@example.com',
        },
        validateVapidConfig: jest.fn().mockImplementation(() => {
          throw new Error('VAPID keys are not configured');
        }),
      }));

      jest.resetModules();
      const { getVapidPublicKey } = await import('../../utils/vapid');

      expect(() => getVapidPublicKey()).toThrow('VAPID keys are not configured');
    });

    it('should throw error when getting web-push with missing config', async () => {
      jest.doMock('../../config/vapid', () => ({
        vapidConfig: {
          publicKey: '',
          privateKey: '',
          subject: 'mailto:test@example.com',
        },
        validateVapidConfig: jest.fn().mockImplementation(() => {
          throw new Error('VAPID keys are not configured');
        }),
      }));

      jest.resetModules();
      const { getWebPush } = await import('../../utils/vapid');

      expect(() => getWebPush()).toThrow('VAPID keys are not configured');
    });
  });

  describe('vapidConfig export', () => {
    it('should export vapidConfig object', () => {
      expect(vapidConfig).toBeDefined();
      expect(vapidConfig).toHaveProperty('publicKey');
      expect(vapidConfig).toHaveProperty('privateKey');
      expect(vapidConfig).toHaveProperty('subject');
    });
  });
});
