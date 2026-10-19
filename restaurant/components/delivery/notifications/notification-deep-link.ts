import type { useRouter } from 'expo-router';

import { riderRouteForNotification } from '@/lib/delivery-partner/rider-notification-route';
import type { AppNotification } from '@/lib/notification/types';

export function openNotificationDeepLink(
  router: ReturnType<typeof useRouter>,
  item: AppNotification
) {
  const href = riderRouteForNotification(item.type, item.data ?? {});
  if (href) router.push(href as never);
}
