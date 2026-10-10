import { Text, View } from 'react-native';

import { analyticsPageStyles as styles } from '@/components/delivery/analytics/analytics-page-styles';
import type { PartnerDailyEarning } from '@/lib/delivery-partner/analytics-types';

export function AnalyticsTrendChart({
  points,
}: {
  points: PartnerDailyEarning[];
}) {
  if (!points.length) {
    return <Text style={styles.empty}>No days to show yet.</Text>;
  }

  const values = points.map((point) => Math.max(0, point.earnings));
  const max = Math.max(...values, 1);
  const hasEarnings = values.some((value) => value > 0);

  if (!hasEarnings) {
    return <Text style={styles.empty}>No earnings in the last 7 days.</Text>;
  }

  return (
    <View style={styles.barsRow}>
      {points.map((point, index) => {
        const value = values[index] ?? 0;
        const height = Math.max(6, (value / max) * 96);
        return (
          <View key={`${point.date}-${index}`} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height }]} />
            </View>
            <Text style={styles.barLabel} numberOfLines={1}>
              {point.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
