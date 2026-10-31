import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import { riderRouteForNotification } from '@/lib/delivery-partner/rider-notification-route';
import { notificationApi } from '@/lib/notification/api';
import { getNotificationsModule } from '@/lib/notification/device-alerts';
import { notificationKeys } from '@/lib/notification/hooks';
import { claimPushResponse, markLaunchPushSettled } from '@/lib/notification/launch-push';

/** Survives remounts so a cold-start tap is never handled twice in one app session. */
const handledResponses = new Set<string>();

type PushResponse = {
  actionIdentifier: string;
  notification: { request: { identifier: string; content: { data?: unknown } } };
};

function readData(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function ownedElsewhere(data: Record<string, unknown>): boolean {
  if (data.kind === 'rider_new_offer') return true;
  const style = String(data.pushStyle ?? '');
  return style === 'call' || style === 'call_cancel';
}

/** Rider push tap (warm or cold start): mark the inbox row read and open the screen it is about. */
export function useRiderPushOpen(enabled: boolean) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    const open = async (response: PushResponse) => {
      const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handledResponses.has(key)) return false;
      if (!(await claimPushResponse(key))) return false;
      handledResponses.add(key);
      const data = readData(response.notification.request.content.data);
      if (ownedElsewhere(data)) return false;

      const notificationId = typeof data.notificationId === 'string' ? data.notificationId : '';
      if (notificationId) {
        void notificationApi
          .markRead(notificationId)
          .then(() => queryClient.invalidateQueries({ queryKey: notificationKeys.all }))
          .catch(() => undefined);
      }
      const href = riderRouteForNotification(String(data.type ?? ''), data);
      router.push((href ?? DELIVERY_ROUTES.notifications) as never);
      return true;
    };

    let alive = true;
    void Notifications.getLastNotificationResponseAsync()
      .then(async (response) => {
        if (!alive) return;
        const opened = response ? await open(response) : false;
        markLaunchPushSettled(opened);
        if (response) {
          await Notifications.clearLastNotificationResponseAsync?.().catch(() => undefined);
        }
      })
      .catch(() => markLaunchPushSettled(false));
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      void open(response);
    });

    return () => {
      alive = false;
      sub.remove();
    };
  }, [enabled, router, queryClient]);
}
