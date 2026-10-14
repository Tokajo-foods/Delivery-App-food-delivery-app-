import { ShieldCheck, Star } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { DashboardMetrics } from '@/lib/dashboard/types';
import { useOutletHygiene, useOutletRatings } from '@/lib/restaurant/hooks';

type Props = {
  restaurantId?: string;
  metrics: DashboardMetrics;
  onRatingPress?: () => void;
};

export function TodayStatsCard({ restaurantId, metrics, onRatingPress }: Props) {
  const hygiene = useOutletHygiene(restaurantId, Boolean(restaurantId));
  const ratings = useOutletRatings(restaurantId, Boolean(restaurantId));
  const hygieneData = hygiene.data;
  const liveRatings = ratings.data?.available ? ratings.data : null;

  const hasRevenue =
    metrics.grossRevenue != null && Number.isFinite(metrics.grossRevenue);
  const hasOrders =
    metrics.totalOrders != null && Number.isFinite(metrics.totalOrders);
  const rating =
    liveRatings?.avgRating ??
    (metrics.rating != null && Number.isFinite(metrics.rating)
      ? metrics.rating
      : null);
  const ratingCount =
    liveRatings?.totalRatings ??
    (metrics.totalRatings != null && Number.isFinite(metrics.totalRatings)
      ? metrics.totalRatings
      : null);

  const sales = hasRevenue
    ? formatCurrency(metrics.grossRevenue as number)
    : '—';
  const orders = hasOrders ? String(Math.round(metrics.totalOrders as number)) : '—';
  const ratingLabel =
    rating != null && rating > 0 ? rating.toFixed(1) : '—';
  const hygieneLabel = hygieneData?.available
    ? hygieneData.hygieneScore.toFixed(1)
    : hygiene.isLoading
      ? '…'
      : '—';
  const ratingHint = ratingCount
    ? `${ratingCount} review${ratingCount === 1 ? '' : 's'}`
    : 'Reviews';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today</Text>
      <View style={styles.rows}>
        <View style={styles.row}>
          <View style={styles.tile}>
            <Text style={styles.label}>Sales</Text>
            <Text style={styles.valueAccent} numberOfLines={1} adjustsFontSizeToFit>
              {sales}
            </Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.label}>Orders</Text>
            <Text style={styles.value} numberOfLines={1}>
              {orders}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Pressable
            onPress={onRatingPress}
            disabled={!onRatingPress}
            style={styles.tile}
          >
            <Text style={styles.label}>Rating</Text>
            <View style={styles.valueRow}>
              <Star color="#EA4B14" size={14} fill="#EA4B14" />
              <Text style={styles.value}>{ratingLabel}</Text>
            </View>
            <Text style={styles.hint} numberOfLines={1}>
              {ratingHint}
            </Text>
          </Pressable>
          <View style={styles.tile}>
            <Text style={styles.label}>Hygiene</Text>
            <View style={styles.valueRow}>
              <ShieldCheck color="#EA4B14" size={14} />
              <Text style={styles.value}>{hygieneLabel}</Text>
            </View>
            <Text style={styles.hint} numberOfLines={1}>
              {hygieneData?.available
                ? hygieneData.fssaiMasked || 'FSSAI'
                : 'FSSAI'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    padding: 14,
    gap: 12,
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  title: {
    color: authTheme.text,
    fontSize: 17,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.3,
    paddingHorizontal: 4,
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: '#FFF8F4',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  label: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  value: {
    color: authTheme.text,
    fontSize: 22,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.6,
  },
  valueAccent: {
    color: '#EA4B14',
    fontSize: 22,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hint: {
    color: authTheme.textMuted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
});
