import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock3,
  History,
  Inbox,
  LayoutGrid,
  Package,
  RefreshCw,
  Timer,
} from 'lucide-react-native';

import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import {
  AcceptPrepSheet,
  RejectOrderSheet,
} from '@/components/orders/KitchenActionSheets';
import { RiderHandoverCard } from '@/components/orders/KitchenTicketSheets';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import type { OwnerOrder } from '@/lib/dashboard/types';
import { formatOrderTime } from '@/lib/dashboard/format';
import { getApiErrorMessage } from '@/lib/errors';
import {
  hardRefreshRestaurantOrders,
  restaurantOrderKeys,
  useKitchenKds,
  useKitchenTicketMutations,
  useMyRestaurantId,
  useOrderHandover,
  useOrderHistory,
  useRejectReasons,
  useRestaurantOrders,
  useScheduledOrders,
  useUpdateRestaurantOrderStatus,
} from '@/lib/order/hooks';
import type { RestaurantOrderAction } from '@/lib/order/owner-api';
import {
  canReject,
  displayStatus,
  money,
  nextKitchenAction,
  kitchenHandoverCopy,
  kitchenHandoverErrorCopy,
  rejectBlockedReason,
  resolveOrderTotal,
  shortOrderId,
  statusTone,
  type KitchenTicketAction,
} from '@/lib/order/ui';

type BoardTab = 'board' | 'incoming' | 'scheduled' | 'history';
type HistoryRange = 'today' | '7d' | '30d';
type IncomingFilter =
  | 'all'
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'cancelled';

const TABS: { key: BoardTab; label: string; Icon: typeof LayoutGrid }[] = [
  { key: 'board', label: 'Board', Icon: LayoutGrid },
  { key: 'incoming', label: 'Incoming', Icon: Inbox },
  { key: 'scheduled', label: 'Scheduled', Icon: CalendarClock },
  { key: 'history', label: 'History', Icon: History },
];

const INCOMING_FILTERS: { key: IncomingFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out' },
  { key: 'cancelled', label: 'Cancelled' },
];

