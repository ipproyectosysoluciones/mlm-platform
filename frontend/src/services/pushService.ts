/**
 * @fileoverview Push Service - Push notification subscription management
 * @description Service for managing push notification subscriptions using Web Push API
 * @module services/pushService
 */

import api from './api';
import type {
  PushSubscribeRequest,
  PushSubscribeResponse,
  VapidPublicKeyResponse,
  PushSubscriptionJS,
} from '../types/push';

/**
 * Get the VAPID public key from the backend
 * @returns {Promise<string>} The VAPID public key in base64
 */
async function getVapidPublicKey(): Promise<string> {
  const response = await api.get<{ success: boolean; data: VapidPublicKeyResponse }>(
    '/push/vapid-public-key'
  );
  return response.data.data!.publicKey;
}

/**
 * Convert a base64 string to Uint8Array for VAPID keys
 * @param {string} base64String - Base64 encoded string
 * @returns {Uint8Array} The decoded bytes
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission from the user
 * @returns {Promise<NotificationPermission>} The permission state
 */
async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support push notifications');
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser does not support service workers');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe to push notifications
 * @returns {Promise<PushSubscribeResponse>} The subscription result
 */
async function subscribe(): Promise<PushSubscribeResponse> {
  // Request permission first
  const permission = await requestPermission();
  if (permission !== 'granted') {
    throw new Error(`Notification permission denied: ${permission}`);
  }

  // Get VAPID public key
  const vapidPublicKey = await getVapidPublicKey();

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // Subscribe to push notifications
  const pushSubscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });

  // Extract keys from the subscription
  const subscriptionKeys = pushSubscription.toJSON().keys;

  // Send subscription to backend
  const payload: PushSubscribeRequest = {
    endpoint: pushSubscription.endpoint,
    keys: {
      p256dh: subscriptionKeys?.p256dh || '',
      auth: subscriptionKeys?.auth || '',
    },
    userAgent: navigator.userAgent,
  };

  const response = await api.post<{ success: boolean; data: PushSubscribeResponse }>(
    '/push/subscribe',
    payload
  );

  return response.data.data!;
}

/**
 * Unsubscribe from push notifications
 * @param {string} endpoint - The push subscription endpoint to remove
 * @returns {Promise<void>}
 */
async function unsubscribe(endpoint?: string): Promise<void> {
  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // Get existing subscription
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    // Use provided endpoint or the current subscription
    const endpointToRemove = endpoint || subscription.endpoint;

    // Unsubscribe from push manager
    await subscription.unsubscribe();

    // Notify backend to remove the subscription
    await api.delete('/push/unsubscribe', {
      data: { endpoint: endpointToRemove },
    });
  }
}

/**
 * Check if the user is subscribed to push notifications
 * @returns {Promise<PushSubscriptionJS | null>} The current subscription or null
 */
async function getCurrentSubscription(): Promise<PushSubscriptionJS | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return null;

    const subKeys = subscription.toJSON().keys;
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subKeys?.p256dh || '',
        auth: subKeys?.auth || '',
      },
    };
  } catch {
    return null;
  }
}

/**
 * Get the current notification permission status
 * @returns {NotificationPermission} The current permission state
 */
function getPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export const pushService = {
  requestPermission,
  subscribe,
  unsubscribe,
  getCurrentSubscription,
  getPermissionStatus,
  getVapidPublicKey,
};

export default pushService;
