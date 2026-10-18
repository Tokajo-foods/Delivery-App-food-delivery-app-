import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { EarningsPeriod, EarningsSummary } from '@/lib/restaurant/earnings-types';

import { dayBarLabel, dayHeaderLabel, istDateKey } from './earnings-format';

const BAR_HEIGHT = 76;

export function EarningsTrend({
  summary,
  period,
}: {
  summary: EarningsSummary;
  period: EarningsPeriod;
}) {
  const rangeFrom = istDateKey(summary.periods[period === 'month' ? 'month' : 'week'].from);
  const today = istDateKey(new Date());
  const days = summary.daily.filter((d) => d.date >= rangeFrom && d.date <= today);
  if (days.length === 0) return null;

  const max = Math.max(...days.map((d) => d.netEarnings), 0);
  const best = days.reduce((a, b) => (b.netEarnings > a.netEarnings ? b : a), days[0]);
  const dense = days.length > 10;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>
          {period === 'month' ? 'Daily this month' : 'Daily this week'}
        </Text>
        {best.netEarnings > 0 ? (
          <Text style={styles.hint}>
            Best {dayHeaderLabel(best.date)} · {formatCurrency(best.netEarnings)}
          </Text>
        ) : null}
      </View>
      <View style={styles.chart}>
        {days.map((d) => {
          const ratio = max > 0 ? Math.max(0, d.netEarnings) / max : 0;
          const isToday = d.date === today;
          return (
            <View key={d.date} style={styles.col}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(ratio * BAR_HEIGHT, d.netEarnings > 0 ? 4 : 2) },
                    isToday ? styles.barToday : d.netEarnings > 0 ? styles.barOn : styles.barOff,
                  ]}
                />
              </View>
              {!dense || isToday || Number(d.date.slice(-2)) % 5 === 1 ? (
                <Text style={[styles.label, isToday && styles.labelToday]}>
                  {dayBarLabel(d.date, period === 'month' ? 'month' : 'week')}
                </Text>
              ) : (
                <Text style={styles.label}> </Text>
              )}
            </View>
          );
        })}
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
    padding: 18,
    gap: 14,
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  head: { gap: 2 },
  title: { fontFamily: fonts.semiBold, fontSize: 13, color: '#1C1917' },
  hint: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  track: { height: BAR_HEIGHT, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '62%', maxWidth: 18, borderRadius: 5 },
  barOn: { backgroundColor: '#FDBA8C' },
  barOff: { backgroundColor: '#F1F5F9' },
  barToday: { backgroundColor: '#EA4B14' },
  label: { fontFamily: fonts.medium, fontSize: 10, color: authTheme.textDim },
  labelToday: { color: '#EA4B14', fontFamily: fonts.bold },
});
