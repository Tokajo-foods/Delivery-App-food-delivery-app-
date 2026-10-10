import { useRouter } from 'expo-router';
import {
  Package,
  Power,
  MessageCircle,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useDeliveryHeaderScrollProps } from '@/components/delivery/shared/header-scroll';
import { TripChatSheet } from '@/components/delivery/orders/TripChatSheet';
import { DeliveryTripMap } from '@/components/delivery/orders/DeliveryTripMap';
import { TripDetailSheet } from '@/components/delivery/orders/TripDetailSheet';
import { BatchSequenceSheet } from '@/components/delivery/orders/BatchSequenceSheet';
import { TripLifecycleBar, tripGeofenceState } from '@/components/delivery/orders/TripLifecycleBar';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { usePartnerDutyStatus } from '@/lib/delivery-partner/availability-hooks';
import { isDutySwitchOn } from '@/lib/delivery-partner/availability-types';
import {
  formatGoOnlineError,
  getDocumentProgress,
  getGoOnlineBlocker,
} from '@/lib/delivery-partner/go-online-guard';
import {
  deliveryStatusLabel,
  isAssignableStatus,
  isUnpaidTripStatus,
  normalizeDeliveryStatus,
  resolveTripStep,
} from '@/lib/delivery-partner/api';
import {
  useActiveDeliveries,
  useActiveDelivery,
  useDeliveryBatch,
  useDeliveryHistory,
  useDeliveryOrderMutations,
  useDeliveryPartnerMe,
  useDeliveryTimeline,
  useTripNavRoute,
  useTripOrderContext,
} from '@/lib/delivery-partner/hooks';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import { formatLocationError } from '@/lib/delivery-partner/tracking-api';
import {
  useLiveLocation,
  useLocationHistory,
  useOrderTracking,
  useTrackingEta,
  useTrackingRoute,
  useTrackingStatus,
} from '@/lib/delivery-partner/tracking-hooks';
import type { OrderTracking } from '@/lib/delivery-partner/tracking-types';
import { formatTripError } from '@/lib/delivery-partner/rider-ack';
import type { PartnerDelivery } from '@/lib/delivery-partner/types';
import { useResolvedTripStops } from '@/lib/delivery-partner/trip-stops';

type TabKey = 'active' | 'history';
type HistoryFilter = '' | 'delivered' | 'cancelled' | 'reassigned' | 'returned';

import { REJECT_REASON_CODES, toRejectReasonCode } from '@/lib/delivery-partner/rider-gateway-types';

const LIVE_STATUSES = new Set([
  'assigned',
  'accepted',
  'arrived',
  'picked_up',
  'out_for_delivery',
  'at_customer',
  'returning_to_restaurant',
]);

function shortOrderCode(delivery: PartnerDelivery) {
  const raw = delivery.orderNumber || delivery.orderId || delivery.id;
  const clean = String(raw).replace(/[^a-zA-Z0-9]/g, '');
  return (clean.slice(-6) || clean).toUpperCase();
}

