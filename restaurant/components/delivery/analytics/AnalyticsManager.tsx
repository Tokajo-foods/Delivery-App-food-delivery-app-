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

import { AnalyticsTrendChart } from '@/components/delivery/analytics/AnalyticsTrendChart';
import { analyticsPageStyles as styles } from '@/components/delivery/analytics/analytics-page-styles';
import { PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import {
  formatCurrency,
  formatHours,
  formatPercent,
  formatRating,
  lastNDays,
  selectEarningsPeriod,
} from '@/lib/delivery-partner/analytics-api';
import {
  usePartnerDailyEarnings,
  usePartnerEarnings,
  usePartnerPerformance,
} from '@/lib/delivery-partner/analytics-hooks';
import { usePartnerAttendanceStreak } from '@/lib/delivery-partner/availability-hooks';
import { resolveDisplayStreak } from '@/lib/delivery-partner/availability-types';
import type { EarningsPeriodDays } from '@/lib/delivery-partner/analytics-types';
import { getApiErrorMessage } from '@/lib/errors';

const PERIODS: { days: EarningsPeriodDays; label: string }[] = [
  { days: 7, label: 'This week' },
  { days: 30, label: 'This month' },
];

export function PartnerAnalyticsManager() {
  const insets = useSafeAreaInsets();
  const [days, setDays] = useState<EarningsPeriodDays>(7);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const performance = usePartnerPerformance();
  const attendanceStreak = usePartnerAttendanceStreak();
  const earnings = usePartnerEarnings();
  const daily = usePartnerDailyEarnings(days);

  const perf = performance.data;
  const summary = earnings.data;
  const period = selectEarningsPeriod(summary, days === 7 ? 'week' : 'month');
  const currency = summary?.currency ?? 'INR';
  const last7 = useMemo(
    () => lastNDays(daily.data?.points ?? [], 7),
    [daily.data?.points]
  );

  const loading =
    (performance.isLoading && !perf) ||
    (earnings.isLoading && !earnings.data) ||
    (daily.isLoading && !daily.data);

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

  const trips = period.totalDeliveries || perf?.totalDeliveries || 0;
  const showSplit =
    period.incentives <= 0 &&
    (period.baseEarnings > 0 || period.tips > 0);
  const score =
    perf?.performanceScore != null
      ? String(Math.round(perf.performanceScore))
      : '—';
  const streak = resolveDisplayStreak(
    attendanceStreak.data,
    perf?.currentStreak
  );

  const stats = [
    {
      id: 'deliveries',
      value: String(perf?.totalDeliveries ?? trips),
      label: 'Deliveries',
      hint: 'Completed trips',
    },
    {
      id: 'rating',
      value: formatRating(perf?.avgRating ?? 0),
      label: 'Rating',
      hint: 'From customers',
    },
    {
      id: 'ontime',
      value: formatPercent(perf?.onTimeRate ?? 0),
      label: 'On time',
      hint: 'Arrived as expected',
    },
    {
      id: 'done',
      value: formatPercent(perf?.completionRate ?? 0),
      label: 'Completed',
      hint: 'Trips you finished',
    },
    {
      id: 'accept',
      value: formatPercent(perf?.acceptanceRate ?? 0),
      label: 'Accepted',
      hint: 'Offers you took',
    },
    {
      id: 'hours',
      value: formatHours(period.onlineHours),
      label: 'Online',
      hint: days === 7 ? 'Hours this week' : 'Hours this month',
    },
    {
      id: 'streak',
      value: String(streak),
      label: 'Streak',
      hint: 'Days in a row',
    },
    {
      id: 'score',
      value: score,
      label: 'Score',
      hint: perf?.scoreLabel ?? 'Out of 100',
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.sub}>Earnings and how your trips are going.</Text>
        <View style={styles.period}>
          {PERIODS.map((item) => {
            const on = days === item.days;
            return (
              <Pressable
                key={item.days}
                onPress={() => setDays(item.days)}
                style={[styles.periodBtn, on && styles.periodBtnOn]}
              >
                <Text style={[styles.periodText, on && styles.periodTextOn]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: PARTNER_BOTTOM_NAV_INSET + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void onRefresh()}
            tintColor="#EA4B14"
          />
        }
        showsVerticalScrollIndicator={false}
      >
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
              <View>
                <Text style={styles.heroKicker}>
                  {days === 7 ? 'THIS WEEK' : 'THIS MONTH'}
                </Text>
                <Text style={styles.heroAmount}>
                  {formatCurrency(period.totalEarnings, currency)}
                </Text>
                <Text style={styles.heroMeta}>
                  {trips} {trips === 1 ? 'delivery' : 'deliveries'} ·{' '}
                  {formatHours(period.onlineHours)} online
                </Text>
              </View>
              {showSplit ? (
                <View style={styles.split}>
                  <View style={styles.splitCol}>
                    <Text style={styles.splitLabel}>Base pay</Text>
                    <Text style={styles.splitValue}>
                      {formatCurrency(period.baseEarnings, currency)}
                    </Text>
                  </View>
                  <View style={styles.splitRule} />
                  <View style={styles.splitCol}>
                    <Text style={styles.splitLabel}>Tips</Text>
                    <Text style={styles.splitValue}>
                      {formatCurrency(period.tips, currency)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            <Text style={styles.sectionLabel}>Your stats</Text>
            <View style={styles.grid}>
              {stats.map((item) => (
                <View key={item.id} style={styles.stat}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statHint}>{item.hint}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Last 7 days</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Earnings</Text>
              <Text style={styles.cardHint}>Taller bars mean more pay that day.</Text>
              <AnalyticsTrendChart points={last7} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
