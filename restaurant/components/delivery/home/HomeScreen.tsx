import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CircleCheck,
  Flame,
  MapPin,
  Star,
  Timer,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/auth-store';
import { HomeDeliveryHistory } from '@/components/delivery/home/HomeDeliveryHistory';
import { TripDetailSheet } from '@/components/delivery/orders/TripDetailSheet';
import { DutyControlCard } from '@/components/delivery/home/DutyControlCard';
import { MORE_FEATURES } from '@/components/delivery/home/home-features';
import { styles } from '@/components/delivery/home/home-screen-styles';
import {
  LocationMapPicker,
  type MapPickResult,
} from '@/components/restaurant/LocationMapPicker';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { useUnreadNotificationCount } from '@/lib/notification/hooks';
import { fonts } from '@/constants/typography';
import {
  formatCurrency,
  formatPercent,
  formatRating,
} from '@/lib/delivery-partner/analytics-api';
import {
  usePartnerEarnings,
  usePartnerPerformance,
} from '@/lib/delivery-partner/analytics-hooks';
import {
  deliveryPartnerApi,
} from '@/lib/delivery-partner/api';
import {
  formatDutyError,
  usePartnerAttendanceStreak,
  usePartnerBreakPolicy,
  usePartnerDutyMutations,
  usePartnerDutyStatus,
  usePartnerDutySummary,
} from '@/lib/delivery-partner/availability-hooks';
import {
  canAcceptOffers,
  isDutySwitchOn,
  resolveDisplayStreak,
} from '@/lib/delivery-partner/availability-types';
import { pushLiveToast } from '@/lib/delivery-partner/live-toast-store';
import { useLocationSyncSnapshot } from '@/lib/delivery-partner/use-partner-location-sync';
import { formatLocationError } from '@/lib/delivery-partner/tracking-api';
import {
  useLastLocation,
  useSaveHomeLocation,
} from '@/lib/delivery-partner/tracking-hooks';
import { LOCATION_ERROR_COPY } from '@/lib/delivery-partner/tracking-types';
import {
  formatGoOnlineError,
  getGoOnlineBlocker,
} from '@/lib/delivery-partner/go-online-guard';
import {
  useDeliveryHistory,
  useDeliveryOrderMutations,
  useDeliveryPartnerMe,
} from '@/lib/delivery-partner/hooks';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import type { PartnerDelivery } from '@/lib/delivery-partner/types';
import { askToEnableLocation } from '@/lib/delivery-partner/live-place';
import { useLivePlaceSnapshot } from '@/lib/delivery-partner/live-place-store';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/errors';

const LIVE_LOCATION_STORAGE_KEY = '@tokajo/partner-live-location';
const LIVE_LOCATION_FALLBACK = 'Tap to set your live location';

type SavedLiveLocation = {
  label: string;
  lat: number;
  lng: number;
};

