import { Star } from 'lucide-react-native';
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
    : 'No reviews yet';

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Today's sales</Text>
      <Text style={styles.sales} numberOfLines={1} adjustsFontSizeToFit>
        {sales}
      </Text>
      <View style={styles.rule} />
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.value}>{orders}</Text>
          <Text style={styles.label}>Orders</Text>
        </View>
        <View style={styles.divider} />
        <Pressable
          onPress={onRatingPress}
          disabled={!onRatingPress}
          style={styles.stat}
        >
          <View style={styles.valueRow}>
            <Star color="#EA4B14" size={13} fill="#EA4B14" />
            <Text style={styles.value}>{ratingLabel}</Text>
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {ratingHint}
          </Text>
        </Pressable>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.value}>{hygieneLabel}</Text>
          <Text style={styles.label}>Hygiene</Text>
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  kicker: {
    color: '#1C1917',
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  sales: {
    marginTop: 2,
    color: '#EA4B14',
    fontSize: 32,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.8,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D6D3D1',
    marginTop: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#D6D3D1',
  },
  value: {
    color: authTheme.text,
    fontSize: 18,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
});
