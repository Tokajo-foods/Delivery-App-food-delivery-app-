import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyticsPeriodControls } from '@/components/delivery/analytics/AnalyticsPeriodControls';
import { AnalyticsTrendChart } from '@/components/delivery/analytics/AnalyticsTrendChart';
import {
  addDays,
  dateKey,
  fillDaily,
  sumDaily,
  type AnalyticsMode,
} from '@/components/delivery/analytics/analytics-range';
import { analyticsPageStyles as styles } from '@/components/delivery/analytics/analytics-page-styles';
import { PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import {
  formatCurrency,
  formatHours,
  formatPercent,
  formatRating,
  selectEarningsPeriod,
} from '@/lib/delivery-partner/analytics-api';
import {
  usePartnerEarnings,
  usePartnerEarningsRange,
  usePartnerPerformance,
} from '@/lib/delivery-partner/analytics-hooks';
import { usePartnerAttendanceStreak } from '@/lib/delivery-partner/availability-hooks';
import { resolveDisplayStreak } from '@/lib/delivery-partner/availability-types';
import type { EarningsPeriodKey } from '@/lib/delivery-partner/analytics-types';
import { getApiErrorMessage } from '@/lib/errors';

const PERIOD_KEY: Record<Exclude<AnalyticsMode, 'range'>, EarningsPeriodKey> = {
  day: 'today',
  week: 'week',
  month: 'month',
};

export function PartnerAnalyticsManager() {
  const insets = useSafeAreaInsets();
  const today = dateKey(new Date());
  const [mode, setMode] = useState<AnalyticsMode>('day');
  const [customFrom, setCustomFrom] = useState(addDays(today, -6));
  const [customTo, setCustomTo] = useState(today);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const performance = usePartnerPerformance();
  const attendanceStreak = usePartnerAttendanceStreak();
  const earnings = usePartnerEarnings();

  const summary = earnings.data;
  const preset =
    mode === 'range' || !summary
      ? undefined
      : summary[PERIOD_KEY[mode]];
  const from = mode === 'range' ? customFrom : preset?.from;
  const to = mode === 'range' ? customTo : preset?.to;
  const daily = usePartnerEarningsRange(from, to);

  const perf = performance.data;
  const currency = summary?.currency ?? 'INR';
  const period =
    mode === 'range'
      ? sumDaily(daily.data?.points ?? [])
      : selectEarningsPeriod(summary, PERIOD_KEY[mode]);
  const chartPoints = useMemo(
    () => (from && to ? fillDaily(from, to, daily.data?.points ?? []) : []),
    [from, to, daily.data?.points]
  );

  const loading =
    (performance.isLoading && !perf) || (earnings.isLoading && !summary);
  const error =
    performance.error || earnings.error || daily.error
      ? getApiErrorMessage(
          performance.error ?? earnings.error ?? daily.error,
          'Could not load analytics.'
        )
      : null;

  const onRefresh = async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([
        performance.refetch(),
        attendanceStreak.refetch(),
        earnings.refetch(),
        daily.refetch(),
      ]);
    } finally {
      setPullRefreshing(false);
    }
  };

  const trips = period.totalDeliveries;
  const showSplit =
    period.incentives <= 0 && (period.baseEarnings > 0 || period.tips > 0);
  const score =
    perf?.performanceScore != null
      ? String(Math.round(perf.performanceScore))
      : '—';
  const streak = resolveDisplayStreak(attendanceStreak.data, perf?.currentStreak);
  const paidLabel =
    mode === 'day'
      ? 'Paid today'
      : mode === 'week'
        ? 'Paid this week'
        : mode === 'month'
          ? 'Paid this month'
          : 'Paid in this range';

  const quality = [
    { id: 'ontime', value: formatPercent(perf?.onTimeRate ?? 0), label: 'On time', hint: 'Arrived as expected' },
    { id: 'done', value: formatPercent(perf?.completionRate ?? 0), label: 'Completed', hint: 'Trips you finished' },
    { id: 'accept', value: formatPercent(perf?.acceptanceRate ?? 0), label: 'Accepted', hint: 'Offers you took' },
    { id: 'streak', value: `${streak} days`, label: 'Streak', hint: 'Days in a row' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.sub}>Earnings and how your trips are going.</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: PARTNER_BOTTOM_NAV_INSET + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void onRefresh()}
            tintColor="#EA4B14"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <AnalyticsPeriodControls
          mode={mode}
          onMode={setMode}
          from={customFrom}
          to={customTo}
          onFrom={setCustomFrom}
          onTo={setCustomTo}
        />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#EA4B14" />
          </View>
        ) : error && !perf && !summary ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void onRefresh()} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroBody}>
                <Text style={styles.heroAmount}>
                  {formatCurrency(period.totalEarnings, currency)}
                </Text>
                <Text style={styles.heroMeta}>
                  {showSplit
                    ? `Base ${formatCurrency(period.baseEarnings, currency)} · Tips ${formatCurrency(period.tips, currency)}`
                    : paidLabel}
                </Text>
              </View>
              <View style={styles.footer}>
                <View style={styles.footerCell}>
                  <Text style={styles.footerValue}>{trips}</Text>
                  <Text style={styles.footerLabel}>Deliveries</Text>
                </View>
                <View style={styles.footerRule} />
                <View style={styles.footerCell}>
                  <Text style={styles.footerValue}>{formatHours(period.onlineHours)}</Text>
                  <Text style={styles.footerLabel}>Online</Text>
                </View>
                <View style={styles.footerRule} />
                <View style={styles.footerCell}>
                  <Text style={styles.footerValue}>{formatRating(perf?.avgRating ?? 0)}</Text>
                  <Text style={styles.footerLabel}>Rating</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>How you are doing</Text>
                {score !== '—' ? <Text style={styles.cardAside}>Score {score}</Text> : null}
              </View>
              <View style={styles.grid}>
                {quality.map((item, index) => (
                  <View key={item.id} style={[styles.cell, index % 2 === 1 && styles.cellRight]}>
                    <Text style={styles.cellValue}>{item.value}</Text>
                    <Text style={styles.cellLabel}>{item.label}</Text>
                    <Text style={styles.cellHint}>{item.hint}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>By day</Text>
                {daily.isFetching ? <ActivityIndicator color="#EA4B14" size="small" /> : null}
              </View>
              <View style={styles.chartBody}>
                {daily.isError ? (
                  <Text style={styles.empty}>{error}</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                    <View style={{ width: Math.max(280, chartPoints.length * 36) }}>
                      <AnalyticsTrendChart points={chartPoints} />
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
