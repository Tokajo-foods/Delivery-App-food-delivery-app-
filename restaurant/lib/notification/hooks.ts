import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import {
  LIVE_INTERVALS,
} from '@/lib/live-query';
import { notificationApi } from '@/lib/notification/api';
import {
  patchInboxLists,
  refreshInboxQueries,
  restoreInboxLists,
  type InboxSnapshot,
} from '@/lib/notification/inbox-list-patch';
import type { AppNotification } from '@/lib/notification/types';

export const notificationKeys = {
  all: ['notification'] as const,
  list: (params?: { page?: number; limit?: number; unread?: boolean }) =>
    [...notificationKeys.all, 'list', params ?? {}] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  devices: () => [...notificationKeys.all, 'devices'] as const,
};

/** GET /notifications — cache updated by delivery notification sync + mutations. */
export function useNotifications(
  params?: { page?: number; limit?: number; unread?: boolean },
  options?: { refetchInterval?: number | false; enabled?: boolean }
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationApi.getNotifications(params),
    enabled: options?.enabled ?? true,
    staleTime: LIVE_INTERVALS.notifications / 2,
    gcTime: 30 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Default: no extra poll (background sync owns cadence). Screens may opt in.
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    retry: 1,
    retryDelay: 4_000,
    placeholderData: (previous) => previous,
  });
}

/** GET /notifications/unread-count — kept fresh by delivery notification sync. */
export function useUnreadNotificationCount(options?: {
  refetchInterval?: number | false;
  enabled?: boolean;
  refetchOnMount?: boolean | 'always';
}) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationApi.getUnreadCount,
    enabled: options?.enabled ?? true,
    staleTime: LIVE_INTERVALS.notifications / 2,
    gcTime: 30 * 60_000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnMount: options?.refetchOnMount ?? true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
    retry: 1,
    retryDelay: 4_000,
    select: (data) => data.count,
    placeholderData: (previous) => previous,
  });
}

type UnreadCount = Awaited<ReturnType<typeof notificationApi.getUnreadCount>>;
type InboxContext = { lists: InboxSnapshot; count: UnreadCount | undefined };

/**
 * Optimistic inbox edit shared by read / read-all / delete / clear: patches the account and
 * outlet inbox caches, adjusts the badge, rolls back on error and reconciles with the server.
 */
function useInboxMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  edit: (rows: AppNotification[], vars: TVars) => AppNotification[],
  nextCount: (count: number, before: AppNotification[], after: AppNotification[]) => number
) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, TVars, InboxContext>({
    mutationFn,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      await queryClient.cancelQueries({ queryKey: ['kitchen-inbox'] });
      const count = queryClient.getQueryData<UnreadCount>(notificationKeys.unreadCount());
      let before: AppNotification[] = [];
      let after: AppNotification[] = [];
      const lists = patchInboxLists(queryClient, (rows) => {
        const next = edit(rows, vars);
        if (!before.length) {
          before = rows;
          after = next;
        }
        return next;
      });
      if (count) {
        setUnread(queryClient, nextCount(count.count ?? 0, before, after));
      }
      return { lists, count };
    },
    onError: (_err, _vars, context) => {
      restoreInboxLists(queryClient, context?.lists);
      if (context?.count !== undefined) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.count);
      }
    },
    onSettled: () => refreshInboxQueries(queryClient),
  });
}

function setUnread(queryClient: QueryClient, count: number) {
  queryClient.setQueryData(notificationKeys.unreadCount(), { count: Math.max(0, count) });
}

function unreadDropped(before: AppNotification[], after: AppNotification[]): number {
  const unread = (rows: AppNotification[]) => rows.filter((row) => !row.isRead).length;
  return unread(before) - unread(after);
}

/** PUT /notifications/:id/read */
export function useMarkNotificationRead() {
  return useInboxMutation<string>(
    (id) => notificationApi.markRead(id),
    (rows, id) => rows.map((row) => (row.id === id ? { ...row, isRead: true } : row)),
    (count, before, after) => count - unreadDropped(before, after)
  );
}

/** PUT /notifications/read-all */
export function useMarkAllNotificationsRead() {
  return useInboxMutation<void>(
    () => notificationApi.markAllRead(),
    (rows) => rows.map((row) => ({ ...row, isRead: true })),
    () => 0
  );
}

/** DELETE /notifications/:id */
export function useDeleteNotification() {
  return useInboxMutation<string>(
    (id) => notificationApi.deleteNotification(id),
    (rows, id) => rows.filter((row) => row.id !== id),
    (count, before, after) => count - unreadDropped(before, after)
  );
}

/** DELETE /notifications/clear-all */
export function useClearAllNotifications() {
  return useInboxMutation<void>(
    () => notificationApi.clearAll(),
    () => [],
    () => 0
  );
}

/** GET /preferences */
export function useNotificationChannelPreferences(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationApi.getPreferences(),
    enabled,
    staleTime: 60_000,
    retry: 1,
    placeholderData: (previous) => previous,
  });
}

/** PUT /preferences */
export function useUpdateNotificationChannelPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.updatePreferences,
    onSuccess: (prefs) => {
      queryClient.setQueryData(notificationKeys.preferences(), prefs);
    },
  });
}

/** GET /devices */
export function useNotificationDevices(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.devices(),
    queryFn: () => notificationApi.listDevices(),
    enabled,
    staleTime: 30_000,
    retry: 1,
    placeholderData: (previous) => previous,
  });
}