/** Delivery Home â€” clean API-fed dashboard. */
export function DeliveryHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<PartnerDelivery | null>(null);
  const [confirmingLocation, setConfirmingLocation] = useState(false);
  const [liveLocation, setLiveLocation] = useState<SavedLiveLocation | null>(
    null
  );
  const me = useDeliveryPartnerMe();
  const duty = usePartnerDutyStatus();
  const dutySummary = usePartnerDutySummary();
  const breakPolicy = usePartnerBreakPolicy();
  const { startBreak, endBreak, extendBreak, setDutyStatus, checkOutHub } =
    usePartnerDutyMutations();
  const gpsSnap = useLocationSyncSnapshot();
  const livePlace = useLivePlaceSnapshot();
  const saveHome = useSaveHomeLocation();
  const lastLocation = useLastLocation(true);
  const authUser = useAuthStore((s) => s.user);
  const displayName =
    [me.data?.firstName, me.data?.lastName].filter(Boolean).join(' ') ||
    me.data?.name ||
    [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') ||
    'Partner';
  const unread = useUnreadNotificationCount();
  const history = useDeliveryHistory(5);
  const performance = usePartnerPerformance();
  const attendanceStreak = usePartnerAttendanceStreak();
  const earnings = usePartnerEarnings();
  const { setOnline } = useDeliveryOrderMutations();

  const dutyStatus =
    duty.data?.dutyStatus ?? me.data?.dutyStatus ?? undefined;
  const isOnline = isDutySwitchOn(
    dutyStatus,
    Boolean(me.data?.isOnline ?? me.data?.isAvailable ?? duty.data?.isOnline)
  );
  const onDelivery = dutyStatus === 'on_delivery';
  const acceptingOrders = canAcceptOffers(dutyStatus);
  const breakBusy =
    startBreak.isPending || endBreak.isPending || extendBreak.isPending;
  const goOnlineBlocker = getGoOnlineBlocker(me.data);

  const todayEarnings = earnings.data?.today.totalEarnings ?? 0;
  const currency = earnings.data?.currency ?? 'INR';

  const totalDeliveries = performance.data?.totalDeliveries ?? 0;
  const avgRating = performance.data?.avgRating ?? 0;
  const completionRate = performance.data?.completionRate ?? 0;
  const acceptanceRate = performance.data?.acceptanceRate ?? 0;
  const onTimeRate = performance.data?.onTimeRate ?? 0;
  const streak = resolveDisplayStreak(
    attendanceStreak.data,
    performance.data?.currentStreak
  );

  const recent = history.data?.pages.flatMap((p) => p.deliveries) ?? [];
  const loading = me.isLoading && !me.data;

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(LIVE_LOCATION_STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          const parsed = JSON.parse(raw) as SavedLiveLocation;
          if (
            parsed?.label &&
            Number.isFinite(parsed.lat) &&
            Number.isFinite(parsed.lng)
          ) {
            setLiveLocation(parsed);
          }
        } catch {
          // ignore corrupt cache
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const onRefresh = async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([
        me.refetch(),
        duty.refetch(),
        dutySummary.refetch(),
        breakPolicy.refetch(),
        history.refetch(),
        performance.refetch(),
        attendanceStreak.refetch(),
        earnings.refetch(),
        lastLocation.refetch(),
      ]);
    } finally {
      setPullRefreshing(false);
    }
  };

  const onToggleOnline = () => {
    if (!isOnline) {
      void askToEnableLocation().then((ready) => {
        if (!ready) return;
        continueToggleOnline();
      });
      return;
    }
    continueToggleOnline();
  };

  const continueToggleOnline = () => {
    if (onDelivery) {
      Alert.alert(
        'Active delivery',
        'Complete your active delivery before going offline.'
      );
      return;
    }
    if (!isOnline && goOnlineBlocker) {
      Alert.alert(goOnlineBlocker.title, goOnlineBlocker.message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: goOnlineBlocker.actionLabel,
          onPress: () => router.push(goOnlineBlocker.actionHref as never),
        },
      ]);
      return;
    }
    setOnline.mutate(!isOnline, {
      onSuccess: () => {
        pushLiveToast({
          title: !isOnline ? 'You are online' : 'You are offline',
          body: !isOnline
            ? 'Nearby orders will start coming in.'
            : 'New orders will stop.',
          tone: 'success',
        });
      },
      onError: (err) => {
        const code = getApiErrorCode(err);
        const isKyc =
          code === 'PARTNER_NOT_ACTIVE' ||
          code === 'KYC_INCOMPLETE' ||
          code === 'PARTNER_KYC_PENDING';
        Alert.alert(
          isKyc ? 'KYC pending' : 'Could not update duty',
          formatGoOnlineError(err, 'Please try again.'),
          isKyc
            ? [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Complete KYC',
                  onPress: () =>
                    router.push(DELIVERY_ROUTES.documents as never),
                },
              ]
            : undefined
        );
      },
    });
  };

  const onStartBreak = (durationMinutes: number) => {
    if (onDelivery) {
      Alert.alert(
        'Active delivery',
        'Finish the current trip before starting a break.'
      );
      return;
    }
    if (!acceptingOrders) {
      Alert.alert('Go online first', 'You need to be online to take a break.');
      return;
    }
    startBreak.mutate(
      { durationMinutes },
      {
        onSuccess: () =>
          pushLiveToast({
            title: 'Break started',
            body: `New orders pause for ${durationMinutes} min.`,
            tone: 'info',
          }),
        onError: (err) =>
          Alert.alert(
            'Could not start break',
            formatDutyError(err, 'Please try again.')
          ),
      }
    );
  };

  const onEndBreak = () => {
    endBreak.mutate(undefined as void, {
      onSuccess: () =>
        pushLiveToast({
          title: 'Break ended',
          body: 'You are back online for new orders.',
          tone: 'success',
        }),
      onError: (err) =>
        Alert.alert(
          'Could not end break',
          formatDutyError(err, 'Please try again.')
        ),
    });
  };

  const onExtendBreak = (additionalMinutes: number) => {
    extendBreak.mutate(additionalMinutes, {
      onSuccess: () =>
        pushLiveToast({
          title: 'Break extended',
          body: `Added ${additionalMinutes} min within today's cap.`,
          tone: 'info',
        }),
      onError: (err) =>
        Alert.alert(
          'Could not extend break',
          formatDutyError(err, 'Daily or single-break limit reached.')
        ),
    });
  };

  const onLeaveHub = () => {
    const heading =
      dutyStatus === 'on_way_to_hub' && !duty.data?.hub?.checkedInAt;
    if (heading) {
      setDutyStatus.mutate(
        { dutyStatus: 'online' },
        {
          onSuccess: () =>
            pushLiveToast({
              title: 'Back online',
              body: 'Nearby orders can reach you again.',
              tone: 'success',
            }),
          onError: (err) =>
            Alert.alert(
              'Could not go online',
              formatDutyError(err, 'Please try again.')
            ),
        }
      );
      return;
    }
    checkOutHub.mutate(undefined, {
      onSuccess: () =>
        pushLiveToast({
          title: 'Left hub',
          body: 'You are back online for new orders.',
          tone: 'success',
        }),
      onError: (err) => {
        if (getApiErrorCode(err) === 'NOT_AT_HUB') {
          setDutyStatus.mutate(
            { dutyStatus: 'online' },
            {
              onSuccess: () =>
                pushLiveToast({
                  title: 'Back online',
                  body: 'Nearby orders can reach you again.',
                  tone: 'success',
                }),
              onError: (onlineErr) =>
                Alert.alert(
                  'Could not go online',
                  formatDutyError(onlineErr, 'Please try again.')
                ),
            }
          );
          return;
        }
        Alert.alert(
          'Could not check out',
          formatDutyError(err, 'Please try again.')
        );
      },
    });
  };

  const onConfirmLiveLocation = async (result: MapPickResult) => {
    setConfirmingLocation(true);
    try {
      await saveHome.mutateAsync({
        latitude: result.lat,
        longitude: result.lng,
        address: result.label || result.formattedAddress,
      });
      try {
        await deliveryPartnerApi.pushLocation({
          latitude: result.lat,
          longitude: result.lng,
          timestamp: Date.now(),
        });
      } catch {
        // home location saved; ping may require being online
      }
      const saved: SavedLiveLocation = {
        label: result.label || result.formattedAddress,
        lat: result.lat,
        lng: result.lng,
      };
      setLiveLocation(saved);
      await AsyncStorage.setItem(
        LIVE_LOCATION_STORAGE_KEY,
        JSON.stringify(saved)
      );
      setMapOpen(false);
    } catch (err) {
      Alert.alert(
        'Could not save location',
        formatLocationError(err, getApiErrorMessage(err, 'Please try again.'))
      );
    } finally {
      setConfirmingLocation(false);
    }
  };

  const locationChip =
    livePlace.label ??
    (livePlace.servicesOn === false
      ? 'Turn on location'
      : livePlace.locating
        ? 'Finding your location…'
        : LIVE_LOCATION_FALLBACK);

  const gpsBanner = (() => {
    if (!isOnline || !gpsSnap) return null;
    if (gpsSnap.mockBlocked) {
      return LOCATION_ERROR_COPY.MOCK_LOCATION;
    }
    if (gpsSnap.offlineBlocked) {
      return LOCATION_ERROR_COPY.PARTNER_OFFLINE;
    }
    if (gpsSnap.locationRequired) {
      return LOCATION_ERROR_COPY.LOCATION_REQUIRED;
    }
    return null;
  })();

  if (me.isError && !me.data) {
    const detail = formatDutyError(
      me.error,
      getApiErrorMessage(me.error, 'Could not reach delivery-service.')
    );
    const code = getApiErrorCode(me.error);
    const forbidden =
      code === 'FORBIDDEN' ||
      detail.toLowerCase().includes('permission') ||
      detail.toLowerCase().includes('forbidden');

    return (
      <View style={[styles.root, styles.centered, { padding: 24, gap: 14 }]}>
        <Text
          style={{
            fontFamily: fonts.semiBold,
            color: authTheme.text,
            fontSize: 17,
            textAlign: 'center',
          }}
        >
          Couldn't load your duty profile
        </Text>
        <Text
          style={{
            fontFamily: fonts.medium,
            color: authTheme.textMuted,
            fontSize: 13,
            lineHeight: 20,
            textAlign: 'center',
          }}
        >
          {forbidden
            ? 'This login is not a delivery partner session. Log out and sign in with Delivery role + the rider account that appears in admin.'
            : detail}
        </Text>
        <Pressable onPress={() => void me.refetch()}>
          <Text style={styles.link}>Retry</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace(DELIVERY_ROUTES.setup as never)}
        >
          <Text style={styles.link}>Account help</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void useAuthStore.getState().clearSession().then(() => {
              router.replace({
                pathname: '/login',
                params: { role: 'delivery' },
              } as never);
            });
          }}
        >
          <Text style={styles.link}>Log out</Text>
        </Pressable>
      </View>
    );
  }

  if (!loading && !me.data) {
    return (
      <View style={[styles.root, styles.centered, { padding: 24, gap: 14 }]}>
        <Text
          style={{
            fontFamily: fonts.semiBold,
            color: authTheme.text,
            fontSize: 17,
            textAlign: 'center',
          }}
        >
          No rider linked to this login
        </Text>
        <Text
          style={{
            fontFamily: fonts.medium,
            color: authTheme.textMuted,
            fontSize: 13,
            lineHeight: 20,
            textAlign: 'center',
          }}
        >
          If admin already shows you as an active rider, do not sign up again.
          Log out and use that same delivery email/phone.
        </Text>
        <Pressable onPress={() => void me.refetch()}>
          <Text style={styles.link}>Retry</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace(DELIVERY_ROUTES.setup as never)}
        >
          <Text style={styles.link}>Account help</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={authTheme.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              PARTNER_BOTTOM_NAV_INSET + Math.max(insets.bottom, 8),
          },
        ]}
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
        <LinearGradient
          colors={['#FFE9D6', '#FFF4EB', '#F6F3F0']}
          locations={[0, 0.62, 1]}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.logoRow}>
            <Image
              source={require('../../../assets/tokajo-wordmark.webp')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => {
                if (livePlace.servicesOn === false) {
                  void askToEnableLocation();
                  return;
                }
                setMapOpen(true);
              }}
              style={styles.locationBtn}
              accessibilityRole="button"
              accessibilityLabel="Set live location"
            >
              <Text style={styles.greeting} numberOfLines={1}>
                Hi, {displayName.split(' ')[0] || 'Partner'}
              </Text>
              <View style={styles.dhLocInline}>
                <MapPin color="#EA4B14" size={14} strokeWidth={2.4} />
                <Text style={styles.locTitle}>
                  {locationChip}
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.iconBtn, styles.bellBtn]}
              onPress={() => router.push(DELIVERY_ROUTES.notifications)}
              accessibilityLabel="Notifications"
            >
              <Bell color="#EA4B14" size={20} strokeWidth={2.2} />
              {(unread.data ?? 0) > 0 ? <View style={styles.dhBellDot} /> : null}
            </Pressable>
          </View>
        </LinearGradient>

        {goOnlineBlocker?.title === 'Account suspended' ? (
          <View style={styles.section}>
            <View style={styles.demandCta}>
              <View style={{ flex: 1 }}>
                <Text style={styles.demandCtaTitle}>{goOnlineBlocker.title}</Text>
                <Text style={styles.demandCtaHint}>{goOnlineBlocker.message}</Text>
              </View>
            </View>
          </View>
        ) : null}
        <DutyControlCard
            snapshot={duty.data}
            fallbackStatus={dutyStatus}
            isOnDuty={isOnline}
            summary={dutySummary.data}
            policy={breakPolicy.data}
            statusLoading={duty.isLoading}
            statusError={
              duty.isError
                ? formatDutyError(duty.error, 'Could not load duty status.')
                : null
            }
            onRetryStatus={() => void duty.refetch()}
            togglePending={setOnline.isPending}
            breakBusy={breakBusy}
            resumeBusy={checkOutHub.isPending || setDutyStatus.isPending}
            onToggle={onToggleOnline}
            onStartBreak={onStartBreak}
            onEndBreak={onEndBreak}
            onExtendBreak={onExtendBreak}
            onLeaveHub={onLeaveHub}
            onOpenHubs={() => router.push(DELIVERY_ROUTES.hubs as never)}
            gpsBanner={gpsBanner}
            actionError={
              setOnline.isError
                ? formatGoOnlineError(setOnline.error, 'Could not update status')
                : null
            }
            summaryError={
              dutySummary.isError && !dutySummary.data
                ? formatDutyError(
                    dutySummary.error,
                    "Could not load today's duty summary."
                  )
                : null
            }
            onRetrySummary={() => void dutySummary.refetch()}
          />

          <Pressable
            onPress={() => router.push(DELIVERY_ROUTES.earnings)}
            style={styles.earnCard}
          >
            <LinearGradient
              colors={['#FF8A4C', '#EA4B14', '#C9340C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.earnWash}
            />
            <View style={styles.dhEarnCol}>
              <Text style={styles.dhEarnLabel}>Today's earning</Text>
              <Text style={styles.dhEarnAmount}>{formatCurrency(todayEarnings, currency)}</Text>
              <Text style={styles.earnHook}>
                {!isOnline
                  ? 'Go online and grow today’s number'
                  : streak > 0
                    ? `${streak}-day streak — one more trip keeps it`
                    : 'You are live. Each trip adds to this'}
              </Text>
            </View>
            <View style={styles.scooterSlot}>
              <Image
                source={require('../../../public/scooter.png')}
                style={styles.scooterImg}
                resizeMode="contain"
              />
            </View>
          </Pressable>

        {acceptingOrders ? (
          <View style={styles.section}>
            <Pressable
              onPress={() => router.push(DELIVERY_ROUTES.heatmap as never)}
              style={styles.demandCta}
            >
              <Flame color={authTheme.brand} size={18} />
              <View style={{ flex: 1 }}>
                <Text style={styles.demandCtaTitle}>Find orders</Text>
                <Text style={styles.demandCtaHint}>
                  See nearby demand heatmap while you wait
                </Text>
              </View>
              <ChevronRight color={authTheme.textMuted} size={18} />
            </Pressable>
          </View>
        ) : null}



        {/* Key stats â€” performance API */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue} numberOfLines={1}>
              {totalDeliveries}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Deliveries
            </Text>
          </View>
          <View style={styles.statDivider} />
          <Pressable
            style={styles.stat}
            onPress={() => router.push(DELIVERY_ROUTES.performance)}
          >
            <View style={styles.statValueRow}>
              <Star color={authTheme.brand} size={13} fill={authTheme.brand} />
              <Text style={styles.statValue} numberOfLines={1}>
                {formatRating(avgRating)}
              </Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>
              Rating
            </Text>
          </Pressable>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue} numberOfLines={1}>
              {formatPercent(completionRate)}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Completion
            </Text>
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.serviceGrid}>
            {MORE_FEATURES.map((item, index) => {
              const Icon = item.icon;
              const showDivider = index % 4 !== 3;
              return (
                <View key={item.key} style={styles.serviceSlot}>
                  {showDivider ? <View style={styles.serviceDivider} /> : null}
                  <Pressable
                    onPress={() => router.push(item.href)}
                    style={styles.moreCard}
                  >
                    <View style={styles.moreIcon}>
                      <Icon color="#EA4B14" size={20} strokeWidth={1.8} />
                    </View>
                    <Text style={styles.moreLabel} numberOfLines={2}>
                      {item.label}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <Pressable
            onPress={() => router.push(DELIVERY_ROUTES.performance)}
            style={styles.sectionRow}
          >
            <View>
              <Text style={[styles.sectionTitle, styles.perfTitle]}>Performance</Text>
              <Text style={styles.sectionKicker}>
                {streak > 0
                  ? `${streak}-day streak · tap to climb`
                  : 'Tap to see how you rank'}
              </Text>
            </View>
            <ChevronRight color={authTheme.textMuted} size={18} />
          </Pressable>
          <Pressable
            onPress={() => router.push(DELIVERY_ROUTES.performance)}
            style={styles.card}
          >
            <View style={styles.perfGrid}>
              <View style={styles.perfItem}>
                <View style={styles.perfIcon}>
                  <BadgeCheck color="#EA4B14" size={16} strokeWidth={2.2} />
                </View>
                <Text style={styles.perfValue}>
                  {formatPercent(acceptanceRate)}
                </Text>
                <Text style={styles.perfLabel}>Acceptance</Text>
              </View>
              <View style={styles.perfItem}>
                <View style={styles.perfIcon}>
                  <CircleCheck color="#EA4B14" size={16} strokeWidth={2.2} />
                </View>
                <Text style={styles.perfValue}>
                  {formatPercent(completionRate)}
                </Text>
                <Text style={styles.perfLabel}>Completion</Text>
              </View>
              <View style={styles.perfItem}>
                <View style={styles.perfIcon}>
                  <Timer color="#EA4B14" size={16} strokeWidth={2.2} />
                </View>
                <Text style={styles.perfValue}>
                  {formatPercent(onTimeRate)}
                </Text>
                <Text style={styles.perfLabel}>On-time</Text>
              </View>
              <View style={styles.perfItem}>
                <View style={styles.perfIcon}>
                  <Flame color="#EA4B14" size={16} strokeWidth={2.2} />
                </View>
                <Text style={styles.perfValue}>{streak}d</Text>
                <Text style={styles.perfLabel}>Streak</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <HomeDeliveryHistory
          items={recent}
          loading={history.isLoading}
          error={history.isError ? history.error : null}
          onRetry={() => void history.refetch()}
          onOpen={setHistoryItem}
        />
      </ScrollView>

      <TripDetailSheet
        visible={historyItem != null}
        deliveryId={historyItem?.id ?? null}
        fallback={historyItem}
        onClose={() => setHistoryItem(null)}
      />

      <LocationMapPicker
        visible={mapOpen}
        initial={
          liveLocation
            ? { lat: liveLocation.lat, lng: liveLocation.lng }
            : null
        }
        autoDetectOnOpen
        locationTitle="HOME / LIVE LOCATION"
        currentLocationHint="Saved as home base for heatmap if GPS is off"
        onClose={() => {
          if (!confirmingLocation) setMapOpen(false);
        }}
        onConfirm={(result) => {
          void onConfirmLiveLocation(result);
        }}
      />
    </View>
  );
}
