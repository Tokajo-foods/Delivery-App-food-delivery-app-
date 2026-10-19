import { Bell, BellOff } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { DeliveryNotificationRow } from '@/components/delivery/notifications/NotificationRow';
import { KitchenNotificationSettings } from '@/components/dashboard/KitchenNotificationSettings';
import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import { kitchenInboxStyles as styles } from '@/components/dashboard/restaurant-notifications-styles';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import { LIVE_INTERVALS, liveRefetchInterval, useAppIsActive } from '@/lib/live-query';
import { kitchenRouteForInboxItem } from '@/lib/notification/kitchen-push-route';
import {
  useClearAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUnreadNotificationCount,
} from '@/lib/notification/hooks';
import type { AppNotification } from '@/lib/notification/types';
import { useKitchenInbox } from '@/lib/restaurant/inbox-hooks';
import { useAuthStore } from '@/store/auth-store';

type Filter = 'all' | 'unread';

function showError(title: string, error: unknown) {
  Alert.alert(title, getApiErrorMessage(error, 'Try again.'));
}

export function RestaurantNotificationsScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isActive = useAppIsActive();
  const [filter, setFilter] = useState<Filter>('all');
  const inbox = useKitchenInbox({
    page: 1,
    limit: 30,
    unread: filter === 'unread' ? true : undefined,
  });
  const unreadQuery = useUnreadNotificationCount({
    enabled: Boolean(token),
    refetchInterval: liveRefetchInterval(LIVE_INTERVALS.notifications, isActive),
  });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const clearAll = useClearAllNotifications();
  const remove = useDeleteNotification();

  const items = useMemo(() => inbox.data?.notifications ?? [], [inbox.data?.notifications]);
  const unread = Math.max(0, unreadQuery.data ?? inbox.unreadCount);

  const onRefresh = useCallback(async () => {
    await Promise.all([inbox.refetch(), unreadQuery.refetch()]);
  }, [inbox, unreadQuery]);

  const openItem = useCallback(
    (item: AppNotification) => {
      if (!item.isRead) void markRead.mutateAsync(item.id).catch(() => undefined);
      const route = kitchenRouteForInboxItem(item);
      if (route !== '/notifications') router.push(route as never);
    },
    [markRead, router]
  );

  const confirmDelete = (item: AppNotification) => {
    Alert.alert('Delete notification?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void remove.mutateAsync(item.id).catch((e) => showError('Could not delete', e)),
      },
    ]);
  };

  const confirmClearAll = () => {
    Alert.alert('Clear all notifications?', 'This removes every notification from your inbox.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => void clearAll.mutateAsync().catch((e) => showError('Could not clear', e)),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
        showBack
      />

      <View style={styles.toolbar}>
        <View style={styles.filters}>
          {(['all', 'unread'] as const).map((key) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {key === 'all' ? 'All' : 'Unread'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.actions}>
          {unread > 0 ? (
            <Pressable
              onPress={() => void markAll.mutateAsync().catch((e) => showError('Could not update', e))}
              style={styles.actionChip}
              disabled={markAll.isPending}
            >
              <Text style={styles.actionText}>Mark all read</Text>
            </Pressable>
          ) : null}
          {items.length > 0 ? (
            <Pressable onPress={confirmClearAll} style={styles.actionChip} disabled={clearAll.isPending}>
              <Text style={styles.actionText}>Clear all</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: PARTNER_BOTTOM_NAV_INSET }]}
        refreshControl={
          <RefreshControl
            refreshing={inbox.isRefetching}
            onRefresh={() => void onRefresh()}
            tintColor={authTheme.brand}
            colors={[authTheme.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {inbox.isLoading && !inbox.data ? (
          <View style={styles.center}>
            <ActivityIndicator color={authTheme.brand} size="large" />
          </View>
        ) : null}

        {inbox.isError ? (
          <View style={styles.empty}>
            <BellOff color={authTheme.textDim} size={32} />
            <Text style={styles.emptyTitle}>Couldn’t load notifications</Text>
            <Text style={styles.muted}>{getApiErrorMessage(inbox.error, 'Try again in a moment.')}</Text>
            <Pressable style={styles.retry} onPress={() => void inbox.refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!inbox.isLoading && !inbox.isError && items.length === 0 ? (
          <View style={styles.empty}>
            <Bell color={authTheme.textDim} size={32} />
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </Text>
            <Text style={styles.muted}>New orders, reviews and payouts will show up here.</Text>
          </View>
        ) : null}

        {items.map((item) => (
          <DeliveryNotificationRow
            key={item.id}
            notification={item}
            onPress={() => openItem(item)}
            onDelete={() => confirmDelete(item)}
          />
        ))}

        <KitchenNotificationSettings enabled={Boolean(token)} />
      </ScrollView>
    </View>
  );
}
