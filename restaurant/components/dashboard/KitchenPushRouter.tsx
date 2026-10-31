import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { getNotificationsModule, markNotificationIdsSeen } from '@/lib/notification/device-alerts';
import { kitchenRouteForPush } from '@/lib/notification/kitchen-push-route';
import {
  claimPushResponse,
  markLaunchPushSettled,
} from '@/lib/notification/launch-push';
import { restaurantOrderKeys } from '@/lib/order/hooks';
import { kitchenInboxKeys } from '@/lib/restaurant/inbox-hooks';

function asData(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function responseId(response: import('expo-notifications').NotificationResponse): string {
  return `${response.notification.request.identifier}:${response.actionIdentifier}`;
}

/**
 * Opens a kitchen screen only for a new notification tap — not when the app
 * is opened from the icon with a leftover last-response still on the device.
 */
export function KitchenPushRouter() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const N = getNotificationsModule();
    if (!N) {
      markLaunchPushSettled(false);
      return;
    }

    const open = async (
      response: import('expo-notifications').NotificationResponse | null,
      fromLast: boolean
    ) => {
      if (!response) return false;
      const id = responseId(response);
      if (!(await claimPushResponse(id))) return false;
      router.push(kitchenRouteForPush(asData(response.notification.request.content.data)) as never);
      if (fromLast) await N.clearLastNotificationResponseAsync?.().catch(() => undefined);
      return true;
    };

    void N.getLastNotificationResponseAsync()
      .then(async (last) => {
        const opened = await open(last, true);
        markLaunchPushSettled(opened);
        if (last) await N.clearLastNotificationResponseAsync?.().catch(() => undefined);
      })
      .catch(() => markLaunchPushSettled(false));

    const sub = N.addNotificationResponseReceivedListener((response) => {
      void open(response, false);
    });
    const received = N.addNotificationReceivedListener((notification) => {
      const data = asData(notification.request.content.data);
      if (data.notificationId) void markNotificationIdsSeen([String(data.notificationId)]);
      void queryClient.invalidateQueries({ queryKey: kitchenInboxKeys.all });
      if (data.orderId) void queryClient.invalidateQueries({ queryKey: restaurantOrderKeys.all });
    });
    return () => {
      sub.remove();
      received.remove();
    };
  }, [router, queryClient]);

  return null;
}