function money(amount?: number, currency = 'INR') {
  if (amount == null || !Number.isFinite(amount)) return null;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${Math.round(amount)}`;
  }
}

function formatWhen(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isLiveDelivery(status: string) {
  return LIVE_STATUSES.has(normalizeDeliveryStatus(status));
}

function isPastDelivery(status: string) {
  const s = normalizeDeliveryStatus(status);
  return (
    s === 'delivered' ||
    s === 'rejected' ||
    s === 'cancelled' ||
    s === 'reassigned' ||
    s === 'failed' ||
    s === 'returned'
  );
}

function remainingOfferSeconds(delivery: PartnerDelivery) {
  if (delivery.offerExpiresAt) {
    const ms = Date.parse(delivery.offerExpiresAt) - Date.now();
    if (Number.isFinite(ms)) return Math.max(0, Math.ceil(ms / 1000));
  }
  if (delivery.timeoutSeconds && (delivery.assignedAt || delivery.createdAt)) {
    const start = Date.parse(delivery.assignedAt || delivery.createdAt || '');
    if (Number.isFinite(start)) {
      const elapsed = (Date.now() - start) / 1000;
      return Math.max(0, Math.ceil(delivery.timeoutSeconds - elapsed));
    }
  }
  return delivery.timeoutSeconds ?? null;
}

export function PartnerOrdersManager() {
  const router = useRouter();
  const headerScroll = useDeliveryHeaderScrollProps();
  const [tab, setTab] = useState<TabKey>('active');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [chatDelivery, setChatDelivery] = useState<PartnerDelivery | null>(null);
  const [detailDelivery, setDetailDelivery] = useState<PartnerDelivery | null>(
    null
  );
  const [sequenceOpen, setSequenceOpen] = useState(false);
  const [sequenceDismissedId, setSequenceDismissedId] = useState<string | null>(
    null
  );
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('');
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const me = useDeliveryPartnerMe();
  const duty = usePartnerDutyStatus();
  const dutyStatus = duty.data?.dutyStatus ?? me.data?.dutyStatus;
  const isOnline = isDutySwitchOn(
    dutyStatus,
    Boolean(me.data?.isOnline ?? me.data?.isAvailable ?? duty.data?.isOnline)
  );
  const onDelivery = dutyStatus === 'on_delivery';
  const goOnlineBlocker = getGoOnlineBlocker(me.data);
  const docProgress = getDocumentProgress(me.data);
  const active = useActiveDelivery(true, { fast: isOnline });
  const actives = useActiveDeliveries(true, { fast: isOnline });
  const history = useDeliveryHistory(20, true, historyFilter || undefined);
  const mutations = useDeliveryOrderMutations();

  const historyRows = useMemo(
    () => history.data?.pages.flatMap((p) => p.deliveries) ?? [],
    [history.data?.pages]
  );

  /** Live assignments from GET /partners/me/active-deliveries (+ current trip). */
  const liveOrders = useMemo(() => {
    const map = new Map<string, PartnerDelivery>();
    for (const row of actives.data ?? []) {
      if (row.id && isLiveDelivery(row.status)) {
        map.set(row.id, row);
      }
    }
    const current = active.data;
    if (current?.id && isLiveDelivery(current.status)) {
      const existing = map.get(current.id);
      map.set(current.id, existing ? { ...existing, ...current } : current);
    }
    return Array.from(map.values()).sort((a, b) => {
      const aAssigned = isAssignableStatus(a.status) ? 0 : 1;
      const bAssigned = isAssignableStatus(b.status) ? 0 : 1;
      if (aAssigned !== bAssigned) return aAssigned - bAssigned;
      const aTime = Date.parse(a.assignedAt || a.createdAt || '') || 0;
      const bTime = Date.parse(b.assignedAt || b.createdAt || '') || 0;
      return bTime - aTime;
    });
  }, [actives.data, active.data]);

  const pastOrders = useMemo(
    () => historyRows.filter((row) => isPastDelivery(row.status)),
    [historyRows]
  );

  const pendingBatchId = null;
  const pendingBatch = useDeliveryBatch(pendingBatchId ?? undefined, {
    enabled: Boolean(pendingBatchId),
    live: true,
  });

  useEffect(() => {
    const batch = pendingBatch.data;
    if (
      batch?.canConfirmSequence &&
      batch.batchId &&
      batch.batchId !== sequenceDismissedId
    ) {
      setSequenceOpen(true);
    }
  }, [pendingBatch.data, sequenceDismissedId]);

  const mutating =
    mutations.accept.isPending ||
    mutations.acceptBatch.isPending ||
    mutations.confirmSequence.isPending ||
    mutations.reject.isPending ||
    mutations.setOnline.isPending;

  const onRefresh = async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([
        active.refetch(),
        actives.refetch(),
        me.refetch(),
        history.refetch(),
        duty.refetch(),
      ]);
    } finally {
      setPullRefreshing(false);
    }
  };

  const showError = (error: unknown, fallback: string) => {
    Alert.alert('Could not complete', formatTripError(error, fallback));
  };

  const handleGoOnline = async () => {
    const next = !isOnline;
    if (onDelivery && isOnline) {
      Alert.alert(
        'Active delivery',
        'Complete your active delivery before going offline.'
      );
      return;
    }
    if (next && goOnlineBlocker) {
      Alert.alert(goOnlineBlocker.title, goOnlineBlocker.message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: goOnlineBlocker.actionLabel,
          onPress: () => router.push(goOnlineBlocker.actionHref as never),
        },
      ]);
      return;
    }

    setBusyLabel(next ? 'Going online…' : 'Going offline…');
    try {
      await mutations.setOnline.mutateAsync(next);
      await Promise.all([
        active.refetch(),
        actives.refetch(),
        history.refetch(),
        duty.refetch(),
      ]);
    } catch (error) {
      Alert.alert(
        'Could not go online',
        formatGoOnlineError(error, 'Could not update online status.')
      );
    } finally {
      setBusyLabel(null);
    }
  };

  const handleAccept = async (delivery: PartnerDelivery) => {
    setBusyLabel('Accepting…');
    try {
      await mutations.accept.mutateAsync(delivery.id);
      await Promise.all([
        active.refetch(),
        actives.refetch(),
        history.refetch(),
      ]);
    } catch (error) {
      showError(error, 'Could not accept delivery.');
    } finally {
      setBusyLabel(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTargetId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert('Reason required', 'Please tell us why you are declining.');
      return;
    }
    setBusyLabel('Declining…');
    try {
      await mutations.reject.mutateAsync({
        deliveryId: rejectTargetId,
        reason,
        reasonCode: toRejectReasonCode(reason),
      });
      setRejectTargetId(null);
      setRejectReason('');
      await Promise.all([
        active.refetch(),
        actives.refetch(),
        history.refetch(),
      ]);
    } catch (error) {
      showError(error, 'Could not decline delivery.');
    } finally {
      setBusyLabel(null);
    }
  };

  const loadingActive =
    (actives.isLoading && !(actives.data ?? []).length && !liveOrders.length) ||
    (active.isLoading && !active.data && !liveOrders.length);

  return (
    <View style={[styles.root, { paddingTop: headerScroll.contentInsetTop }]}>
      <View style={styles.periodBar}>
        {(
          [
            { key: 'active', label: 'Active' },
            { key: 'history', label: 'History' },
          ] as const
        ).map((item) => {
          const selected = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[styles.periodHit, selected && styles.periodHitActive]}
            >
              <Text
                style={[
                  styles.periodText,
                  selected && styles.periodTextActive,
                ]}
              >
                {item.label}
                {item.key === 'active' && liveOrders.length
                  ? ` (${liveOrders.length})`
                  : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: PARTNER_BOTTOM_NAV_INSET + 16 },
        ]}
        onScroll={headerScroll.onScroll}
        scrollEventThrottle={headerScroll.scrollEventThrottle}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void onRefresh()}
            tintColor={'#EA4B14'}
            colors={['#EA4B14']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Online status */}
        <View style={styles.onlineCard}>
          <View style={styles.onlineLeft}>
            <View
              style={[
                styles.onlineDot,
                {
                  backgroundColor: isOnline
                    ? '#EA4B14'
                    : '#D6D3D1',
                },
              ]}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.onlineTitle}>
                {isOnline ? 'You are online' : 'You are offline'}
              </Text>
              <Text style={styles.onlineSub}>
                {goOnlineBlocker
                  ? goOnlineBlocker.reason === 'documents'
                    ? `Upload documents (${docProgress.submitted}/${docProgress.total})`
                    : goOnlineBlocker.reason === 'pending_review'
                      ? `Under review (${docProgress.verified}/${docProgress.total} verified)`
                      : 'Account activation pending'
                  : isOnline
                    ? 'Receiving new delivery requests'
                    : 'Go online to get assignments'}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => void handleGoOnline()}
            disabled={mutations.setOnline.isPending}
            style={[styles.onlineBtn, isOnline ? styles.onlineBtnQuiet : styles.onlineBtnLive]}
          >
            {mutations.setOnline.isPending ? (
              <ActivityIndicator color={isOnline ? '#C2410C' : '#FFFFFF'} size="small" />
            ) : (
              <>
                <Power color={isOnline ? '#C2410C' : '#FFFFFF'} size={14} />
                <Text style={[styles.onlineBtnText, isOnline && styles.onlineBtnTextQuiet]}>
                  {isOnline ? 'Go offline' : 'Go online'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {goOnlineBlocker && !isOnline ? (
          <Pressable
            onPress={() =>
              router.push(goOnlineBlocker.actionHref as never)
            }
            style={styles.blockerCard}
          >
            <Text style={styles.blockerTitle}>{goOnlineBlocker.title}</Text>
            <Text style={styles.blockerText}>{goOnlineBlocker.message}</Text>
            <Text style={styles.blockerLink}>
              {goOnlineBlocker.actionLabel} →
            </Text>
          </Pressable>
        ) : null}

        {tab === 'active' ? (
          loadingActive ? (
            <View style={styles.center}>
              <ActivityIndicator color={'#EA4B14'} size="large" />
              <Text style={styles.muted}>Checking for orders…</Text>
            </View>
          ) : (actives.isError || active.isError) && !liveOrders.length ? (
            <View style={styles.cardPad}>
              <Text style={styles.sectionTitle}>Couldn’t load orders</Text>
              <Text style={[styles.muted, { marginTop: 6 }]}>
                {formatTripError(
                  actives.error ?? active.error,
                  'Pull to retry.'
                )}
              </Text>
              <Pressable
                onPress={() => void onRefresh()}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : liveOrders.length > 0 ? (
            <View style={styles.section}>
              {pendingBatch.data?.canConfirmSequence ? (
                <Pressable
                  onPress={() => setSequenceOpen(true)}
                  style={styles.sequenceBanner}
                >
                  <Text style={styles.sequenceBannerTitle}>
                    Confirm pickup–drop sequence
                  </Text>
                  <Text style={styles.sequenceBannerSub}>
                    {[
                      `${pendingBatch.data.sequence.length} stops`,
                      pendingBatch.data.estimatedDistanceKm != null
                        ? `${pendingBatch.data.estimatedDistanceKm.toFixed(1)} km`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Pressable>
              ) : pendingBatch.isError && pendingBatchId ? (
                <Pressable
                  onPress={() => void pendingBatch.refetch()}
                  style={styles.sequenceBanner}
                >
                  <Text style={styles.sequenceBannerTitle}>
                    Couldn’t load stacked route
                  </Text>
                  <Text style={styles.sequenceBannerSub}>
                    {formatTripError(pendingBatch.error, 'Tap to retry.')}
                  </Text>
                </Pressable>
              ) : null}
              {liveOrders.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  batchSize={
                    delivery.batchId
                      ? liveOrders.filter((row) => row.batchId === delivery.batchId)
                          .length
                      : 0
                  }
                  busy={mutating}
                  onAccept={() => void handleAccept(delivery)}
                  onDecline={() => {
                    setRejectReason('');
                    setRejectTargetId(delivery.id);
                  }}
                  onChat={() => setChatDelivery(delivery)}
                  onDetails={() => setDetailDelivery(delivery)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Package color={'#9CA3AF'} size={28} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>
                {isOnline ? 'Waiting for orders' : 'No active orders'}
              </Text>
              <Text style={styles.emptySub}>
                {isOnline
                  ? 'New assignments will appear here automatically. Keep the app open.'
                  : 'Go online above to start receiving delivery requests.'}
              </Text>
            </View>
          )
        ) : history.isLoading && !pastOrders.length ? (
          <View style={styles.center}>
            <ActivityIndicator color={'#EA4B14'} size="large" />
            <Text style={styles.muted}>Loading history…</Text>
          </View>
        ) : history.isError && !pastOrders.length ? (
          <View style={styles.cardPad}>
            <Text style={styles.sectionTitle}>Couldn’t load history</Text>
            <Text style={[styles.muted, { marginTop: 6 }]}>
                {formatTripError(history.error, 'Pull to retry.')}
              </Text>
            <Pressable
              onPress={() => void history.refetch()}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : pastOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Package color={'#9CA3AF'} size={28} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No past deliveries</Text>
            <Text style={styles.emptySub}>
              Completed and declined trips will show up here.
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past deliveries</Text>
            <View style={styles.historyFilters}>
              {(
                [
                  { key: '', label: 'All' },
                  { key: 'delivered', label: 'Delivered' },
                  { key: 'returned', label: 'Returned' },
                  { key: 'cancelled', label: 'Cancelled' },
                  { key: 'reassigned', label: 'Declined' },
                ] as const
              ).map((item) => {
                const selected = historyFilter === item.key;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => setHistoryFilter(item.key)}
                    style={[
                      styles.historyChip,
                      selected && styles.historyChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyChipText,
                        selected && styles.historyChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.card}>
              {pastOrders.map((row, index) => (
                <HistoryRow
                  key={row.id}
                  delivery={row}
                  bordered={index < pastOrders.length - 1}
                  onPress={() => setDetailDelivery(row)}
                />
              ))}
              {history.hasNextPage ? (
                <Pressable
                  onPress={() => void history.fetchNextPage()}
                  disabled={history.isFetchingNextPage}
                  style={styles.loadMore}
                >
                  {history.isFetchingNextPage ? (
                    <ActivityIndicator color={'#EA4B14'} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      {busyLabel ? (
        <View style={styles.busyOverlay} pointerEvents="none">
          <View style={styles.busyCard}>
            <ActivityIndicator color={'#EA4B14'} />
            <Text style={styles.busyText}>{busyLabel}</Text>
          </View>
        </View>
      ) : null}

      <Modal
        visible={Boolean(rejectTargetId)}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectTargetId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Decline delivery</Text>
              <Pressable onPress={() => setRejectTargetId(null)} hitSlop={8}>
                <X color={'#6B7280'} size={20} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>
              Choose a reason so dispatch can reassign quickly.
            </Text>
            <View style={styles.chipRow}>
              {REJECT_REASON_CODES.map((preset) => (
                <Pressable
                  key={preset.code}
                  onPress={() => setRejectReason(preset.label)}
                  style={[
                    styles.chip,
                    rejectReason === preset.label && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      rejectReason === preset.label && styles.chipTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Decline reason"
              placeholderTextColor={'#9CA3AF'}
              style={styles.input}
              multiline
            />
            <Pressable onPress={() => void handleReject()} style={styles.dangerBtn}>
              <Text style={styles.dangerBtnText}>Confirm decline</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {chatDelivery ? (
        <TripChatSheet
          visible
          deliveryId={chatDelivery.id}
          orderId={chatDelivery.orderId}
          returning={
            normalizeDeliveryStatus(chatDelivery.status) ===
            'returning_to_restaurant'
          }
          onClose={() => setChatDelivery(null)}
        />
      ) : null}
      <TripDetailSheet
        visible={Boolean(detailDelivery)}
        deliveryId={detailDelivery?.id ?? null}
        fallback={detailDelivery}
        live={Boolean(
          detailDelivery && isLiveDelivery(detailDelivery.status)
        )}
        onClose={() => setDetailDelivery(null)}
      />
      <BatchSequenceSheet
        visible={sequenceOpen && Boolean(pendingBatchId)}
        batchId={pendingBatchId}
        onClose={() => {
          if (pendingBatchId) setSequenceDismissedId(pendingBatchId);
          setSequenceOpen(false);
        }}
      />
    </View>
  );
}

function DeliveryCard({
  delivery,
  batchSize = 0,
  busy,
  onAccept,
  onDecline,
  onChat,
  onDetails,
}: {
  delivery: PartnerDelivery;
  batchSize?: number;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onChat: () => void;
  onDetails: () => void;
}) {
  const status = normalizeDeliveryStatus(delivery.status);
  const isNew = isAssignableStatus(status);
  const live = isLiveDelivery(status) && !isNew;
  const trackingQuery = useOrderTracking({
    orderId: delivery.orderId,
    deliveryId: delivery.id,
    enabled: live,
  });
  const statusQuery = useTrackingStatus(delivery.id, live && Boolean(delivery.id));
  const routeQuery = useTrackingRoute(delivery.orderId, live && Boolean(delivery.orderId));
  const tripRouteQuery = useTripNavRoute(delivery.id, live && Boolean(delivery.id));
  const etaQuery = useTrackingEta(delivery.orderId, live && Boolean(delivery.orderId));
  const liveLocationQuery = useLiveLocation(
    delivery.orderId,
    live && Boolean(delivery.orderId)
  );
  const historyQuery = useLocationHistory(delivery.id, live);
  const [trackingPatch, setTrackingPatch] = useState<Partial<OrderTracking> | null>(
    null
  );
  const tracking: OrderTracking | null = (() => {
    const base = trackingQuery.data ?? statusQuery.data;
    if (!base && !trackingPatch) return null;
    return {
      orderId: delivery.orderId ?? '',
      deliveryId: delivery.id,
      status: delivery.status,
      ...statusQuery.data,
      ...base,
      ...trackingPatch,
      etaSeconds:
        trackingPatch?.etaSeconds ??
        etaQuery.data?.etaSeconds ??
        base?.etaSeconds,
      distanceMeters:
        trackingPatch?.distanceMeters ??
        etaQuery.data?.distanceMeters ??
        base?.distanceMeters,
      riderLocation:
        trackingPatch?.riderLocation ??
        liveLocationQuery.data ??
        base?.riderLocation,
      provider:
        trackingPatch?.provider ??
        etaQuery.data?.provider ??
        base?.provider,
      durationInTraffic:
        trackingPatch?.durationInTraffic ??
        etaQuery.data?.durationInTraffic ??
        base?.durationInTraffic,
    } as OrderTracking;
  })();

  const geo = tracking?.geofence;
  const gate = tripGeofenceState(status, geo, resolveTripStep(delivery));
  const geoBlocked = gate.blocked;
  const geoHint = gate.hint;
  const stops = useResolvedTripStops({
    ...delivery,
    restaurantAddress: {
      ...delivery.restaurantAddress,
      line1:
        delivery.restaurantAddress?.line1 ||
        tracking?.pickup?.address ||
        delivery.restaurantAddress?.line1,
      lat: delivery.restaurantAddress?.lat ?? tracking?.pickup?.latitude,
      lng: delivery.restaurantAddress?.lng ?? tracking?.pickup?.longitude,
    },
    deliveryAddress: {
      ...delivery.deliveryAddress,
      line1:
        delivery.deliveryAddress?.line1 ||
        tracking?.drop?.address ||
        delivery.deliveryAddress?.line1,
      lat: delivery.deliveryAddress?.lat ?? tracking?.drop?.latitude,
      lng: delivery.deliveryAddress?.lng ?? tracking?.drop?.longitude,
    },
  });
  const pickupLabel = stops.pickupAddress;
  const dropLabel = stops.dropAddress;
  const amount = money(delivery.amount, delivery.currency);
  const earning = money(delivery.earning, delivery.currency);
  const tripKm =
    delivery.distanceKm != null && delivery.distanceKm >= 0.1
      ? `${delivery.distanceKm.toFixed(1)} km`
      : null;
  const routePoints = (
    tripRouteQuery.data?.points ??
    routeQuery.data?.points ??
    []
  ).map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));
  const historyPoints = (historyQuery.data?.points ?? []).map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));
  const trackingBusy =
    live &&
    ((trackingQuery.isLoading && !trackingQuery.data) ||
      (tripRouteQuery.isLoading && !tripRouteQuery.data && !routeQuery.data) ||
      (etaQuery.isLoading && !etaQuery.data));
  const trackingError =
    trackingQuery.error ??
    statusQuery.error ??
    tripRouteQuery.error ??
    routeQuery.error ??
    etaQuery.error ??
    liveLocationQuery.error;
  const onRetryTracking = () => {
    void trackingQuery.refetch();
    void statusQuery.refetch();
    void tripRouteQuery.refetch();
    void routeQuery.refetch();
    void routeQuery.refetch();
    void etaQuery.refetch();
    void liveLocationQuery.refetch();
    void historyQuery.refetch();
  };

  const [offerLeft, setOfferLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!isNew) {
      setOfferLeft(null);
      return;
    }
    const tick = () => setOfferLeft(remainingOfferSeconds(delivery));
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [isNew, delivery]);
  const allowDecline = delivery.canReject !== false;
  const offerUrgent = offerLeft != null && offerLeft <= 10;
  const offerTotal = Math.max(1, delivery.timeoutSeconds ?? 30);
  const offerProgress =
    offerLeft == null ? 1 : Math.min(1, Math.max(0, offerLeft / offerTotal));

  const orderCtx = useTripOrderContext(delivery.id, live || isNew);
  const namedCustomer =
    orderCtx.data?.customerName?.trim() ||
    (stops.customerName &&
    dropLabel &&
    stops.customerName.trim() !== dropLabel.trim()
      ? stops.customerName.trim()
      : '');
  const headingToCustomer =
    status === 'picked_up' ||
    status === 'out_for_delivery' ||
    status === 'at_customer';

  return (
    <View style={styles.jobCard}>
      <DeliveryTripMap
        delivery={{
          ...delivery,
          restaurantName: stops.restaurantName,
          customerName: stops.customerName,
          restaurantAddress: {
            ...delivery.restaurantAddress,
            line1: pickupLabel || delivery.restaurantAddress?.line1,
          },
          deliveryAddress: {
            ...delivery.deliveryAddress,
            line1: dropLabel || delivery.deliveryAddress?.line1,
          },
        }}
        tracking={tracking}
        eta={etaQuery.data}
        liveLocation={liveLocationQuery.data}
        routePolyline={tripRouteQuery.data?.polyline ?? routeQuery.data?.polyline}
        routePoints={routePoints}
        historyPolyline={historyQuery.data?.polyline}
        historyPoints={historyPoints}
        navRoute={tripRouteQuery.data}
        onTrackingPatch={(patch: Partial<OrderTracking>) =>
          setTrackingPatch((prev) => ({ ...prev, ...patch }))
        }
      />

      <View style={styles.jobBody}>
      <Text style={styles.placeTitle} numberOfLines={2}>
        {headingToCustomer
          ? stops.customerName || 'Customer'
          : stops.restaurantName}
      </Text>
      <View style={styles.jobTop}>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText} numberOfLines={1}>
            {deliveryStatusLabel(delivery.status)}
          </Text>
        </View>
        {batchSize > 1 ? (
          <View style={styles.batchPill}>
            <Text style={styles.batchPillText}>Stacked · {batchSize}</Text>
          </View>
        ) : null}
        <Text style={styles.orderNo} numberOfLines={1}>
          #{shortOrderCode(delivery)}
        </Text>
      </View>

      {(earning || tripKm || delivery.etaMinutes != null) && (
        <Text style={styles.earnLine}>
          {earning && !isUnpaidTripStatus(status)
            ? `${isAssignableStatus(status) ? 'Estimated ' : ''}${earning}`
            : amount || 'Earnings on this trip'}
          {tripKm ? `  ·  ${tripKm}` : ''}
          {delivery.etaMinutes != null ? `  ·  ${delivery.etaMinutes} min` : ''}
        </Text>
      )}

      {isNew && offerLeft != null ? (
        <View style={styles.offerTimerRow}>
          <View style={styles.offerTimerTrack}>
            <View
              style={[
                styles.offerTimerFill,
                {
                  width: `${Math.round(offerProgress * 100)}%`,
                  backgroundColor: offerUrgent ? '#B91C1C' : '#EA4B14',
                },
              ]}
            />
          </View>
          <Text
            style={[styles.offerTimerText, offerUrgent && styles.offerTimerUrgent]}
          >
            {offerLeft > 0 ? `${offerLeft}s` : 'Expired'}
          </Text>
        </View>
      ) : null}

      <ApiTimelineStrip deliveryId={delivery.id} live={live || isNew} />

      {live && trackingBusy ? (
        <View style={styles.trackBanner}>
          <ActivityIndicator color={authTheme.brand} size="small" />
          <Text style={styles.trackBannerText}>Getting the route…</Text>
        </View>
      ) : live && trackingError && !tracking ? (
        <Pressable onPress={onRetryTracking} style={styles.trackBanner}>
          <Text style={styles.trackBannerText}>
            {formatLocationError(trackingError, 'Could not load the route. Tap to retry')}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine} />
        
        <View style={styles.stop}>
          <View style={styles.timelineDot} />
          <View style={styles.stopBody}>
            <Text style={styles.stopLabel}>PICKUP</Text>
            <Text style={styles.stopTitle}>
              {stops.restaurantName}
            </Text>
            {pickupLabel ? (
              <Text style={styles.stopAddr} numberOfLines={2}>
                {pickupLabel}
              </Text>
            ) : (
              <Text style={styles.stopAddr} numberOfLines={2}>
                Looking up restaurant address…
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.stop, { marginTop: 24 }]}>
          <View style={[styles.timelineDot, styles.timelineDotDrop]} />
          <View style={styles.stopBody}>
            <Text style={styles.stopLabel}>DROP-OFF</Text>
            <Text style={styles.stopTitle}>
              {namedCustomer || 'Customer'}
            </Text>
            {stops.dropKmLabel ? (
              <Text style={styles.stopKm}>{stops.dropKmLabel}</Text>
            ) : null}
            {dropLabel ? (
              <Text style={styles.stopAddr} numberOfLines={2}>
                {dropLabel}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {isNew ? (
        <View style={{ gap: 8 }}>
          <View style={styles.actionRow}>
            {allowDecline ? (
              <Pressable
                onPress={onDecline}
                disabled={busy}
                style={styles.declineBtn}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onAccept}
              disabled={busy}
              style={styles.acceptBtn}
            >
              <Text style={styles.acceptBtnText}>
                {batchSize > 1 ? `Accept all (${batchSize})` : 'Accept'}
              </Text>
            </Pressable>
          </View>
          <Pressable onPress={onDetails} style={styles.detailsLink}>
            <Text style={styles.detailsLinkText}>Trip details</Text>
          </Pressable>
        </View>
      ) : live ? (
        <View style={styles.liveActions}>
          <TripLifecycleBar
            delivery={delivery}
            geoBlocked={geoBlocked}
            geoHint={geoHint}
          />
          <View style={styles.actionRow}>
            <Pressable
              onPress={onChat}
              disabled={busy}
              style={styles.chatBtn}
            >
              <MessageCircle color="#EA4B14" size={16} />
              <Text style={styles.chatBtnText}>Chat</Text>
            </Pressable>
            <Pressable
              onPress={onDetails}
              disabled={busy}
              style={styles.chatBtn}
            >
              <Text style={styles.chatBtnText}>Details</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      </View>
    </View>
  );
}

function ApiTimelineStrip({
  deliveryId,
  live,
}: {
  deliveryId: string;
  live: boolean;
}) {
  const timeline = useDeliveryTimeline(deliveryId, {
    enabled: Boolean(deliveryId),
    live,
  });
  if (timeline.isLoading && !timeline.data) {
    return (
      <View style={styles.trackBanner}>
        <ActivityIndicator color="#EA4B14" size="small" />
        <Text style={styles.trackBannerText}>Loading trip timeline…</Text>
      </View>
    );
  }
  if (timeline.isError) {
    return (
      <Pressable
        onPress={() => void timeline.refetch()}
        style={styles.trackBanner}
      >
        <Text style={styles.trackBannerText}>
          {formatTripError(timeline.error, 'Could not load timeline. Retry')}
        </Text>
      </Pressable>
    );
  }
  const steps = timeline.data?.steps ?? [];
  const next = steps.find((step) => !step.completed);
  const lastDone = [...steps].reverse().find((step) => step.completed);
  const line = next?.label || lastDone?.label;
  if (!line) return null;
  return (
    <Text style={styles.stepLine} numberOfLines={1}>
      {next ? `Next · ${next.label}` : line}
    </Text>
  );
}

function HistoryRow({
  delivery,
  bordered,
  onPress,
}: {
  delivery: PartnerDelivery;
  bordered: boolean;
  onPress: () => void;
}) {
  const amount = money(delivery.amount, delivery.currency);
  const earning = money(delivery.earning, delivery.currency);
  const unpaid = isUnpaidTripStatus(delivery.status);
  const when =
    formatWhen(delivery.deliveredAt) ||
    formatWhen(delivery.updatedAt) ||
    formatWhen(delivery.createdAt);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.historyRow, bordered && styles.rowBorder]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.historyTitle} numberOfLines={1}>
          {delivery.restaurantName || 'Delivery'}
        </Text>
        <Text style={styles.historyMeta} numberOfLines={1}>
          #{delivery.orderNumber || delivery.id.slice(-6)}
          {when ? ` · ${when}` : ''}
        </Text>
        <Text
          style={styles.historyStatus}
        >
          {deliveryStatusLabel(delivery.status)}
          {normalizeDeliveryStatus(delivery.status) === 'returned' &&
          delivery.rtoFee
            ? ` · RTO ₹${Math.round(delivery.rtoFee)}`
            : ''}
        </Text>
      </View>
      <Text style={styles.historyAmount}>
        {unpaid ? earning || '₹0' : earning || amount || '—'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  periodBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1EAE3',
    gap: 2,
  },
  periodHit: {
    flex: 1,
    minHeight: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodHitActive: {
    backgroundColor: '#FFF1E8',
  },
  periodText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#EA4B14',
    fontFamily: fonts.bold,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 20,
  },
  onlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1EAE3',
  },
  onlineLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000000',
  },
  onlineSub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  onlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  onlineBtnLive: {
    backgroundColor: '#EA4B14',
  },
  onlineBtnQuiet: {
    backgroundColor: '#FFF1E8',
  },
  onlineBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  onlineBtnTextQuiet: {
    color: '#C2410C',
  },
  blockerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  blockerTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#000000',
  },
  blockerText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  blockerLink: {
    marginTop: 4,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#000000',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1EAE3',
  },
  cardPad: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  center: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  muted: {
    color: '#6B7280',
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1EAE3',
  },
  emptyTitle: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptySub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    overflow: 'hidden',
  },
  jobBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  placeTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: '#475569',
  },
  earnLine: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#EA4B14',
  },
  stepLine: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
  },
  trackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  trackBannerText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#9A3412',
  },
  jobTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexShrink: 1,
    backgroundColor: '#FFF1E8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#C2410C',
  },
  batchPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  batchPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#3730A3',
    textTransform: 'uppercase',
  },
  sequenceBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  sequenceBannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#9A3412',
  },
  sequenceBannerSub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#C2410C',
  },
  detailsLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailsLinkText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#EA4B14',
  },
  offerTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offerTimerTrack: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  offerTimerFill: {
    height: 6,
    borderRadius: 99,
  },
  offerTimerText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: '#111827',
    width: 52,
    textAlign: 'right',
  },
  offerTimerUrgent: {
    color: '#EF4444',
  },
  apiSteps: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  apiStep: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  apiStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E7D5C9',
  },
  apiStepDotDone: {
    backgroundColor: '#EA4B14',
  },
  apiStepLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: '#0F172A',
    textAlign: 'center',
  },
  apiStepPending: {
    color: '#9CA3AF',
  },
  historyFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  historyChip: {
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  historyChipActive: {
    backgroundColor: '#EA4B14',
  },
  historyChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#4B5563',
  },
  historyChipTextActive: {
    color: '#FFFFFF',
  },
  orderNo: {
    marginLeft: 'auto',
    maxWidth: 88,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#94A3B8',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  metaStrong: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000000',
  },
  metaEarn: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#0F172A',
  },
  metaMuted: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 8,
    marginTop: 8,
  },
  timelineLine: {
    position: 'absolute',
    top: 16,
    bottom: 16,
    left: 12,
    width: 2,
    backgroundColor: '#F3E8DE',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA4B14',
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotDrop: {
    backgroundColor: '#0F172A',
  },
  stop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stopBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  stopLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stopTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#334155',
  },
  stopAddr: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  stopKm: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#C2410C',
  },
  stopActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  miniBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#C2410C',
  },
  liveActions: {
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  declineBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  declineBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#374151',
  },
  acceptBtn: {
    flex: 1.5,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA4B14',
  },
  acceptBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  workflowBtn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    marginTop: 8,
  },
  workflowBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  workflowBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  chatBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFF7F2',
  },
  chatBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#EA4B14',
  },
  geoHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  historyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#000000',
  },
  historyMeta: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  historyStatus: {
    marginTop: 6,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#000000',
  },
  historyAmount: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#EA4B14',
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  loadMoreText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#000000',
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  busyText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#000000',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.2,
  },
  modalSub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: '#000000',
    backgroundColor: '#F9FAFB',
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#000000',
    fontFamily: fonts.semiBold,
  },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#000000',
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  dangerBtn: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  dangerBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#374151',
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
  },
  primaryBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  retryBtn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
});
