import type {
  AppNotification,
  NotificationChannelPreferences,
  NotificationListResult,
  NotificationPushDevice,
  UnreadCountResult,
} from '@/lib/notification/types';
import {
  asRecord,
  extractList,
  mapMeta,
  mapNotification,
  mapUnreadCount,
  request,
} from '@/lib/notification/notification-http';
import { useAuthStore } from '@/store/auth-store';

const NOTIFICATION_SERVICE = '/api/v1/notification-service';
const DELIVERY_SERVICE = '/api/v1/delivery-service';
/** Rider inbox — canonical delivery-service proxy (role=delivery_partner). */
const RIDER_INBOX = `${DELIVERY_SERVICE}/partners/me/notifications`;
const NOTIFICATIONS_BASE = `${NOTIFICATION_SERVICE}/notifications`;

/** Delivery-service inbox routes are partner-only; kitchen sessions use notification-service. */
function isRiderSession() {
  return useAuthStore.getState().role === 'delivery';
}


export const notificationApi = {
  /** GET /notifications?page=&limit=&unread=true */
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unread?: boolean;
  }): Promise<NotificationListResult> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.unread) query.set('unread', 'true');

    const qs = query.toString();
    const base = isRiderSession() ? RIDER_INBOX : NOTIFICATIONS_BASE;
    const res = await request<unknown>(`${base}${qs ? `?${qs}` : ''}`);

    const dataRecord = asRecord(res.data);
    const meta =
      mapMeta(res.meta) ??
      mapMeta(dataRecord.meta) ??
      mapMeta({
        total: dataRecord.total,
        page: dataRecord.page,
        limit: dataRecord.limit,
      });

    return {
      notifications: extractList(res.data)
        .map(mapNotification)
        .filter((n) => n.id),
      meta,
    };
  },

  /** GET /notifications/unread-count */
  getUnreadCount: async (): Promise<UnreadCountResult> => {
    const res = await request<unknown>(
      isRiderSession()
        ? `${DELIVERY_SERVICE}/notifications/unread-count`
        : `${NOTIFICATIONS_BASE}/unread-count`
    );
    return { count: mapUnreadCount(res.data) };
  },

  /** PUT /notifications/read-all */
  markAllRead: async (): Promise<void> => {
    const base = isRiderSession() ? RIDER_INBOX : NOTIFICATIONS_BASE;
    await request(`${base}/read-all`, { method: 'PUT' });
  },

  /**
   * DELETE notification-service /notifications/clear-all.
   * Delivery-service has no clear-all; for a rider session (x-user-role=delivery_partner)
   * this removes the same personal + delivery_partner/all broadcast rows the rider inbox lists.
   */
  clearAll: async (): Promise<void> => {
    await request(`${NOTIFICATIONS_BASE}/clear-all`, { method: 'DELETE' });
  },

  /** PUT /notifications/:id/read */
  markRead: async (id: string): Promise<AppNotification | null> => {
    const base = isRiderSession() ? RIDER_INBOX : NOTIFICATIONS_BASE;
    const res = await request<Record<string, unknown>>(
      `${base}/${encodeURIComponent(id)}/read`,
      { method: 'PUT' }
    );
    if (!res.data || typeof res.data !== 'object') return null;
    return mapNotification(asRecord(res.data));
  },

  /** DELETE /notifications/:id */
  deleteNotification: async (id: string): Promise<void> => {
    await request(
      isRiderSession()
        ? `${DELIVERY_SERVICE}/notifications/${encodeURIComponent(id)}`
        : `${NOTIFICATIONS_BASE}/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },

  /** GET /health */
  health: async (): Promise<boolean> => {
    try {
      const res = await request<Record<string, unknown>>(
        `${NOTIFICATION_SERVICE}/health`
      );
      const status = String(
        (res.data as Record<string, unknown> | undefined)?.status ?? res.success
      );
      return status === 'ok' || status === 'true';
    } catch {
      return false;
    }
  },

  /** GET /health/ready */
  ready: async (): Promise<boolean> => {
    try {
      await request(`${NOTIFICATION_SERVICE}/health/ready`);
      return true;
    } catch {
      return false;
    }
  },

  /** GET /devices */
  listDevices: async (): Promise<NotificationPushDevice[]> => {
    const res = await request<unknown>(`${NOTIFICATION_SERVICE}/devices`);
    const record = asRecord(res.data);
    const rows = Array.isArray(record.devices)
      ? record.devices
      : Array.isArray(res.data)
        ? res.data
        : [];
    return rows
      .map((row): NotificationPushDevice | null => {
        const item = asRecord(row);
        const deviceId = String(item.deviceId ?? item.id ?? '').trim();
        if (!deviceId) return null;
        return {
          deviceId,
          platform: String(item.platform ?? '') || undefined,
          app: String(item.app ?? '') || undefined,
          tokenMasked: String(item.tokenMasked ?? '') || undefined,
        };
      })
      .filter((row): row is NotificationPushDevice => row !== null);
  },

  /** POST /devices/register — kitchen FCM uses app: "kitchen" */
  registerDevice: async (input: {
    token: string;
    platform: string;
    app: 'kitchen' | 'rider' | 'customer';
    deviceId?: string;
    appVersion?: string;
  }): Promise<NotificationPushDevice> => {
    const res = await request<Record<string, unknown>>(
      `${NOTIFICATION_SERVICE}/devices/register`,
      {
        method: 'POST',
        body: {
          token: input.token,
          platform: input.platform,
          app: input.app,
          ...(input.deviceId ? { deviceId: input.deviceId } : {}),
          ...(input.appVersion ? { appVersion: input.appVersion } : {}),
        },
      }
    );
    const item = asRecord(res.data);
    const deviceId = String(item.deviceId ?? item.id ?? '').trim();
    if (!deviceId) throw new Error('Device registered but the response was empty.');
    return {
      deviceId,
      platform: String(item.platform ?? input.platform) || undefined,
      app: String(item.app ?? input.app) || undefined,
      tokenMasked: String(item.tokenMasked ?? '') || undefined,
    };
  },

  /** DELETE /devices/:deviceId */
  unregisterDevice: async (deviceId: string): Promise<void> => {
    await request(
      `${NOTIFICATION_SERVICE}/devices/${encodeURIComponent(deviceId)}`,
      { method: 'DELETE' }
    );
  },

  /** GET /preferences */
  getPreferences: async (): Promise<NotificationChannelPreferences> => {
    const res = await request<Record<string, unknown>>(
      `${NOTIFICATION_SERVICE}/preferences`
    );
    const item = asRecord(res.data);
    return {
      ordersPush: item.ordersPush !== false,
      offersPush: item.offersPush !== false,
      promoPush: item.promoPush !== false,
      sms: item.sms !== false,
      whatsapp: item.whatsapp === true,
      email: item.email !== false,
    };
  },

  /** PUT /preferences */
  updatePreferences: async (
    patch: Partial<NotificationChannelPreferences>
  ): Promise<NotificationChannelPreferences> => {
    const res = await request<Record<string, unknown>>(
      `${NOTIFICATION_SERVICE}/preferences`,
      { method: 'PUT', body: patch }
    );
    const item = asRecord(res.data);
    return {
      ordersPush: item.ordersPush !== false,
      offersPush: item.offersPush !== false,
      promoPush: item.promoPush !== false,
      sms: item.sms !== false,
      whatsapp: item.whatsapp === true,
      email: item.email !== false,
    };
  },
};
