import type { QueryClient } from '@tanstack/react-query';

import { notificationKeys } from '@/lib/notification/hooks';
import type { AppNotification, NotificationListResult } from '@/lib/notification/types';

function asList(old: unknown): NotificationListResult | null {
  if (!old || typeof old !== 'object') return null;
  const data = old as NotificationListResult;
  if (!Array.isArray(data.notifications)) return null;
  return data;
}

/** Instantly show a live `notification:new` row in every cached inbox list. */
export function prependInboxNotification(
  queryClient: QueryClient,
  item: AppNotification
) {
  if (!item.id) return;
  queryClient.setQueriesData(
    { queryKey: [...notificationKeys.all, 'list'] },
    (old: unknown) => {
      const data = asList(old);
      if (!data) return old;
      if (data.notifications.some((row) => row.id === item.id)) return old;
      const total = data.meta?.total;
      return {
        ...data,
        notifications: [item, ...data.notifications],
        meta: data.meta
          ? {
              ...data.meta,
              total: typeof total === 'number' ? total + 1 : data.notifications.length + 1,
            }
          : data.meta,
      };
    }
  );
}

export function bumpUnreadCount(queryClient: QueryClient) {
  queryClient.setQueryData(
    notificationKeys.unreadCount(),
    (current: { count?: number } | undefined) => ({
      count: Math.max(0, (current?.count ?? 0) + 1),
    })
  );
}
