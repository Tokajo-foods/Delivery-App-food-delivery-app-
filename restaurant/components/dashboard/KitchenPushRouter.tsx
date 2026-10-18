import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { getNotificationsModule, markNotificationIdsSeen } from '@/lib/notification/device-alerts';
import { kitchenRouteForPush } from '@/lib/notification/kitchen-push-route';
import { restaurantOrderKeys } from '@/lib/order/hooks';
import { kitchenInboxKeys } from '@/lib/restaurant/inbox-hooks';

const handled = new Set<string>();

function asData(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

/**
 * Single owner of kitchen push taps: live taps and the tap that cold-started the app
 * (lock screen / killed app). Each notification opens its screen once. Foreground pushes
 * refresh the order board and inbox.
 */
export function KitchenPushRouter() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const N = getNotificationsModule();
    if (!N) return;

    const open = (response: import('expo-notifications').NotificationResponse | null) => {
      if (!response) return;
      const id = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handled.has(id)) return;
      handled.add(id);
      if (handled.size > 100) handled.delete(handled.values().next().value as string);
      router.push(kitchenRouteForPush(asData(response.notification.request.content.data)) as never);
    };

    void N.getLastNotificationResponseAsync()
      .then((last) => {
        open(last);
        return N.clearLastNotificationResponseAsync?.();
      })
      .catch(() => undefined);
    const sub = N.addNotificationResponseReceivedListener(open);
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
