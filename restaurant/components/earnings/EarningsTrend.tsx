import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { EarningsPeriod, EarningsSummary } from '@/lib/restaurant/earnings-types';

import {
  buildScopedDailySeries,
  dayBarLabel,
  dayHeaderLabel,
  istDateKey,
} from './earnings-format';

const BAR_HEIGHT = 76;
const WEEK_COL_WIDTH = 40;
const MONTH_COL_WIDTH = 28;
const CHART_PAD = 18;

export function EarningsTrend({
  summary,
  period,
}: {
  summary: EarningsSummary;
  period: EarningsPeriod;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const chartScope: 'week' | 'month' = period === 'month' ? 'month' : 'week';
  const days = buildScopedDailySeries(summary.daily, chartScope);
  if (days.length === 0) return null;

  const today = istDateKey(new Date());
  const max = Math.max(...days.map((d) => d.netEarnings), 0);
  const best = days.reduce((a, b) => (b.netEarnings > a.netEarnings ? b : a), days[0]);
  const colWidth = chartScope === 'month' ? MONTH_COL_WIDTH : WEEK_COL_WIDTH;
  const chartInnerWidth =
    chartScope === 'week'
      ? Math.min(screenWidth - 32 - CHART_PAD * 2, Math.max(days.length * colWidth, 280))
      : days.length * colWidth;

  const bars = (
    <View
      style={[
        styles.chart,
        {
          width: chartInnerWidth,
          minHeight: BAR_HEIGHT + 22,
          justifyContent: chartScope === 'month' ? 'flex-start' : 'space-between',
        },
      ]}
    >
      {days.map((d) => {
        const ratio = max > 0 ? Math.max(0, d.netEarnings) / max : 0;
        const isToday = d.date === today;
        const showLabel =
          chartScope === 'week' ||
          isToday ||
          Number(d.date.slice(-2)) === 1 ||
          Number(d.date.slice(-2)) % 5 === 0;
        return (
          <View key={d.date} style={[styles.col, { width: colWidth }]}>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(ratio * BAR_HEIGHT, max > 0 && d.netEarnings > 0 ? 6 : 8),
                  },
                  isToday ? styles.barToday : d.netEarnings > 0 ? styles.barOn : styles.barOff,
                ]}
              />
            </View>
            {showLabel ? (
              <Text style={[styles.label, isToday && styles.labelToday]} numberOfLines={1}>
                {dayBarLabel(d.date, chartScope)}
              </Text>
            ) : (
              <Text style={styles.labelSpacer}> </Text>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>
          {chartScope === 'month' ? 'Daily this month' : 'Daily this week'}
        </Text>
        {best.netEarnings > 0 ? (
          <Text style={styles.hint}>
            Best {dayHeaderLabel(best.date)} · {formatCurrency(best.netEarnings)}
          </Text>
        ) : (
          <Text style={styles.hint}>No order credits in this range yet</Text>
        )}
      </View>
      {chartScope === 'month' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthScroll}
        >
          {bars}
        </ScrollView>
      ) : (
        <View style={styles.weekWrap}>{bars}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    flexGrow: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    padding: CHART_PAD,
    gap: 12,
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  head: { gap: 2 },
  title: { fontFamily: fonts.semiBold, fontSize: 13, color: '#1C1917' },
  hint: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  weekWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthScroll: {
    paddingRight: 4,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  col: {
    alignItems: 'center',
    gap: 6,
  },
  track: {
    height: BAR_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 16,
    borderRadius: 5,
  },
  barOn: { backgroundColor: '#FDBA8C' },
  barOff: { backgroundColor: '#F1F5F9' },
  barToday: { backgroundColor: '#EA4B14' },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: authTheme.textDim,
    textAlign: 'center',
  },
  labelSpacer: {
    fontSize: 10,
    lineHeight: 12,
    color: 'transparent',
  },
  labelToday: { color: '#EA4B14', fontFamily: fonts.bold },
});
