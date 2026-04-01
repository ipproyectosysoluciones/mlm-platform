/**
 * @fileoverview PushService - Send push notifications to users
 * @description Service for sending push notifications via web-push
 * @module services/PushService
 * @author MLM Development Team
 *
 * @example
 * // English: Send notification to a user
 * import { pushService } from './PushService';
 * await pushService.sendToUser(userId, {
 *   title: 'New Commission Earned!',
 *   body: 'You earned $50 from your referral',
 * });
 *
 * // Español: Enviar notificación a un usuario
 * import { pushService } from './PushService';
 * await pushService.sendToUser(usuarioId, {
 *   title: '¡Nueva comisión ganada!',
 *   body: 'Ganaste $50 de tu referido',
 * });
 */
import webpush from 'web-push';
import { PushSubscription } from '../models';
import { getWebPush, validateVapid } from '../utils/vapid';

export interface PushNotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * PushService - Handles push notification sending
 * Servicio Push - Maneja el envío de notificaciones push
 */
export class PushService {
  /**
   * Send a push notification to a specific user
   * Enviar una notificación push a un usuario específico
   *
   * @param userId - User ID to send notification to
   * @param payload - Notification payload
   * @returns Promise with number of successful sends
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<number> {
    validateVapid();

    // Get all subscriptions for this user
    const subscriptions = await PushSubscription.findAll({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log(`[PushService] No subscriptions found for user ${userId}`);
      return 0;
    }

    const payloadString = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body || '',
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/badge.png',
        data: payload.data,
        actions: payload.actions,
      },
    });

    let successCount = 0;

    for (const subscription of subscriptions) {
      try {
        const pushSubscription: WebPushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys as unknown as { p256dh: string; auth: string },
        };

        await getWebPush().sendNotification(pushSubscription, payloadString);
        successCount++;
      } catch (error) {
        // Handle specific web-push errors
        if (error instanceof webpush.WebPushError) {
          console.error(
            `[PushService] Failed to send to endpoint: ${subscription.endpoint.slice(0, 50)}...`
          );

          // 410 Gone - Subscription is no longer valid, delete it
          if (error.statusCode === 410) {
            console.log(`[PushService] Subscription expired, deleting: ${subscription.id}`);
            await subscription.destroy();
          }
          // 401 or 403 - VAPID keys might be invalid
          else if (error.statusCode === 401 || error.statusCode === 403) {
            console.error('[PushService] VAPID authentication failed, check keys');
          }
        } else {
          console.error('[PushService] Unknown error sending notification:', error);
        }
      }
    }

    console.log(
      `[PushService] Sent ${successCount}/${subscriptions.length} notifications to user ${userId}`
    );
    return successCount;
  }

  /**
   * Broadcast a push notification to multiple users
   * Enviar una notificación push a múltiples usuarios
   *
   * @param userIds - Array of user IDs to send notification to
   * @param payload - Notification payload
   * @returns Promise with total number of successful sends
   */
  async broadcast(
    userIds: string[],
    payload: PushNotificationPayload
  ): Promise<{ total: number; successful: number; failed: number }> {
    let totalSuccessful = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
      try {
        const count = await this.sendToUser(userId, payload);
        totalSuccessful += count;

        // If no notifications were sent, count as failed
        if (count === 0) {
          totalFailed++;
        }
      } catch (error) {
        console.error(`[PushService] Error broadcasting to user ${userId}:`, error);
        totalFailed++;
      }
    }

    console.log(
      `[PushService] Broadcast completed: ${totalSuccessful} sent, ${totalFailed} failed`
    );

    return {
      total: userIds.length,
      successful: totalSuccessful,
      failed: totalFailed,
    };
  }

  /**
   * Handle incoming push subscription from client
   * Manejar suscripción push entrante del cliente
   *
   * @param userId - User ID (from authenticated user)
   * @param subscription - Push subscription from browser
   * @param userAgent - Optional user agent string
   * @returns Created PushSubscription record
   */
  async handleSubscription(
    userId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    userAgent?: string
  ): Promise<PushSubscription> {
    // Extract browser from user agent if provided
    let browser: string | null = null;
    if (userAgent) {
      if (userAgent.includes('Chrome')) browser = 'chrome';
      else if (userAgent.includes('Firefox')) browser = 'firefox';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'safari';
      else if (userAgent.includes('Edge')) browser = 'edge';
    }

    // Check if subscription already exists (by endpoint)
    const existing = await PushSubscription.findOne({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // Update existing subscription with new user
      if (existing.userId !== userId) {
        console.log(
          `[PushService] Updating subscription ownership: ${existing.id} (user: ${existing.userId} -> ${userId})`
        );
        await existing.update({ userId, browser });
      }
      return existing;
    }

    // Create new subscription
    const newSubscription = await PushSubscription.create({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      browser,
    });

    console.log(`[PushService] New subscription created: ${newSubscription.id}`);
    return newSubscription;
  }

  /**
   * Remove a push subscription
   * Eliminar una suscripción push
   *
   * @param endpoint - Push subscription endpoint
   * @returns True if deleted, false if not found
   */
  async removeSubscription(endpoint: string): Promise<boolean> {
    const subscription = await PushSubscription.findOne({
      where: { endpoint },
    });

    if (!subscription) {
      console.log(`[PushService] Subscription not found: ${endpoint.slice(0, 50)}...`);
      return false;
    }

    await subscription.destroy();
    console.log(`[PushService] Subscription removed: ${subscription.id}`);
    return true;
  }

  /**
   * Get all subscriptions for a user
   * Obtener todas las suscripciones de un usuario
   *
   * @param userId - User ID
   * @returns Array of PushSubscription records
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    return PushSubscription.findAll({
      where: { userId },
    });
  }
}

// Export singleton instance
export const pushService = new PushService();
