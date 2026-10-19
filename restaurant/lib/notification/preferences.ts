import {
  storageGetItem,
  storageSetItem,
} from '@/lib/storage';
import type {
  AppNotification,
  NotificationPreferenceKey,
  NotificationPreferences,
} from '@/lib/notification/types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notification/types';

const PREFS_STORAGE_KEY = 'delivery.notification.preferences.v1';

let cached: NotificationPreferences = { ...DEFAULT_NOTIFICATION_PREFERENCES };

/** Sync read for the foreground push handler, which cannot await storage. */
export function getCachedNotificationPreferences(): NotificationPreferences {
  return cached;
}

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await storageGetItem(PREFS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<NotificationPreferences>) : {};
    cached = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed };
  } catch {
    cached = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  return { ...cached };
}

export async function saveNotificationPreferences(
  prefs: NotificationPreferences
): Promise<void> {
  await storageSetItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  cached = { ...prefs };
}

export function isTypeAllowed(type: string, prefs = cached): boolean {
  return prefs[preferenceKeyForType(type)] !== false;
}

/** Map API notification type → preference category. */
export function preferenceKeyForType(
  type: string
): NotificationPreferenceKey {
  const t = type.toLowerCase();
  if (
    t.includes('order') ||
    t.includes('deliver') ||
    t.includes('assign') ||
    t.includes('pickup') ||
    t.includes('trip')
  ) {
    return 'orders';
  }
  if (
    t.includes('pay') ||
    t.includes('earn') ||
    t.includes('wallet') ||
    t.includes('payout') ||
    t.includes('incentive') ||
    t.includes('tip')
  ) {
    return 'earnings';
  }
  if (t.includes('support') || t.includes('ticket') || t.includes('help')) {
    return 'support';
  }
  if (t.includes('kyc') || t.includes('document')) {
    return 'system';
  }
  if (
    t.includes('promo') ||
    t.includes('campaign') ||
    t.includes('marketing') ||
    t === 'broadcast'
  ) {
    return 'promo';
  }
  return 'system';
}

export function isNotificationAllowed(
  notification: AppNotification,
  prefs: NotificationPreferences
): boolean {
  return prefs[preferenceKeyForType(notification.type)] !== false;
}
