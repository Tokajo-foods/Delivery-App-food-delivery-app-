import { useRouter } from 'expo-router';
import { Bell, BellOff, CheckCheck, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { InAppAlertPrefsCard } from '@/components/delivery/notifications/InAppAlertPrefsCard';
import { openNotificationDeepLink } from '@/components/delivery/notifications/notification-deep-link';
import { DeliveryNotificationRow } from '@/components/delivery/notifications/NotificationRow';
import {
  type NotificationFilter,
  NotificationsFilterBar,
  StatCard,
} from '@/components/delivery/notifications/NotificationsFilterBar';
import { notificationStyles as styles } from '@/components/delivery/notifications/notifications-styles';
import { useDeliveryHeaderScrollProps } from '@/components/delivery/shared/header-scroll';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import { liveRefetchInterval, useAppIsActive } from '@/lib/live-query';
import {
  useClearAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/lib/notification/hooks';
import type { AppNotification } from '@/lib/notification/types';

function showError(title: string) {
  return (err: unknown) => Alert.alert(title, getApiErrorMessage(err, 'Please try again.'));
}

export function PartnerNotificationsManager() {
  const headerScroll = useDeliveryHeaderScrollProps();
  const isActive = useAppIsActive();
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const listQuery = useNotifications(
    { page: 1, limit: 50 },
    { refetchInterval: liveRefetchInterval(15_000, isActive) }
  );
  const unreadCount = useUnreadNotificationCount({
    refetchInterval: liveRefetchInterval(15_000, isActive),
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const rawNotifications = listQuery.data?.notifications ?? [];
  const notifications = useMemo(
    () => (filter === 'unread' ? rawNotifications.filter((n) => !n.isRead) : rawNotifications),
    [rawNotifications, filter]
  );

  const totalFromApi = listQuery.data?.meta?.total ?? rawNotifications.length;
  const unread = unreadCount.data ?? rawNotifications.filter((n) => !n.isRead).length;
  const statusLabel = unread > 0 ? `${unread} pending` : 'All caught up';
  const loading = listQuery.isLoading && !listQuery.data;
  const error =
    listQuery.isError && !listQuery.data
      ? getApiErrorMessage(listQuery.error, 'Could not load notifications.')
      : null;

  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([listQuery.refetch(), unreadCount.refetch()]);
    } finally {
      setPullRefreshing(false);
    }
  }, [listQuery, unreadCount]);

  const onOpen = (item: AppNotification) => {
    if (!item.isRead) {
      markRead.mutate(item.id, { onError: showError('Could not mark read') });
    }
    openNotificationDeepLink(router, item);
  };

  const onDelete = (item: AppNotification) => {
    Alert.alert('Delete notification?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteOne.mutate(item.id, { onError: showError('Delete failed') }),
      },
    ]);
  };

  const onMarkAll = () => {
    if (unread <= 0) return;
    markAllRead.mutate(undefined, { onError: showError('Could not mark all read') });
  };

  const onClearAll = () => {
    if (rawNotifications.length === 0) return;
    Alert.alert(
      'Clear all notifications?',
      'This permanently removes every notification from your inbox.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => clearAll.mutate(undefined, { onError: showError('Clear failed') }),
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: headerScroll.contentInsetTop }]}>
      <View style={styles.actionStrip}>
        <Text style={styles.actionHint}>{unread > 0 ? `${unread} unread` : 'All caught up'}</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerBtn}
            onPress={onMarkAll}
            disabled={unread <= 0 || markAllRead.isPending}
            hitSlop={6}
          >
            {markAllRead.isPending ? (
              <ActivityIndicator color={authTheme.brand} size="small" />
            ) : (
              <CheckCheck color={unread > 0 ? authTheme.brand : authTheme.textDim} size={18} />
            )}
          </Pressable>
          <Pressable
            style={styles.headerBtn}
            onPress={onClearAll}
            disabled={rawNotifications.length === 0 || clearAll.isPending}
            hitSlop={6}
          >
            {clearAll.isPending ? (
              <ActivityIndicator color={authTheme.brand} size="small" />
            ) : (
              <Trash2
                color={rawNotifications.length > 0 ? authTheme.brand : authTheme.textDim}
                size={18}
              />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: PARTNER_BOTTOM_NAV_INSET + 16 }]}
        onScroll={headerScroll.onScroll}
        scrollEventThrottle={headerScroll.scrollEventThrottle}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void onRefresh()}
            tintColor={authTheme.brand}
            colors={[authTheme.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <StatCard label="Total" value={String(totalFromApi)} />
          <StatCard
            label="Unread"
            value={String(unread)}
            valueColor={unread > 0 ? authTheme.brand : undefined}
          />
          <StatCard
            label="Status"
            value={statusLabel}
            valueColor={unread > 0 ? '#D97706' : authTheme.success}
          />
        </View>

        <NotificationsFilterBar filter={filter} unread={unread} onChange={setFilter} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={authTheme.brand} size="large" />
            <Text style={styles.muted}>Loading notifications…</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Couldn’t load notifications</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable onPress={() => void onRefresh()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            {filter === 'unread' ? (
              <BellOff color={authTheme.textDim} size={40} />
            ) : (
              <Bell color={authTheme.textDim} size={40} />
            )}
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </Text>
            <Text style={styles.muted}>
              {filter === 'unread'
                ? "You're all caught up!"
                : 'Order alerts, earnings, and announcements will show here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((item) => (
              <DeliveryNotificationRow
                key={item.id}
                notification={item}
                onPress={() => onOpen(item)}
                onDelete={() => onDelete(item)}
              />
            ))}
            <Text style={styles.hint}>Long-press a notification to delete</Text>
          </View>
        )}

        <InAppAlertPrefsCard />
      </ScrollView>
    </View>
  );
}
