import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { AppNotification } from '@/lib/notification/types';

/** Account inbox (`useNotifications`) and the outlet inbox (`useKitchenInbox`) cache the same rows. */
const INBOX_LIST_KEYS: QueryKey[] = [['notification', 'list'], ['kitchen-inbox']];

export type InboxSnapshot = Array<[QueryKey, unknown]>;

function unread(rows: AppNotification[]): number {
  return rows.filter((row) => !row.isRead).length;
}

/** Applies `edit` to every cached inbox list and returns a snapshot for rollback. */
export function patchInboxLists(
  queryClient: QueryClient,
  edit: (rows: AppNotification[]) => AppNotification[]
): InboxSnapshot {
  const snapshot = INBOX_LIST_KEYS.flatMap((queryKey) => queryClient.getQueriesData({ queryKey }));
  for (const queryKey of INBOX_LIST_KEYS) {
    queryClient.setQueriesData({ queryKey }, (old: unknown) => {
      if (!old || typeof old !== 'object') return old;
      const data = old as { notifications?: unknown; unreadCount?: unknown };
      if (!Array.isArray(data.notifications)) return old;
      const before = data.notifications as AppNotification[];
      const after = edit(before);
      if (typeof data.unreadCount !== 'number') return { ...data, notifications: after };
      const dropped = unread(before) - unread(after);
      return { ...data, notifications: after, unreadCount: Math.max(0, data.unreadCount - dropped) };
    });
  }
  return snapshot;
}

export function restoreInboxLists(queryClient: QueryClient, snapshot: InboxSnapshot | undefined) {
  snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

/** After a mutation or a live `notification:new`: reconcile both inboxes with the server. */
export function refreshInboxQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['notification'], refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: ['kitchen-inbox'], refetchType: 'active' });
}
