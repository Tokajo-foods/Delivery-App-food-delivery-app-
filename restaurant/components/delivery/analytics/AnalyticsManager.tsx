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

  const quality = [
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
      id: 'streak',
      value: `${streak} days`,
      label: 'Streak',
      hint: 'Days in a row',
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.sub}>Earnings and how your trips are going.</Text>
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
              <View style={styles.band}>
                <Text style={styles.bandLabel}>EARNINGS</Text>
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
                          {item.days === 7 ? 'Week' : 'Month'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={styles.heroBody}>
                <Text style={styles.heroAmount}>
                  {formatCurrency(period.totalEarnings, currency)}
                </Text>
                <Text style={styles.heroMeta}>
                  {showSplit
                    ? `Base ${formatCurrency(period.baseEarnings, currency)} · Tips ${formatCurrency(period.tips, currency)}`
                    : days === 7
                      ? 'Paid this week'
                      : 'Paid this month'}
                </Text>
              </View>
              <View style={styles.footer}>
                <View style={styles.footerCell}>
                  <Text style={styles.footerValue}>{trips}</Text>
                  <Text style={styles.footerLabel}>Deliveries</Text>
                </View>
                <View style={styles.footerRule} />
                <View style={styles.footerCell}>
                  <Text style={styles.footerValue}>
                    {formatHours(period.onlineHours)}
                  </Text>
                  <Text style={styles.footerLabel}>Online</Text>
                </View>
                <View style={styles.footerRule} />
                <View style={styles.footerCell}>
                  <Text style={styles.footerValue}>
                    {formatRating(perf?.avgRating ?? 0)}
                  </Text>
                  <Text style={styles.footerLabel}>Rating</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>How you are doing</Text>
                {score !== '—' ? (
                  <Text style={styles.cardAside}>Score {score}</Text>
                ) : null}
              </View>
              <View style={styles.grid}>
                {quality.map((item, index) => (
                  <View
                    key={item.id}
                    style={[styles.cell, index % 2 === 1 && styles.cellRight]}
                  >
                    <Text style={styles.cellValue}>{item.value}</Text>
                    <Text style={styles.cellLabel}>{item.label}</Text>
                    <Text style={styles.cellHint}>{item.hint}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Last 7 days</Text>
              </View>
              <View style={styles.chartBody}>
                <AnalyticsTrendChart points={last7} />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
