import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import type { EarningsPeriod, PassbookFilter } from '@/lib/restaurant/earnings-types';

import { PERIOD_LABELS } from './earnings-format';

const PERIODS: EarningsPeriod[] = ['today', 'week', 'month'];

const FILTERS: { key: PassbookFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'order_credit', label: 'Orders' },
  { key: 'payout_debit', label: 'Payouts' },
  { key: 'adjustment', label: 'Adjustments' },
];

export function PeriodTabs({
  value,
  onChange,
}: {
  value: EarningsPeriod;
  onChange: (next: EarningsPeriod) => void;
}) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {PERIODS.map((p) => {
        const on = p === value;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={[styles.tab, on && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.tabText, on && styles.tabTextOn]}>{PERIOD_LABELS[p]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PassbookFilterChips({
  value,
  onChange,
}: {
  value: PassbookFilter;
  onChange: (next: PassbookFilter) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {FILTERS.map((f) => {
        const on = f.key === value;
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: authTheme.tabBg,
    borderRadius: 14,
    padding: 3,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 11 },
  tabOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F1300',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: { fontFamily: fonts.semiBold, fontSize: 13, color: authTheme.textMuted },
  tabTextOn: { color: authTheme.brand, fontFamily: fonts.bold },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 6,
    backgroundColor: authTheme.tabBg,
  },
  chipOn: { backgroundColor: authTheme.brandSoft },
  chipText: { fontFamily: fonts.semiBold, fontSize: 12.5, color: authTheme.textMuted },
  chipTextOn: { color: authTheme.brand },
});
