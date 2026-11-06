import { MapPin, Navigation } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useDeliveryHeaderScrollProps } from '@/components/delivery/shared/header-scroll';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatInr } from '@/lib/delivery-partner/offer-earnings';
import { formatLastTrip } from '@/lib/delivery-partner/restaurants-api';
import { useRiderRestaurants } from '@/lib/delivery-partner/restaurants-hooks';
import type { RiderRestaurantStat } from '@/lib/delivery-partner/restaurants-types';
import { getApiErrorMessage } from '@/lib/errors';

function openMaps(lat: number, lng: number) {
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  void Linking.openURL(url);
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function RestaurantCard({ restaurant }: { restaurant: RiderRestaurantStat }) {
  const lastTrip = formatLastTrip(restaurant.lastTripAt);
  const hasPin = restaurant.lat != null && restaurant.lng != null;

  return (
    <View style={styles.card}>
      <Text style={[styles.cardTitle, !restaurant.name && styles.cardTitleMuted]} numberOfLines={1}>
        {restaurant.name ?? 'Name unavailable'}
      </Text>
      {lastTrip ? (
        <Text style={styles.muted}>Last trip {lastTrip}</Text>
      ) : null}

      <View style={styles.metricsBox}>
        <View style={styles.metricsRow}>
          <MetricCell label="Delivered" value={String(restaurant.deliveredTrips)} />
          <MetricCell label="Returned" value={String(restaurant.returnedTrips)} />
        </View>
        <View style={styles.metricsRow}>
          <MetricCell label="Cancelled / failed" value={String(restaurant.unpaidTrips)} />
          <MetricCell label="Earned" value={formatInr(restaurant.earned)} />
        </View>
      </View>

      {hasPin ? (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => openMaps(restaurant.lat!, restaurant.lng!)}
            style={styles.actionHit}
          >
            <View style={styles.primaryBtn}>
              <Navigation color="#FFFFFF" size={15} />
              <Text style={styles.primaryText}>Directions</Text>
            </View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function PartnerRestaurantsManager() {
  const headerScroll = useDeliveryHeaderScrollProps();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const query = useRiderRestaurants();

  const data = query.data;
  const restaurants = data?.restaurants ?? [];
  const loading = query.isLoading && !data;
  const error = query.error
    ? getApiErrorMessage(query.error, 'Could not load your restaurants.')
    : null;

  const onRefresh = async () => {
    setPullRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setPullRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: headerScroll.contentInsetTop + 14,
          paddingBottom: PARTNER_BOTTOM_NAV_INSET + 16,
        },
      ]}
      onScroll={headerScroll.onScroll}
      scrollEventThrottle={headerScroll.scrollEventThrottle}
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
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={authTheme.brand} size="large" />
          <Text style={styles.muted}>Loading your restaurants…</Text>
        </View>
      ) : error && !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.cardTitle}>Couldn’t load restaurants</Text>
          <Text style={styles.muted}>{error}</Text>
          <Pressable onPress={() => void onRefresh()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : data ? (
        <>
          {error ? (
            <Text style={styles.staleNote}>Showing last loaded data. {error}</Text>
          ) : null}
          <View style={styles.summaryRow}>
            <SummaryCard label="Restaurants" value={String(restaurants.length)} />
            <SummaryCard label="Paid trips" value={String(data.totalPaidTrips)} />
            <SummaryCard label="Earned" value={formatInr(data.totalEarned)} />
          </View>
          <View style={styles.windowRow}>
            <MapPin color={authTheme.textMuted} size={13} />
            <Text style={styles.muted}>
              Restaurants you picked up from in the last {data.windowDays} days
              {data.partial ? ' (most recent 500 trips)' : ''}
            </Text>
          </View>

          {restaurants.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.cardTitle}>No trips yet</Text>
              <Text style={styles.muted}>
                Restaurants appear here after you complete or close a trip.
              </Text>
            </View>
          ) : (
            restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.restaurantId} restaurant={restaurant} />
            ))
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: authTheme.surface },
  scroll: { flexGrow: 1, paddingHorizontal: 16, gap: 12 },
  center: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: authTheme.textMuted,
    lineHeight: 18,
  },
  staleNote: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.error,
  },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: authTheme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    padding: 16,
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: authTheme.textMuted,
    marginBottom: 6,
  },
  summaryValue: { fontFamily: fonts.bold, fontSize: 18, color: authTheme.text },
  windowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  card: {
    backgroundColor: authTheme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    padding: 16,
    gap: 10,
  },
  emptyCard: {
    backgroundColor: authTheme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    padding: 24,
    gap: 8,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: authTheme.text },
  cardTitleMuted: { color: authTheme.textMuted },
  metricsBox: {
    backgroundColor: authTheme.bgSoft,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricCell: { flex: 1 },
  metricLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: authTheme.textDim,
    marginBottom: 2,
  },
  metricValue: { fontFamily: fonts.semiBold, fontSize: 13, color: authTheme.text },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionHit: { flex: 1 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: authTheme.brand,
  },
  primaryText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: authTheme.brand,
  },
  retryText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' },
});
