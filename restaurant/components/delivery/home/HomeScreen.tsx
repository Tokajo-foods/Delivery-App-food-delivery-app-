import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { HomeComplianceBanner } from '@/components/delivery/home/HomeComplianceBanner';
import { DutyControlCard } from '@/components/delivery/home/DutyControlCard';
import { HomeEarningsCard } from '@/components/delivery/home/HomeEarningsCard';
import { HomePerformanceCard } from '@/components/delivery/home/HomePerformanceCard';
import { HomeServicesGrid } from '@/components/delivery/home/HomeServicesGrid';
import {
  HomeHeader,
  type SavedLiveLocation,
} from '@/components/delivery/home/HomeHeader';
import { styles } from '@/components/delivery/home/home-screen-styles';
import {
  LocationMapPicker,
  type MapPickResult,
} from '@/components/restaurant/LocationMapPicker';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { useUnreadNotificationCount } from '@/lib/notification/hooks';
import { fonts } from '@/constants/typography';
import { formatPercent, formatRating } from '@/lib/delivery-partner/analytics-api';
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
import { selectPartnerTodayStats } from '@/lib/delivery-partner/today-stats';
import type { PartnerDelivery } from '@/lib/delivery-partner/types';
import { askToEnableLocation } from '@/lib/delivery-partner/live-place';
import { ensureAppPermission } from '@/lib/permissions/ensure-permission';
import { ensureDeviceNotificationReady } from '@/lib/notification/device-alerts';
import {
  BACKGROUND_LOCATION_DENIED_MESSAGE,
  ensureBackgroundLocationPermission,
} from '@/lib/delivery-partner/background-location-consent';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/errors';

const LIVE_LOCATION_STORAGE_KEY = '@tokajo/partner-live-location';

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
  const breakBusy =
    startBreak.isPending || endBreak.isPending || extendBreak.isPending;
  const goOnlineBlocker = getGoOnlineBlocker(me.data);

  const today = selectPartnerTodayStats(dutySummary.data, earnings.data);
  const dutySummaryView = dutySummary.data
    ? {
        ...dutySummary.data,
        deliveries: today.trips,
        km: today.km,
        onlineMinutes: today.onlineMinutes,
        earnings: today.earnings,
      }
    : dutySummary.data;

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
      void (async () => {
        const locationOk = await ensureAppPermission('location');
        if (!locationOk) return;
        const ready = await askToEnableLocation();
        if (!ready) return;
        const allowed = await ensureBackgroundLocationPermission('online');
        if (!allowed) {
          Alert.alert('Location all the time', BACKGROUND_LOCATION_DENIED_MESSAGE);
          return;
        }
        void ensureDeviceNotificationReady();
        continueToggleOnline();
      })();
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
        if (code === 'POLICY_NOT_ACCEPTED') {
          Alert.alert(
            'Policy required',
            'Accept the rider onboarding policy on your home screen to go online.'
          );
          return;
        }
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
    if (!isOnline) {
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

  const persistLiveLocation = async (saved: SavedLiveLocation) => {
    setLiveLocation(saved);
    await AsyncStorage.setItem(
      LIVE_LOCATION_STORAGE_KEY,
      JSON.stringify(saved)
    );
    try {
      await deliveryPartnerApi.pushLocation({
        latitude: saved.lat,
        longitude: saved.lng,
        timestamp: Date.now(),
      });
    } catch {
      // ping may require being online
    }
  };

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
        <HomeHeader
          displayName={displayName}
          unreadCount={unread.data ?? 0}
          onOpenMap={() => setMapOpen(true)}
          onLiveLocation={(saved) => {
            void persistLiveLocation(saved);
          }}
        />

        <HomeComplianceBanner profile={me.data} />
        <DutyControlCard
            snapshot={duty.data}
            fallbackStatus={dutyStatus}
            isOnDuty={isOnline}
            summary={dutySummaryView}
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

          <HomeEarningsCard
            amount={today.earnings}
            currency={today.currency}
            isOnline={isOnline}
            streak={streak}
            onPress={() => router.push(DELIVERY_ROUTES.earnings)}
          />

        {/* Key stats — performance API */}
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

        <HomeServicesGrid />

        <HomePerformanceCard
          acceptanceRate={acceptanceRate}
          completionRate={completionRate}
          onTimeRate={onTimeRate}
          streak={streak}
        />

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
        currentLocationHint="Saved as home base if GPS is off"
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