function ymdIST(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function historyRange(preset: HistoryRange): { from: string; to: string } {
  const to = ymdIST();
  if (preset === 'today') return { from: to, to };
  const days = preset === '7d' ? 6 : 29;
  return { from: ymdIST(new Date(Date.now() - days * 86_400_000)), to };
}

function ticketItems(order: OwnerOrder) {
  if (order.items.length) {
    const head = order.items
      .slice(0, 2)
      .map((item) => `${item.quantity}× ${item.name}`)
      .join(', ');
    const more = order.items.length > 2 ? ` +${order.items.length - 2}` : '';
    return head + more;
  }
  if (order.itemCount) {
    return `${order.itemCount} item${order.itemCount === 1 ? '' : 's'}`;
  }
  return 'Tap for details';
}

function formatSlot(iso?: string) {
  if (!iso) return 'Scheduled';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Scheduled';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function acceptWindow(iso?: string) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return 'Accept overdue';
  const mins = Math.max(1, Math.ceil(ms / 60_000));
  return mins === 1 ? '1 min to accept' : `${mins} min to accept`;
}

function incomingMatches(order: OwnerOrder, filter: IncomingFilter) {
  if (filter === 'all') return true;
  if (filter === 'pending') {
    return (
      order.status === 'pending' ||
      order.status === 'placed' ||
      order.status === 'pending_payment'
    );
  }
  if (filter === 'preparing') {
    return order.status === 'accepted' || order.status === 'preparing';
  }
  if (filter === 'out_for_delivery') {
    return (
      order.status === 'out_for_delivery' ||
      order.deliveryTripStatus === 'returning_to_restaurant'
    );
  }
  if (filter === 'cancelled') {
    return (
      order.status === 'cancelled' ||
      order.status === 'cancelled_paid' ||
      order.status === 'rejected'
    );
  }
  return order.status === filter;
}

export function KitchenOrdersManager() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<BoardTab>('board');
  const [incomingFilter, setIncomingFilter] = useState<IncomingFilter>('pending');
  const [historyPreset, setHistoryPreset] = useState<HistoryRange>('today');
  const [rejecting, setRejecting] = useState<OwnerOrder | null>(null);
  const [accepting, setAccepting] = useState<OwnerOrder | null>(null);
  const [hardRefreshing, setHardRefreshing] = useState(false);

  const restaurantQuery = useMyRestaurantId();
  const restaurantId = restaurantQuery.data?.id;
  const range = useMemo(() => historyRange(historyPreset), [historyPreset]);

  const kdsQuery = useKitchenKds(restaurantId, {
    enabled: tab === 'board',
  });
  const ordersQuery = useRestaurantOrders(restaurantId);
  const scheduledQuery = useScheduledOrders(restaurantId);
  const historyQuery = useOrderHistory(restaurantId, range, {
    enabled: tab === 'history',
  });
  const reasonsQuery = useRejectReasons(restaurantId);
  const updateStatus = useUpdateRestaurantOrderStatus(restaurantId);
  const ticket = useKitchenTicketMutations(restaurantId);
  const laneBusy = updateStatus.isPending || ticket.isPending;

  const board = kdsQuery.data ?? {
    new: [] as OwnerOrder[],
    preparing: [] as OwnerOrder[],
    ready: [] as OwnerOrder[],
    delayed: [] as OwnerOrder[],
  };
  const incoming = ordersQuery.data ?? [];
  const scheduled = scheduledQuery.data ?? [];
  const historyOrders = (historyQuery.data?.pages ?? []).flatMap(
    (page) => page.orders
  );
  const visibleIncoming = incoming.filter((order) =>
    incomingMatches(order, incomingFilter)
  );
  const reasons = reasonsQuery.data ?? [];

  const activeQuery =
    tab === 'board'
      ? kdsQuery
      : tab === 'incoming'
        ? ordersQuery
        : tab === 'scheduled'
          ? scheduledQuery
          : historyQuery;

  async function refreshBoard() {
    if (!restaurantId) {
      void restaurantQuery.refetch();
      return;
    }
    setHardRefreshing(true);
    try {
      const fresh = await hardRefreshRestaurantOrders(restaurantId);
      queryClient.setQueryData(restaurantOrderKeys.list(restaurantId), fresh);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: restaurantOrderKeys.kds(restaurantId),
        }),
        queryClient.invalidateQueries({
          queryKey: restaurantOrderKeys.scheduled(restaurantId),
        }),
        queryClient.invalidateQueries({
          queryKey: restaurantOrderKeys.history(
            restaurantId,
            range.from,
            range.to
          ),
        }),
      ]);
    } catch (error) {
      Alert.alert('Could not refresh orders', getApiErrorMessage(error));
    } finally {
      setHardRefreshing(false);
    }
  }

  async function runAction(
    order: OwnerOrder,
    action: RestaurantOrderAction,
    payload?: { prepTime?: number; reasonCode?: string; note?: string }
  ) {
    if (action === 'accept' && payload?.prepTime == null) {
      setAccepting(order);
      return;
    }
    if (action === 'reject') {
      const blocked = rejectBlockedReason(order);
      if (blocked) {
        Alert.alert('Cannot reject yet', blocked);
        return;
      }
    }
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        action,
        prepTime: payload?.prepTime,
        reasonCode: payload?.reasonCode,
        note: payload?.note,
      });
      setRejecting(null);
      setAccepting(null);
      if (action === 'ready' && order.fulfillmentTone === 'delivery') {
        router.push(`/order/${encodeURIComponent(order.id)}`);
      }
    } catch (error) {
      Alert.alert('Could not update order', getApiErrorMessage(error));
    }
  }

  async function handleTicketAction(
    order: OwnerOrder,
    action: KitchenTicketAction
  ) {
    if (action.kind === 'pickup-ready') {
      try {
        await ticket.pickupReady.mutateAsync(order.id);
        router.push(`/order/${encodeURIComponent(order.id)}`);
      } catch (error) {
        Alert.alert('Could not mark pickup ready', getApiErrorMessage(error));
      }
      return;
    }
    if (action.kind === 'complete-takeaway') {
      try {
        await ticket.completeTakeaway.mutateAsync(order.id);
      } catch (error) {
        Alert.alert('Could not complete takeaway', getApiErrorMessage(error));
      }
      return;
    }
    if (action.kind === 'handover') {
      try {
        const result = await ticket.handToRider.mutateAsync(order.id);
        const copy = kitchenHandoverCopy(result.outcome, result.handover);
        if (result.outcome === 'need_otp' || result.outcome === 'waiting') {
          Alert.alert(copy.title, copy.body);
          router.push(`/order/${encodeURIComponent(order.id)}`);
          return;
        }
        Alert.alert(copy.title, copy.body);
      } catch (error) {
        Alert.alert('Could not hand to rider', kitchenHandoverErrorCopy(error));
      }
      return;
    }
    await runAction(order, action.action);
  }

  function openReject(order: OwnerOrder) {
    setRejecting(order);
  }

  function openOrder(order: OwnerOrder) {
    queryClient.setQueryData(
      restaurantOrderKeys.detail(restaurantId ?? '', order.id),
      order
    );
    router.push(`/order/${encodeURIComponent(order.id)}`);
  }

  const waitingForRestaurant =
    restaurantQuery.isPending && !restaurantQuery.data;
  const waitingForTab =
    Boolean(restaurantId) &&
    activeQuery.isPending &&
    !activeQuery.isFetched &&
    !activeQuery.data;
  const initialLoading = waitingForRestaurant || waitingForTab;
  const noRestaurant =
    !waitingForRestaurant && !restaurantId && !restaurantQuery.error;
  const loadError =
    restaurantQuery.error ??
    (tab === 'board'
      ? kdsQuery.error
      : tab === 'incoming'
        ? ordersQuery.error
        : tab === 'scheduled'
          ? scheduledQuery.error
          : historyQuery.error);
  const refreshing = hardRefreshing || activeQuery.isRefetching;
  const boardCount = board.new.length + board.preparing.length + board.ready.length;

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader
        title="Orders"
        subtitle={restaurantQuery.data?.name || 'Kitchen board'}
        dropActions
        headerRight={
          <Pressable
            accessibilityLabel="Refresh orders"
            disabled={refreshing || !restaurantId}
            onPress={() => void refreshBoard()}
            style={styles.refreshBtn}
          >
            {refreshing ? (
              <ActivityIndicator color={authTheme.text} size="small" />
            ) : (
              <RefreshCw color="#EA4B14" size={18} strokeWidth={2.2} />
            )}
          </Pressable>
        }
      >
        <View style={styles.tabs}>
          {TABS.map((item) => {
            const active = tab === item.key;
            const count =
              item.key === 'board'
                ? board.new.length
                : item.key === 'incoming'
                  ? incoming.filter((order) => incomingMatches(order, 'pending'))
                      .length
                  : item.key === 'scheduled'
                    ? scheduled.length
                    : historyQuery.data?.pages[0]?.total;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text
                  style={[styles.tabText, active && styles.tabTextActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {item.label}
                  {typeof count === 'number' && count > 0 ? (
                    <Text style={active ? styles.tabCountActive : styles.tabCount}>
                      {' '}
                      {count}
                    </Text>
                  ) : null}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </RestaurantPageHeader>

      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={authTheme.brand} size="large" />
          <Text style={styles.muted}>Loading kitchen orders…</Text>
        </View>
      ) : noRestaurant ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Restaurant not found</Text>
          <Text style={styles.muted}>
            Complete restaurant setup first, then open Orders again.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push('/restaurant-setup')}
          >
            <Text style={styles.primaryBtnText}>Open setup</Text>
          </Pressable>
        </View>
      ) : loadError && !activeQuery.data ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Couldn’t load orders</Text>
          <Text style={styles.muted}>{getApiErrorMessage(loadError)}</Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              void restaurantQuery.refetch();
              void activeQuery.refetch();
            }}
          >
            <Text style={styles.primaryBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.listFlex}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refreshBoard()}
              tintColor={authTheme.brand}
              colors={[authTheme.brand]}
            />
          }
        >
          {tab === 'board' ? (
            <>
              <View style={styles.boardSummary}>
                {(
                  [
                    { key: 'new', label: 'New', count: board.new.length },
                    { key: 'prep', label: 'Preparing', count: board.preparing.length },
                    { key: 'ready', label: 'Ready', count: board.ready.length },
                    { key: 'late', label: 'Delayed', count: board.delayed.length },
                  ] as const
                ).map((item, index, all) => (
                  <View key={item.key} style={styles.summarySlot}>
                    <Text
                      style={[
                        styles.summaryValue,
                        item.key === 'late' && item.count > 0
                          ? styles.summaryLate
                          : null,
                      ]}
                    >
                      {item.count}
                    </Text>
                    <Text style={styles.summaryLabel}>{item.label}</Text>
                    {index < all.length - 1 ? (
                      <View style={styles.summaryDivider} />
                    ) : null}
                  </View>
                ))}
              </View>
              {boardCount === 0 && board.delayed.length === 0 ? (
                <EmptyState
                  title="Kitchen is clear"
                  body="New orders show up here. Preparing and Ready update as you cook."
                />
              ) : (
                <>
                  {board.new.length > 0 ? (
                    <Lane
                      title="New"
                      tone="new"
                      count={board.new.length}
                      empty=""
                      orders={board.new}
                      busy={laneBusy}
                      onOpen={openOrder}
                      onAction={handleTicketAction}
                      onReject={openReject}
                    />
                  ) : null}
                  {board.preparing.length > 0 ? (
                    <Lane
                      title="Preparing"
                      tone="prep"
                      count={board.preparing.length}
                      empty=""
                      orders={board.preparing}
                      busy={laneBusy}
                      onOpen={openOrder}
                      onAction={handleTicketAction}
                      onReject={openReject}
                    />
                  ) : null}
                  {board.ready.length > 0 ? (
                    <Lane
                      title="Ready"
                      tone="ready"
                      count={board.ready.length}
                      empty=""
                      orders={board.ready}
                      busy={laneBusy}
                      onOpen={openOrder}
                      onAction={handleTicketAction}
                      onReject={openReject}
                    />
                  ) : null}
                  {board.delayed.length > 0 ? (
                    <Lane
                      title="Delayed"
                      tone="late"
                      count={board.delayed.length}
                      empty=""
                      orders={board.delayed}
                      busy={laneBusy}
                      onOpen={openOrder}
                      onAction={handleTicketAction}
                      onReject={openReject}
                    />
                  ) : null}
                </>
              )}
            </>
          ) : null}

          {tab === 'incoming' ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {INCOMING_FILTERS.map((item) => {
                  const active = incomingFilter === item.key;
                  const count = incoming.filter((order) =>
                    incomingMatches(order, item.key)
                  ).length;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setIncomingFilter(item.key)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.chipCount,
                          active && styles.chipCountActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {visibleIncoming.length === 0 ? (
                <EmptyState
                  title="No incoming orders"
                  body="New tickets appear here to accept or reject."
                />
              ) : (
                visibleIncoming.map((order) => (
                  <OrderTicket
                    key={order.id}
                    order={order}
                    busy={laneBusy}
                    onOpen={() => openOrder(order)}
                    onAction={(action) => void handleTicketAction(order, action)}
                    onReject={() => openReject(order)}
                  />
                ))
              )}
            </>
          ) : null}

          {tab === 'scheduled' ? (
            scheduled.length === 0 ? (
              <EmptyState
                title="No scheduled orders"
                body="Customers can book up to 3 days ahead. Each order moves to Active and rings at the time the customer chose."
              />
            ) : (
              scheduled.map((order) => (
                <OrderTicket
                  key={order.id}
                  order={order}
                  scheduled
                  busy={laneBusy}
                  onOpen={() => openOrder(order)}
                  onAction={(action) => void handleTicketAction(order, action)}
                  onReject={() => openReject(order)}
                />
              ))
            )
          ) : null}

          {tab === 'history' ? (
            <>
              <View style={styles.filterRow}>
                {(
                  [
                    { key: 'today' as const, label: 'Today' },
                    { key: '7d' as const, label: '7 days' },
                    { key: '30d' as const, label: '30 days' },
                  ]
                ).map((item) => {
                  const active = historyPreset === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setHistoryPreset(item.key)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {historyOrders.length === 0 ? (
                <EmptyState
                  title="No past orders"
                  body="Completed and cancelled orders for this date range show here."
                />
              ) : (
                historyOrders.map((order) => (
                  <OrderTicket
                    key={order.id}
                    order={order}
                    history
                    busy={false}
                    onOpen={() => openOrder(order)}
                  />
                ))
              )}
              {historyQuery.hasNextPage ? (
                <Pressable
                  style={styles.loadMore}
                  disabled={historyQuery.isFetchingNextPage}
                  onPress={() => void historyQuery.fetchNextPage()}
                >
                  {historyQuery.isFetchingNextPage ? (
                    <ActivityIndicator color={authTheme.brand} size="small" />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more</Text>
                  )}
                </Pressable>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      )}

      <AcceptPrepSheet
        key={accepting?.id ?? 'accept'}
        visible={Boolean(accepting)}
        order={accepting}
        busy={updateStatus.isPending}
        onClose={() => setAccepting(null)}
        onConfirm={(prepTime) => {
          if (accepting) void runAction(accepting, 'accept', { prepTime });
        }}
      />
      <RejectOrderSheet
        key={rejecting?.id ?? 'reject'}
        visible={Boolean(rejecting)}
        order={rejecting}
        reasons={reasons}
        reasonsError={reasonsQuery.error}
        busy={updateStatus.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={(reasonCode, note) => {
          if (rejecting) {
            void runAction(rejecting, 'reject', { reasonCode, note });
          }
        }}
      />
    </View>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
            <ClipboardList color="#EA4B14" size={24} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{body}</Text>
    </View>
  );
}

function Lane({
  title,
  tone,
  count,
  empty,
  orders,
  busy,
  onOpen,
  onAction,
  onReject,
}: {
  title: string;
  tone: 'new' | 'prep' | 'ready' | 'late';
  count: number;
  empty: string;
  orders: OwnerOrder[];
  busy: boolean;
  onOpen: (order: OwnerOrder) => void;
  onAction: (order: OwnerOrder, action: KitchenTicketAction) => void;
  onReject: (order: OwnerOrder) => void;
}) {
  return (
    <View style={styles.lane}>
      <View style={styles.laneHead}>
        <View style={[styles.laneDot, LANE_DOT[tone]]} />
        <Text style={styles.laneTitle}>{title}</Text>
        <View style={styles.laneCount}>
          <Text style={styles.laneCountText}>{count}</Text>
        </View>
      </View>
      {orders.length === 0 ? (
        <Text style={styles.laneEmpty}>{empty}</Text>
      ) : (
        orders.map((order) => (
          <OrderTicket
            key={`${tone}-${order.id}`}
            order={order}
            busy={busy}
            onOpen={() => onOpen(order)}
            onAction={(action) => onAction(order, action)}
            onReject={() => onReject(order)}
          />
        ))
      )}
    </View>
  );
}

function OrderTicket({
  order,
  busy,
  scheduled,
  history,
  onOpen,
  onAction,
  onReject,
}: {
  order: OwnerOrder;
  busy: boolean;
  scheduled?: boolean;
  history?: boolean;
  onOpen: () => void;
  onAction?: (action: KitchenTicketAction) => void;
  onReject?: () => void;
}) {
  const restaurantQuery = useMyRestaurantId();
  const restaurantId = restaurantQuery.data?.id;
  const handoverQuery = useOrderHandover(
    restaurantId,
    order.id,
    history ? undefined : order
  );
  const ticket = useKitchenTicketMutations(restaurantId);
  const tone = statusTone(
    order.deliveryTripStatus === 'returning_to_restaurant'
      ? 'returning_to_restaurant'
      : order.status
  );
  const action = history ? null : nextKitchenAction(order);
  const ActionIcon = action?.Icon;
  const windowLabel = acceptWindow(order.acceptBy);
  const showReject = Boolean(onReject && canReject(order) && !history);
  const showHandover =
    !history &&
    order.fulfillmentTone === 'delivery' &&
    !handoverQuery.data?.hide &&
    (handoverQuery.data?.kind === 'return' ||
      handoverQuery.data?.available ||
      order.deliveryTripStatus === 'returning_to_restaurant');

  const confirmHandover = async (method: 'otp' | 'tap', otp?: string) => {
    try {
      const next = await ticket.confirmHandover.mutateAsync({
        orderId: order.id,
        method,
        otp,
      });
      if (next.kind === 'return' && next.returnVerified) {
        Alert.alert('Returned order received', 'Bag received. Trip closed.');
      }
    } catch (error) {
      Alert.alert('Could not confirm handover', kitchenHandoverErrorCopy(error));
    }
  };

  return (
    <Pressable onPress={onOpen} style={styles.ticket}>
      <View style={styles.ticketTop}>
        <View style={styles.iconBox}>
          {scheduled ? (
            <CalendarClock color="#EA4B14" size={20} strokeWidth={2} />
          ) : order.isDelayed ? (
            <Timer color="#DC2626" size={20} strokeWidth={2} />
          ) : (
            <Package color="#EA4B14" size={20} strokeWidth={2} />
          )}
        </View>
        <View style={styles.ticketMid}>
          <Text style={styles.ticketId}>#{shortOrderId(order).toUpperCase()}</Text>
          <Text style={styles.ticketMeta} numberOfLines={1}>
            {order.customerName
              ? `${order.customerName} · ${ticketItems(order)}`
              : ticketItems(order)}
          </Text>
          {scheduled ? (
            <>
              <Text style={styles.slotText}>
                Scheduled {formatSlot(order.kitchenReleaseAt ?? order.scheduledFor)}
              </Text>
              <Text style={styles.ticketTime}>Moves to Active & rings at this time</Text>
            </>
          ) : (
            <Text style={styles.ticketTime}>
              {windowLabel && canReject(order)
                ? windowLabel
                : formatOrderTime(order.createdAt)}
              {order.fulfillmentLabel ? ` · ${order.fulfillmentLabel}` : ''}
            </Text>
          )}
        </View>
        <View style={styles.ticketRight}>
          <Text style={styles.amount}>{money(resolveOrderTotal(order))}</Text>
          <View style={styles.statusRow}>
            {order.status === 'cancelled' ||
            order.status === 'cancelled_paid' ||
            order.status === 'rejected' ? (
              <Ban color={tone.color} size={12} strokeWidth={3} />
            ) : order.status === 'delivered' ? (
              <CheckCircle2 color={tone.color} size={12} strokeWidth={3} />
            ) : order.status === 'preparing' ? (
              <ChefHat color={tone.color} size={12} strokeWidth={3} />
            ) : order.isDelayed ? (
              <Clock3 color="#DC2626" size={12} strokeWidth={3} />
            ) : null}
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    order.isDelayed ||
                    order.status === 'cancelled' ||
                    order.status === 'rejected'
                      ? '#DC2626'
                      : '#EA4B14',
                },
              ]}
            >
              {order.deliveryTripStatus === 'returning_to_restaurant'
                ? 'Rider returning'
                : order.isDelayed && order.delayMinutes
                  ? `Late +${order.delayMinutes}m`
                  : displayStatus(order.status)}
            </Text>
          </View>
        </View>
      </View>

      {showHandover ? (
        <Pressable
          onPress={(event) => event.stopPropagation()}
        >
          <RiderHandoverCard
            handover={handoverQuery.data}
            loading={handoverQuery.isLoading}
            error={handoverQuery.error}
            busy={ticket.confirmHandover.isPending}
            onRetry={() => void handoverQuery.refetch()}
            onConfirmOtp={(otp) => void confirmHandover('otp', otp)}
            onConfirmTap={() => void confirmHandover('tap')}
          />
        </Pressable>
      ) : null}

      {showReject || action ? (
        <View style={styles.actions}>
          {showReject ? (
            <Pressable
              disabled={busy}
              onPress={(event) => {
                event.stopPropagation();
                onReject?.();
              }}
              style={[styles.actionBtn, styles.rejectBtn]}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
          ) : null}
          {action ? (
            <Pressable
              disabled={busy}
              onPress={(event) => {
                event.stopPropagation();
                onAction?.(action);
              }}
              style={styles.actionBtn}
            >
              {ActionIcon ? <ActionIcon color={authTheme.brand} size={14} /> : null}
              <Text style={styles.acceptText}>{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const LANE_DOT: Record<'new' | 'prep' | 'ready' | 'late', { backgroundColor: string }> = {
  new: { backgroundColor: '#EA4B14' },
  prep: { backgroundColor: '#F97316' },
  ready: { backgroundColor: '#C2410C' },
  late: { backgroundColor: '#DC2626' },
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F3F0',
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3E7DE',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F1EAE3',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  tabActive: {
    backgroundColor: '#FFF1E8',
  },
  tabText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#78716C',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#1C1917',
    fontFamily: fonts.bold,
  },
  tabCount: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#A8A29E',
  },
  tabCountActive: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#EA4B14',
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: PARTNER_BOTTOM_NAV_INSET + 16,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1EAE3',
  },
  chipActive: {
    borderColor: '#F6E4D6',
    backgroundColor: '#FFF1E8',
  },
  chipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.textMuted,
  },
  chipTextActive: {
    color: authTheme.brand,
  },
  chipCount: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: authTheme.textDim,
  },
  chipCountActive: {
    color: authTheme.brand,
  },
  lane: {
    gap: 10,
    marginBottom: 6,
  },
  boardSummary: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    paddingVertical: 14,
  },
  summarySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    position: 'relative',
  },
  summaryValue: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: authTheme.text,
  },
  summaryLate: {
    color: '#DC2626',
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textMuted,
  },
  summaryDivider: {
    position: 'absolute',
    right: 0,
    top: 6,
    width: 1,
    height: 28,
    backgroundColor: '#D6D3D1',
  },
  laneHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  laneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  laneTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: authTheme.text,
    flex: 1,
  },
  laneCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E8',
    paddingHorizontal: 6,
  },
  laneCountText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#EA4B14',
  },
  laneEmpty: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textDim,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  ticket: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    overflow: 'hidden',
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  ticketTop: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF1E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ticketMid: {
    flex: 1,
  },
  ticketId: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: authTheme.text,
  },
  ticketMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    marginTop: 2,
  },
  ticketTime: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textDim,
    marginTop: 2,
  },
  slotText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: authTheme.brand,
    marginTop: 4,
  },
  ticketRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: -0.3,
    color: authTheme.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  statusText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1EAE3',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  rejectBtn: {
    borderRightWidth: 1,
    borderRightColor: '#F1EAE3',
  },
  rejectText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
  acceptText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.brand,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E8',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
  },
  muted: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: authTheme.text,
  },
  errorHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.error,
    textAlign: 'left',
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: authTheme.brand,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  loadMore: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  loadMoreText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  dialogTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: authTheme.text,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: authTheme.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonChipOn: {
    backgroundColor: authTheme.brandSoft,
    borderColor: authTheme.brand,
  },
  reasonChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.textMuted,
  },
  reasonChipTextOn: {
    color: authTheme.brand,
  },
  reasonInput: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 12,
    textAlignVertical: 'top',
    fontFamily: fonts.medium,
    fontSize: 14,
    color: authTheme.text,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dialogCancel: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.surface,
  },
  dialogCancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.textMuted,
  },
  dialogConfirm: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.error,
  },
  dialogConfirmText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
