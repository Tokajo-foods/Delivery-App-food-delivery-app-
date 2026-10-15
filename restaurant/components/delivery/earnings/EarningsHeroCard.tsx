import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { overviewStyles as styles } from '@/components/delivery/earnings/earnings-overview-styles';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import type { PartnerEarningsSummary } from '@/lib/delivery-partner/analytics-types';
import type { PartnerTodayStats } from '@/lib/delivery-partner/today-stats';

type Props = {
  currency: string;
  lifetime: number;
  lifetimeTrips: number;
  summary?: PartnerEarningsSummary;
  today?: PartnerTodayStats;
  payable: number;
  onWithdraw: () => void;
};

export function EarningsHeroCard({
  currency,
  lifetime,
  lifetimeTrips,
  summary,
  today,
  payable,
  onWithdraw,
}: Props) {
  const stats = [
    {
      label: 'Today',
      amount: today?.earnings ?? summary?.today.totalEarnings ?? 0,
      trips: today?.trips ?? summary?.today.totalDeliveries ?? 0,
    },
    {
      label: 'This week',
      amount: summary?.week.totalEarnings ?? 0,
      trips: summary?.week.totalDeliveries ?? 0,
    },
    {
      label: 'This month',
      amount: summary?.month.totalEarnings ?? 0,
      trips: summary?.month.totalDeliveries ?? 0,
    },
  ];

  return (
    <LinearGradient
      colors={['#C23D0F', '#EA4B14', '#F97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View>
        <Text style={styles.heroKicker}>TOTAL EARNINGS</Text>
        <Text style={styles.heroAmount}>{formatCurrency(lifetime, currency)}</Text>
        <Text style={styles.heroSub}>
          Lifetime · {lifetimeTrips} {lifetimeTrips === 1 ? 'trip' : 'trips'}
        </Text>
      </View>

      <View style={styles.heroStats}>
        {stats.map((item, index) => (
          <View key={item.label} style={{ flexDirection: 'row', flex: 1 }}>
            {index > 0 ? <View style={styles.heroStatDivider} /> : null}
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>{item.label}</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(item.amount, currency)}
              </Text>
              <Text style={styles.heroStatMeta}>
                {item.trips} trips
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.withdrawBar}>
        <View>
          <Text style={styles.withdrawLabel}>Available to withdraw</Text>
          <Text style={styles.withdrawValue}>{formatCurrency(payable, currency)}</Text>
        </View>
        <Pressable
          onPress={onWithdraw}
          style={({ pressed }) => [styles.withdrawBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Withdraw earnings"
        >
          <Text style={styles.withdrawBtnText}>Withdraw</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
