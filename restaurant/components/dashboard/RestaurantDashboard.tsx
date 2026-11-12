import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { DashboardTabBar } from '@/components/dashboard/DashboardTabBar';
import { AppPermissionsGate } from '@/components/permissions/AppPermissionsGate';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KitchenDutyCard } from '@/components/dashboard/KitchenDutyCard';
import { KitchenKycBanner } from '@/components/dashboard/KitchenKycBanner';
import { TodayStatsCard } from '@/components/dashboard/TodayStatsCard';
import { PendingOrdersSection } from '@/components/dashboard/PendingOrdersSection';
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { dashboardShellFromRestaurant } from '@/lib/dashboard/api';
import { useDashboardStats } from '@/lib/dashboard/hooks';
import { isRestaurantProfileComplete } from '@/lib/navigation/post-auth';
import { useUnreadNotificationCount } from '@/lib/notification/hooks';
import { useMyRestaurantId } from '@/lib/order/hooks';
import { restaurantOwnerApi } from '@/lib/restaurant/api';
import {
  restaurantOutletKeys,
  useKitchenDuty,
  useRestaurantServiceHealth,
} from '@/lib/restaurant/hooks';
import { isListingLive } from '@/lib/restaurant/listing-status';
import { getRestaurantVerificationBadge } from '@/lib/restaurant/verification';
import type { KitchenDutySnapshot } from '@/lib/restaurant/types';
import type { PermissionId } from '@/lib/permissions/types';
import { usePartnerGreetingName } from '@/lib/user/use-partner-greeting-name';
import { useAuthStore } from '@/store/auth-store';

/** Asked on the kitchen home. Location is asked on the outlet setup map instead. */
const HOME_PERMISSIONS: PermissionId[] = ['notifications', 'microphone'];

function dutyHeadline(duty?: KitchenDutySnapshot) {
  if (!duty) return undefined;
  if (!isListingLive(duty.status)) {
    return 'Listing not live';
  }
  if (duty.duty === 'paused') {
    const reason =
      duty.pauseReason === 'too_busy'
        ? 'too busy'
        : duty.pauseReason === 'staffing'
          ? 'short staff'
          : duty.pauseReason === 'packaging'
            ? 'packing delay'
            : duty.pauseReason === 'closing_soon'
              ? 'closing soon'
              : duty.pauseReason;
    return reason ? `Paused · ${reason}` : 'Kitchen paused';
  }
  if (duty.duty === 'online') {
    return duty.openNow ? 'Open now' : 'Online · outside hours';
  }
  return 'Kitchen offline';
}

export function RestaurantDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isSignedIn = useAuthStore((s) => Boolean(s.user?.id));
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const displayName = usePartnerGreetingName(isSignedIn);
  const { data, isLoading, isRefetching, refetch, error } = useDashboardStats(
    profileComplete === true
  );
  const restaurant = useMyRestaurantId();
  const duty = useKitchenDuty(
    restaurant.data?.id,
    profileComplete === true
  );
  const serviceHealth = useRestaurantServiceHealth(profileComplete === true);
  const unreadQuery = useUnreadNotificationCount({
    enabled: profileComplete === true,
    refetchOnMount: true,
  });
  const verification = getRestaurantVerificationBadge(
    restaurant.data?.listingStatus ?? restaurant.data?.status
  );
  const dutyLabel = dutyHeadline(duty.data);
  const dutyOnline =
    isListingLive(duty.data?.status) &&
    duty.data?.duty === 'online' &&
    duty.data.isOnline === true;

  const headerDuty = {
    dutyLabel,
    dutyOnline,
  };

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const my = await restaurantOwnerApi.getMyRestaurant();
        if (!active) return;
        setProfileComplete(isRestaurantProfileComplete(my));
      } catch {
        if (!active) return;
        setProfileComplete(false);
      }
    })();

    const timer = setTimeout(() => {
      if (!active) return;
      setProfileComplete((prev) => (prev === null ? false : prev));
    }, 8000);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (profileComplete === false) {
      router.replace('/restaurant-setup');
    }
  }, [profileComplete, router]);

  const dashboard =
    data ??
    (restaurant.data?.id ? dashboardShellFromRestaurant(restaurant.data) : null);

  if (
    profileComplete === null ||
    profileComplete === false ||
    ((isLoading || isRefetching) && !dashboard)
  ) {
    return (
      <View style={[styles.screen, styles.center]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={authTheme.brand} size="large" />
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={[styles.screen, styles.center]}>
        <StatusBar style="dark" />
        <Text style={styles.healthWarn}>
          Could not load your kitchen home. Pull to refresh or finish restaurant setup.
        </Text>
        <ActivityIndicator color={authTheme.brand} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppPermissionsGate ids={HOME_PERMISSIONS} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
              void duty.refetch();
              void serviceHealth.refetch();
              void queryClient.invalidateQueries({
                queryKey: restaurantOutletKeys.all,
              });
            }}
            tintColor={authTheme.brand}
            colors={[authTheme.brand]}
          />
        }
      >
        <DashboardHeader
          name={displayName}
          restaurantName={dashboard.restaurantName}
          restaurantCity={dashboard.city}
          logoUrl={dashboard.logoUrl}
          unreadNotifications={unreadQuery.data ?? 0}
          verificationLabel={verification.label}
          verificationColor={verification.color}
          verificationSoft={verification.soft}
          dutyLabel={headerDuty.dutyLabel}
          dutyOnline={headerDuty.dutyOnline}
          onProfilePress={() => router.replace('/admin')}
          onNotificationsPress={() => router.push('/notifications')}
        />

        {serviceHealth.data && !serviceHealth.data.ok ? (
          <View style={styles.healthBanner}>
            <Text style={styles.healthWarn}>
              {serviceHealth.data.message ??
                'Restaurant service is down. Orders may not update until it recovers.'}
            </Text>
          </View>
        ) : null}

        <View style={styles.body}>
          {restaurant.data?.id ? (
            <KitchenDutyCard
              restaurantId={restaurant.data.id}
              compact
              onHoursPress={() => router.replace('/settings')}
            />
          ) : null}
          <KitchenKycBanner
            restaurantId={restaurant.data?.id}
            onPress={() => router.push('/onboarding')}
          />
          <TodayStatsCard
            restaurantId={restaurant.data?.id}
            metrics={dashboard.metrics}
            earningsLoading={
              isRefetching && dashboard.metrics.grossRevenue == null
            }
            onRatingPress={() => router.push('/reviews')}
          />
          <QuickActionsGrid
            actions={dashboard.quickActions}
            onPromosPress={() => router.replace('/offers')}
            onReviewsPress={() => router.push('/reviews')}
            onAnalyticsPress={() => router.push('/analytics')}
          />
          <PendingOrdersSection
            orders={dashboard.pendingOrders}
            onQueuePress={() => router.replace('/orders')}
            onOrderPress={(order) => {
              router.push(`/order/${encodeURIComponent(order.id)}`);
            }}
          />
        </View>
      </ScrollView>

      <DashboardTabBar
        active="stats"
        centerBadge={dashboard.quickActions.activeOrders}
        onNavigate={(href) => router.replace(href)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F3F0',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: PARTNER_BOTTOM_NAV_INSET + 16,
  },
  healthBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FECACA',
  },
  healthWarn: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.error,
    lineHeight: 18,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 18,
  },
});
