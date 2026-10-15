import { useRouter } from 'expo-router';
import {
  BadgeCheck,
  ChevronRight,
  CircleCheck,
  Flame,
  Timer,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { styles } from '@/components/delivery/home/home-screen-styles';
import { authTheme } from '@/constants/auth-theme';
import { formatPercent } from '@/lib/delivery-partner/analytics-api';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';

type Props = {
  acceptanceRate: number;
  completionRate: number;
  onTimeRate: number;
  streak: number;
};

export function HomePerformanceCard({
  acceptanceRate,
  completionRate,
  onTimeRate,
  streak,
}: Props) {
  const router = useRouter();
  const open = () => router.push(DELIVERY_ROUTES.performance);

  return (
    <View style={styles.section}>
      <Pressable onPress={open} style={styles.sectionRow}>
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
      <Pressable onPress={open} style={styles.card}>
        <View style={styles.perfGrid}>
          <View style={styles.perfItem}>
            <View style={styles.perfIcon}>
              <BadgeCheck color="#EA4B14" size={16} strokeWidth={2.2} />
            </View>
            <Text style={styles.perfValue}>{formatPercent(acceptanceRate)}</Text>
            <Text style={styles.perfLabel}>Acceptance</Text>
          </View>
          <View style={styles.perfItem}>
            <View style={styles.perfIcon}>
              <CircleCheck color="#EA4B14" size={16} strokeWidth={2.2} />
            </View>
            <Text style={styles.perfValue}>{formatPercent(completionRate)}</Text>
            <Text style={styles.perfLabel}>Completion</Text>
          </View>
          <View style={styles.perfItem}>
            <View style={styles.perfIcon}>
              <Timer color="#EA4B14" size={16} strokeWidth={2.2} />
            </View>
            <Text style={styles.perfValue}>{formatPercent(onTimeRate)}</Text>
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
  );
}
