import { AppState, Platform } from 'react-native';

import { loadCallNotifee } from '@/lib/call/android-call-alert';

const CHANNEL = 'tokajo-call-ongoing';
const NOTIFICATION_ID = 'tokajo-call-ongoing';
const BRAND = '#EA4B14';

let running = false;
let wanted: { callId: string; peerName: string } | null = null;
let watching = false;

/**
 * Android cuts the microphone as soon as the app leaves the screen unless a microphone foreground
 * service runs. Registered at bundle load so the service has a runner after a headless start.
 */
export function registerCallOngoingService(): void {
  loadCallNotifee()?.default.registerForegroundService(() => new Promise<void>(() => undefined));
}

/** Android 14 only allows a microphone service to start while the app is on screen. */
function watchForeground(): void {
  if (watching) return;
  watching = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active' && wanted && !running) void startCallOngoingService(wanted.callId, wanted.peerName);
  });
}

/** Keeps call audio alive with the screen locked or another app open (the "call in progress" bar). */
export async function startCallOngoingService(callId: string, peerName: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  const n = loadCallNotifee();
  if (!n) return;
  wanted = { callId, peerName };
  watchForeground();
  if (running || AppState.currentState !== 'active') return;
  try {
    await n.default.createChannel({
      id: CHANNEL,
      name: 'Ongoing calls',
      importance: n.AndroidImportance.LOW,
      visibility: n.AndroidVisibility.PUBLIC,
    });
    await n.default.displayNotification({
      id: NOTIFICATION_ID,
      title: peerName,
      body: 'Tokajo call in progress',
      android: {
        channelId: CHANNEL,
        asForegroundService: true,
        foregroundServiceTypes: [n.AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE],
        category: n.AndroidCategory.CALL,
        visibility: n.AndroidVisibility.PUBLIC,
        smallIcon: 'notification_icon',
        color: BRAND,
        ongoing: true,
        autoCancel: false,
        pressAction: { id: 'default', launchActivity: 'default' },
      },
    });
    running = true;
    // The call ended while the service was starting.
    if (!wanted) await stopCallOngoingService();
  } catch {
    running = false;
  }
}

export async function stopCallOngoingService(): Promise<void> {
  wanted = null;
  if (!running) return;
  running = false;
  const n = loadCallNotifee();
  if (!n) return;
  await n.default.stopForegroundService().catch(() => undefined);
  await n.default.cancelNotification(NOTIFICATION_ID).catch(() => undefined);
}
