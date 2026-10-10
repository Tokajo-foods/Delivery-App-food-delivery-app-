import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { earningsPageStyles as styles } from '@/components/delivery/earnings/earnings-page-styles';
import { formatIncentiveAmount } from '@/lib/delivery-partner/analytics-api';
import type { PartnerIncentive } from '@/lib/delivery-partner/analytics-types';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';

export function EarningsIncentiveRow({
  item,
  currency,
}: {
  item: PartnerIncentive;
  currency: string;
}) {
  const router = useRouter();
  const reward = formatIncentiveAmount(item.amount, item.currency ?? currency);
  const progress = item.progress ?? 0;
  const target = item.target ?? 0;
  const pct = target > 0 ? Math.max(0, Math.min(100, (progress / target) * 100)) : 0;

  return (
    <Pressable onPress={() => router.push(DELIVERY_ROUTES.incentives)} style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {reward ? <Text style={styles.link}>{reward}</Text> : null}
      </View>
      {item.description ? (
        <Text style={styles.rowMeta} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      {target > 0 ? (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.rowMeta}>
              {item.progressLabel ?? `${progress} / ${target}`}
            </Text>
            <Text style={styles.rowMeta}>{Math.round(pct)}%</Text>
          </View>
        </>
      ) : null}
    </Pressable>
  );
}
