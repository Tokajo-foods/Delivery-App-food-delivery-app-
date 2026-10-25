import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

import { canUseFullScreenIntent, setCallShowWhenLocked } from '@/modules/tokajo-call-lock';

type Notifee = typeof import('@notifee/react-native');
type NotifeeEvent = import('@notifee/react-native').Event;

/** New id: Android never lets an existing channel change its sound. */
const RING_CHANNEL = 'tokajo-call-ring-v1';
const RING_SOUND = 'incoming_call';
const RING_MS = 45_000;
const BRAND = '#EA4B14';

export const CALL_ALERT_ACCEPT = 'accept';
export const CALL_ALERT_DECLINE = 'decline';

let notifee: Notifee | null | undefined;
let channelReady: Promise<boolean> | null = null;
let showingId: string | null = null;

function load(): Notifee | null {
  if (notifee !== undefined) return notifee;
  notifee = null;
  if (Platform.OS !== 'android') return null;
  const linked = Boolean(NativeModules.NotifeeApiModule) || Boolean(TurboModuleRegistry.get('NotifeeApiModule'));
  if (!linked) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notifee = require('@notifee/react-native') as Notifee;
  } catch {
    notifee = null;
  }
  return notifee;
}

function alertId(callId: string): string {
  return `tokajo-call-${callId}`;
}

function ensureChannel(n: Notifee): Promise<boolean> {
  channelReady ??= n.default
    .createChannel({
      id: RING_CHANNEL,
      name: 'Incoming calls',
      description: 'Full-screen ring for in-app order calls',
      importance: n.AndroidImportance.HIGH,
      visibility: n.AndroidVisibility.PUBLIC,
      sound: RING_SOUND,
      vibration: true,
      vibrationPattern: [300, 900, 600, 900],
      bypassDnd: true,
    })
    .then(() => true)
    .catch(() => {
      channelReady = null;
      return false;
    });
  return channelReady;
}

export type CallAlertInput = {
  callId: string;
  orderId: string;
  callerRole: string;
  calleeRole?: string;
  callerName: string;
  callerLogoUrl?: string | null;
  orderNumber?: string | null;
};

/**
 * WhatsApp-style ring: opens the call screen over the lock screen with Accept / Decline and a
 * looping ringtone. Works without the Android calling account. False → use the plain banner.
 */
export async function showFullScreenCallAlert(input: CallAlertInput): Promise<boolean> {
  const n = load();
  if (!n || !(await ensureChannel(n))) return false;
  setCallShowWhenLocked(true);
  const id = alertId(input.callId);
  try {
    await n.default.displayNotification({
      id,
      title: input.callerName,
      body: input.orderNumber ? `Incoming Tokajo call · Order #${input.orderNumber}` : 'Incoming Tokajo call',
      data: { kind: 'internet_call', ...stringData(input) },
      android: {
        channelId: RING_CHANNEL,
        category: n.AndroidCategory.CALL,
        importance: n.AndroidImportance.HIGH,
        visibility: n.AndroidVisibility.PUBLIC,
        smallIcon: 'notification_icon',
        color: BRAND,
        ...(input.callerLogoUrl ? { largeIcon: input.callerLogoUrl, circularLargeIcon: true } : {}),
        sound: RING_SOUND,
        loopSound: true,
        ongoing: true,
        autoCancel: false,
        lightUpScreen: true,
        timeoutAfter: RING_MS,
        fullScreenAction: { id: 'default', launchActivity: 'default' },
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [
          { title: 'Decline', pressAction: { id: CALL_ALERT_DECLINE } },
          { title: 'Accept', pressAction: { id: CALL_ALERT_ACCEPT, launchActivity: 'default' } },
        ],
      },
    });
    showingId = id;
    return true;
  } catch {
    setCallShowWhenLocked(false);
    return false;
  }
}

function stringData(input: CallAlertInput): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value) out[key] = value;
  }
  return out;
}

/**
 * Stops the ring. The lock-screen flag stays until the call itself is over. Without an id after a
 * headless restart (the alert outlived the JS runtime that showed it), every call alert is cleared.
 */
export async function dismissFullScreenCallAlert(callId?: string): Promise<void> {
  const n = load();
  const id = callId ? alertId(callId) : showingId;
  if (!callId || id === showingId) showingId = null;
  if (!n) return;
  if (id) {
    await n.default.cancelNotification(id).catch(() => undefined);
    return;
  }
  const shown = await n.default.getDisplayedNotifications().catch(() => []);
  await Promise.all(
    shown
      .map((row) => row.id ?? row.notification?.id ?? '')
      .filter((key) => key.startsWith('tokajo-call-'))
      .map((key) => n.default.cancelNotification(key).catch(() => undefined)),
  );
}

export function releaseCallLockScreen(): void {
  setCallShowWhenLocked(false);
}

export function keepCallOverLockScreen(): void {
  setCallShowWhenLocked(true);
}

export type CallAlertPress = { action: 'accept' | 'decline' | 'open'; data: Record<string, unknown> };

/** Maps a Notifee event to what the user did with the call alert. Null for anything else. */
export function readCallAlertEvent(event: NotifeeEvent): CallAlertPress | null {
  const n = load();
  if (!n) return null;
  const data = (event.detail.notification?.data ?? {}) as Record<string, unknown>;
  if (data.kind !== 'internet_call') return null;
  const pressId = event.detail.pressAction?.id;
  if (event.type === n.EventType.ACTION_PRESS && pressId === CALL_ALERT_ACCEPT) return { action: 'accept', data };
  if (event.type === n.EventType.ACTION_PRESS && pressId === CALL_ALERT_DECLINE) return { action: 'decline', data };
  if (event.type === n.EventType.PRESS) return { action: 'open', data };
  return null;
}

export function onCallAlertBackgroundEvent(handler: (event: NotifeeEvent) => Promise<void>): void {
  load()?.default.onBackgroundEvent(handler);
}

export function onCallAlertForegroundEvent(handler: (event: NotifeeEvent) => void): () => void {
  return load()?.default.onForegroundEvent(handler) ?? (() => undefined);
}

/** Accept tapped while the app was closed: Notifee hands it over once the UI starts. */
export async function initialCallAlertPress(): Promise<CallAlertPress | null> {
  const n = load();
  if (!n) return null;
  const initial = await n.default.getInitialNotification().catch(() => null);
  if (!initial) return null;
  const data = (initial.notification.data ?? {}) as Record<string, unknown>;
  if (data.kind !== 'internet_call') return null;
  const id = initial.pressAction?.id;
  return { action: id === CALL_ALERT_ACCEPT ? 'accept' : id === CALL_ALERT_DECLINE ? 'decline' : 'open', data };
}

export { canUseFullScreenIntent, load as loadCallNotifee };
