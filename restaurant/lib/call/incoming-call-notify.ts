import { Platform } from 'react-native';

import { getNotificationsModule } from '@/lib/notification/device-alerts';

export const CALL_CHANNEL = 'tokajo-calls';
export const CALL_CATEGORY = 'internet_call';
const RING_ID = 'tokajo-incoming-internet-call';
const RINGTONE = 'incoming_call.wav';

let ready: Promise<void> | null = null;

/** Max-importance call channel (lock screen, bypass DND) + Accept / Decline buttons. */
export function ensureCallNotificationSetup(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    const N = getNotificationsModule();
    if (!N) return;
    try {
      if (Platform.OS === 'android') {
        await N.setNotificationChannelAsync(CALL_CHANNEL, {
          name: 'Incoming calls',
          importance: N.AndroidImportance.MAX,
          sound: RINGTONE,
          vibrationPattern: [0, 900, 600, 900, 600, 900],
          lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          enableVibrate: true,
          audioAttributes: {
            usage: N.AndroidAudioUsage.NOTIFICATION_RINGTONE,
            contentType: N.AndroidAudioContentType.SONIFICATION,
          },
        });
      }
      await N.setNotificationCategoryAsync(CALL_CATEGORY, [
        { identifier: 'ACCEPT', buttonTitle: 'Accept', options: { opensAppToForeground: true } },
        {
          identifier: 'DECLINE',
          buttonTitle: 'Decline',
          options: { isDestructive: true, opensAppToForeground: false },
        },
      ]);
    } catch {
      ready = null;
    }
  })();
  return ready;
}

/** Ringing tray notification when the OS call screen is unavailable. */
export async function presentIncomingCallNotification(input: {
  orderId: string;
  callId: string;
  callerRole: string;
  callerName: string;
  orderNumber?: string | null;
}): Promise<void> {
  const N = getNotificationsModule();
  if (!N) return;
  await ensureCallNotificationSetup();
  try {
    await N.scheduleNotificationAsync({
      identifier: RING_ID,
      content: {
        title: `${input.callerName} is calling`,
        body: input.orderNumber ? `Tokajo call · Order #${input.orderNumber}` : 'Incoming Tokajo order call',
        sound: RINGTONE,
        categoryIdentifier: CALL_CATEGORY,
        interruptionLevel: 'timeSensitive',
        priority: N.AndroidNotificationPriority.MAX,
        sticky: true,
        autoDismiss: false,
        data: { kind: 'internet_call', ...input },
        ...(Platform.OS === 'android' ? { channelId: CALL_CHANNEL } : {}),
      } as never,
      trigger: null,
    });
  } catch {
    // Notifications are blocked. The in-app screen still rings.
  }
}

export async function dismissIncomingCallNotification(): Promise<void> {
  const N = getNotificationsModule();
  if (!N) return;
  await N.dismissNotificationAsync(RING_ID).catch(() => undefined);
  await N.cancelScheduledNotificationAsync(RING_ID).catch(() => undefined);
}

export async function presentMissedCallNotification(input: {
  orderId: string;
  callId: string;
  callerName: string;
  orderNumber?: string | null;
}): Promise<void> {
  const N = getNotificationsModule();
  if (!N) return;
  try {
    await N.scheduleNotificationAsync({
      content: {
        title: `Missed call from ${input.callerName}`,
        body: input.orderNumber ? `Order #${input.orderNumber} · open the order to call back` : 'Open the order to call back',
        data: { kind: 'internet_call_missed', orderId: input.orderId, callId: input.callId },
        sound: false,
      },
      trigger: null,
    });
  } catch {
    // Notifications are blocked.
  }
}
