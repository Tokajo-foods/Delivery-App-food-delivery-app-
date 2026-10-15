import { Text, View } from 'react-native';

import { earningsStyles as styles } from '@/components/delivery/earnings/earnings-styles';

export type PeriodStat = { label: string; value: string; meta?: string };

/** Three equal columns: Today / This week / This month. */
export function PeriodStats({ items }: { items: PeriodStat[] }) {
  return (
    <View style={styles.stats}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.stat, index > 0 && styles.statDivider]}>
          <Text style={styles.statLabel}>{item.label}</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {item.value}
          </Text>
          {item.meta ? <Text style={styles.statMeta}>{item.meta}</Text> : null}
        </View>
      ))}
    </View>
  );
}
