/**
 * @fileoverview pushService.test — Push notification service unit tests
 * @description Tests for the push notification subscription service using Web Push API.
 *              Cubre la gestión de suscripciones push: permisos, subscribe, unsubscribe, estado.
 *
 * @module test/pushService
 * @author Nexo Real Development Team
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pushService } from '../services/pushService';

// ============================================
// Mocks / Mocks de dependencias
// ============================================

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../services/api';

// ─── Mock PushSubscription (browser API) ───────────────────────────────────
const mockPushSubscriptionEndpoint = 'https://push.example.com/sub/abc123';

const makeMockPushSubscription = (endpoint = mockPushSubscriptionEndpoint) => ({
  endpoint,
  unsubscribe: vi.fn().mockResolvedValue(true),
  toJSON: vi.fn().mockReturnValue({
    endpoint,
    keys: { p256dh: 'p256dh-key-value', auth: 'auth-key-value' },
  }),
  getKey: vi.fn(),
  options: { userVisibleOnly: true, applicationServerKey: null },
});

// ─── Mock ServiceWorkerRegistration ───────────────────────────────────────
const makeMockRegistration = (
  subscription: ReturnType<typeof makeMockPushSubscription> | null = null
) => ({
  pushManager: {
    subscribe: vi.fn().mockResolvedValue(makeMockPushSubscription()),
    getSubscription: vi.fn().mockResolvedValue(subscription),
  },
  scope: '/',
  installing: null,
  waiting: null,
  active: null,
});

// ─── Navigator / Notification mocks ──────────────────────────────────────
const mockOnLine = true;

const setupNavigatorMocks = (
  opts: {
    hasNotification?: boolean;
    hasSW?: boolean;
    permission?: NotificationPermission;
  } = {}
) => {
  const { hasNotification = true, hasSW = true, permission = 'granted' } = opts;

  if (hasNotification) {
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      writable: true,
      value: {
        requestPermission: vi.fn().mockResolvedValue(permission),
        permission,
      },
    });
  } else {
    // Simulate browser without Notification: make 'Notification' in window === false
    // by using a getter that throws the same way the source code checks it
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      get: () => undefined,
    });
  }

  if (hasSW) {
    const mockRegistration = makeMockRegistration();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration),
        register: vi.fn(),
      },
    });
  } else {
    // Simulate browser without serviceWorker support
    // We need to delete it so 'serviceWorker' in navigator === false
    try {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        get: () => undefined,
      });
    } catch {
      // ignore if not configurable in this environment
    }
  }

  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => mockOnLine,
  });

  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    get: () => 'TestAgent/1.0',
  });
};

// ─── window.atob mock ─────────────────────────────────────────────────────
const setupAtobMock = () => {
  Object.defineProperty(window, 'atob', {
    configurable: true,
    writable: true,
    value: (str: string) => Buffer.from(str, 'base64').toString('binary'),
  });
};

// ============================================
// Test Suite
// ============================================

describe('pushService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupNavigatorMocks();
    setupAtobMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────
  // getVapidPublicKey
  // ──────────────────────────────────────────
  describe('getVapidPublicKey', () => {
    it('debe retornar la clave pública VAPID del backend / should return VAPID public key', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { success: true, data: { publicKey: 'test-vapid-public-key' } },
      });

      const key = await pushService.getVapidPublicKey();

      expect(key).toBe('test-vapid-public-key');
      expect(api.get).toHaveBeenCalledWith('/push/vapid-public-key');
    });

    it('debe propagar el error si la API falla / should propagate error on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(pushService.getVapidPublicKey()).rejects.toThrow('Network error');
    });
  });

  // ──────────────────────────────────────────
  // requestPermission
  // ──────────────────────────────────────────
  describe('requestPermission', () => {
    it('debe retornar "granted" cuando el usuario acepta / should return "granted" when user accepts', async () => {
      const result = await pushService.requestPermission();
      expect(result).toBe('granted');
    });

    it('debe retornar "denied" cuando el usuario rechaza / should return "denied" when user denies', async () => {
      setupNavigatorMocks({ permission: 'denied' });
      const result = await pushService.requestPermission();
      expect(result).toBe('denied');
    });

    it('debe retornar "default" cuando el permiso es default / should return "default" when permission is default', async () => {
      setupNavigatorMocks({ permission: 'default' });
      const result = await pushService.requestPermission();
      expect(result).toBe('default');
    });

    it('debe llamar a Notification.requestPermission una vez / should call requestPermission once', async () => {
      setupNavigatorMocks({ permission: 'granted' });
      await pushService.requestPermission();
      expect(window.Notification.requestPermission).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────
  // subscribe
  // ──────────────────────────────────────────
  describe('subscribe', () => {
    it('debe suscribir exitosamente y enviar al backend / should subscribe and post to backend', async () => {
      const mockSubscription = makeMockPushSubscription();
      const mockRegistration = makeMockRegistration();
      mockRegistration.pushManager.subscribe.mockResolvedValueOnce(mockSubscription);

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: { ready: Promise.resolve(mockRegistration) },
      });

      vi.mocked(api.get).mockResolvedValueOnce({
        data: { success: true, data: { publicKey: 'dGVzdC1rZXk=' } }, // base64 "test-key"
      });
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { success: true, data: { id: 'sub-001', createdAt: '2024-01-01T00:00:00Z' } },
      });

      const result = await pushService.subscribe();

      expect(result).toEqual({ id: 'sub-001', createdAt: '2024-01-01T00:00:00Z' });
      expect(api.post).toHaveBeenCalledWith(
        '/push/subscribe',
        expect.objectContaining({
          endpoint: mockPushSubscriptionEndpoint,
          keys: { p256dh: 'p256dh-key-value', auth: 'auth-key-value' },
          userAgent: 'TestAgent/1.0',
        })
      );
    });

    it('debe lanzar error si el permiso es "denied" / should throw if permission denied', async () => {
      setupNavigatorMocks({ permission: 'denied' });

      await expect(pushService.subscribe()).rejects.toThrow(
        'Notification permission denied: denied'
      );
    });

    it('debe lanzar error si el permiso es "default" (dismissed) / should throw if permission default', async () => {
      setupNavigatorMocks({ permission: 'default' });

      await expect(pushService.subscribe()).rejects.toThrow(
        'Notification permission denied: default'
      );
    });

    it('debe propagar error si el pushManager.subscribe falla / should propagate pushManager error', async () => {
      const mockRegistration = makeMockRegistration();
      mockRegistration.pushManager.subscribe.mockRejectedValueOnce(
        new Error('Push subscribe failed')
      );

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: { ready: Promise.resolve(mockRegistration) },
      });

      vi.mocked(api.get).mockResolvedValueOnce({
        data: { success: true, data: { publicKey: 'dGVzdC1rZXk=' } },
      });

      await expect(pushService.subscribe()).rejects.toThrow('Push subscribe failed');
    });
  });

  // ──────────────────────────────────────────
  // unsubscribe
  // ──────────────────────────────────────────
  describe('unsubscribe', () => {
    it('debe desuscribir y notificar al backend / should unsubscribe and notify backend', async () => {
      const mockSub = makeMockPushSubscription();
      const mockRegistration = makeMockRegistration(mockSub);

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: { ready: Promise.resolve(mockRegistration) },
      });

      vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });

      await pushService.unsubscribe();

      expect(mockSub.unsubscribe).toHaveBeenCalled();
      expect(api.delete).toHaveBeenCalledWith('/push/unsubscribe', {
        data: { endpoint: mockPushSubscriptionEndpoint },
      });
    });

    it('debe usar el endpoint provisto si se pasa como argumento / should use provided endpoint', async () => {
      const customEndpoint = 'https://push.example.com/custom-endpoint';
      const mockSub = makeMockPushSubscription();
      const mockRegistration = makeMockRegistration(mockSub);

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: { ready: Promise.resolve(mockRegistration) },
      });

      vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });

      await pushService.unsubscribe(customEndpoint);

      expect(api.delete).toHaveBeenCalledWith('/push/unsubscribe', {
        data: { endpoint: customEndpoint },
      });
    });

    it('no debe hacer nada si no hay suscripción activa / should do nothing if no subscription', async () => {
      const mockRegistration = makeMockRegistration(null); // no subscription

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: { ready: Promise.resolve(mockRegistration) },
      });

      await pushService.unsubscribe();

      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // getCurrentSubscription
  // ──────────────────────────────────────────
  describe('getCurrentSubscription', () => {
    it('debe retornar la suscripción actual si existe / should return current subscription', async () => {
      const mockSub = makeMockPushSubscription();
      const mockRegistration = makeMockRegistration(mockSub);

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: { ready: Promise.resolve(mockRegistration) },
      });

      const result = await pushService.getCurrentSubscription();

      expect(result).toEqual({
        endpoint: mockPushSubscriptionEndpoint,
        keys: { p256dh: 'p256dh-key-value', auth: 'auth-key-value' },
      });
    });

    it('debe retornar null si no hay suscripción / should return null if no subscription', async () => {
      const mockRegistration = makeMockRegistration(null);

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: { ready: Promise.resolve(mockRegistration) },
      });

      const result = await pushService.getCurrentSubscription();
      expect(result).toBeNull();
    });

    it('debe retornar null si el browser no soporta serviceWorker / should return null without SW support', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: undefined,
      });

      const result = await pushService.getCurrentSubscription();
      expect(result).toBeNull();
    });

    it('debe retornar null si serviceWorker.ready rechaza / should return null if SW ready rejects', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        writable: true,
        value: { ready: Promise.reject(new Error('SW not available')) },
      });

      const result = await pushService.getCurrentSubscription();
      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────
  // getPermissionStatus
  // ──────────────────────────────────────────
  describe('getPermissionStatus', () => {
    it('debe retornar el estado del permiso actual / should return current permission state', () => {
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: { permission: 'granted', requestPermission: vi.fn() },
      });

      const status = pushService.getPermissionStatus();
      expect(status).toBe('granted');
    });

    it('debe retornar "denied" cuando el permiso es denied / should return "denied" when permission is denied', () => {
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: { permission: 'denied', requestPermission: vi.fn() },
      });

      const status = pushService.getPermissionStatus();
      expect(status).toBe('denied');
    });

    it('debe retornar "default" si no se ha pedido permiso / should return "default" if not yet requested', () => {
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: { permission: 'default', requestPermission: vi.fn() },
      });

      const status = pushService.getPermissionStatus();
      expect(status).toBe('default');
    });
  });
});
