import { Text, View } from 'react-native';

import { PeriodStats } from '@/components/delivery/earnings/PeriodStats';
import { SectionState } from '@/components/delivery/earnings/SectionState';
import { earningsStyles as styles } from '@/components/delivery/earnings/earnings-styles';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import type { PartnerEarningsSummary } from '@/lib/delivery-partner/analytics-types';
import type { PartnerTodayStats } from '@/lib/delivery-partner/today-stats';

type Props = {
  summary?: PartnerEarningsSummary;
  today: PartnerTodayStats;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

function trips(n: number) {
  return `${n} ${n === 1 ? 'trip' : 'trips'}`;
}

/** GET /partners/me/earnings — IST today / ISO week / calendar month. */
export function EarningsSummaryCard({ summary, today, loading, error, onRetry }: Props) {
  const currency = summary?.currency ?? today.currency;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Earnings</Text>
      {loading ? (
        <SectionState kind="loading" />
      ) : error || !summary ? (
        <SectionState kind="error" message={error ?? 'Could not load earnings.'} onRetry={onRetry} />
      ) : (
        <PeriodStats
          items={[
            { label: 'Today', value: formatCurrency(today.earnings, currency), meta: trips(today.trips) },
            {
              label: 'This week',
              value: formatCurrency(summary.week.totalEarnings, currency),
              meta: trips(summary.week.totalDeliveries),
            },
            {
              label: 'This month',
              value: formatCurrency(summary.month.totalEarnings, currency),
              meta: trips(summary.month.totalDeliveries),
            },
          ]}
        />
      )}
    </View>
  );
}
