/**
 * @fileoverview Push Types - TypeScript interfaces for push notifications
 * @description Push subscription and notification types
 * @module types/push
 */

/**
 * Push subscription keys from the browser
 */
export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

/**
 * Push subscription data stored in the database
 */
export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keysPublic: string;
  keysAuth: string;
  userAgent?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Request payload for subscribing to push notifications
 */
export interface PushSubscribeRequest {
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
}

/**
 * Response after subscribing
 */
export interface PushSubscribeResponse {
  id: string;
  createdAt: string;
}

/**
 * Request payload for unsubscribing from push notifications
 */
export interface PushUnsubscribeRequest {
  endpoint: string;
}

/**
 * VAPID public key response
 */
export interface VapidPublicKeyResponse {
  publicKey: string;
}

/**
 * Push notification payload sent to the browser
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  vibrate?: number[];
  tag?: string;
  renotify?: boolean;
  silent?: boolean;
}

/**
 * Frontend push subscription state
 */
export interface PushSubscriptionState {
  subscription: PushSubscriptionJS | null;
  permission: NotificationPermission;
  isSubscribed: boolean;
}

/**
 * Browser PushSubscription interface (from Push API)
 */
export interface PushSubscriptionJS {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
