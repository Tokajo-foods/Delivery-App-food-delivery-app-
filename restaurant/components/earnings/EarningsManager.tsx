import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import { WithdrawEarningsSheet } from '@/components/finance/WithdrawEarningsSheet';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { useEarningsSummary } from '@/lib/restaurant/earnings-hooks';
import type { EarningsPeriod } from '@/lib/restaurant/earnings-types';

import { periodDeltaPercent } from './earnings-format';
import { EarningsBreakdown } from './EarningsBreakdown';
import { PeriodTabs } from './EarningsControls';
import { EarningsHero } from './EarningsHero';
import { EarningsError } from './EarningsStates';
import { EarningsTrend } from './EarningsTrend';
import { type EarningsView, EarningsViewToggle } from './EarningsViewToggle';
import { PassbookView } from './PassbookView';

export function EarningsManager() {
  const [view, setView] = useState<EarningsView>('earnings');
  const [period, setPeriod] = useState<EarningsPeriod>('today');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const summary = useEarningsSummary();
  const remaining =
    summary.data?.remaining ?? summary.data?.available ?? summary.data?.balance ?? 0;

  const totals = summary.data?.periods[period];
  const deltaPercent = useMemo(
    () => (summary.data ? periodDeltaPercent(summary.data, period) : null),
    [summary.data, period]
  );
  const refreshSummary = () => void summary.refetch();

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader title="Earnings" subtitle="Withdraw remaining anytime · IST" showBack>
        <View style={styles.controls}>
          <EarningsViewToggle value={view} onChange={setView} />
          <PeriodTabs value={period} onChange={setPeriod} />
        </View>
      </RestaurantPageHeader>

      {view === 'earnings' ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: PARTNER_BOTTOM_NAV_INSET }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={summary.isRefetching && !summary.isLoading}
              onRefresh={refreshSummary}
              tintColor={authTheme.brand}
            />
          }
        >
          {summary.error && !summary.data ? (
            <EarningsError message={summary.error.message} onRetry={refreshSummary} />
          ) : (
            <EarningsHero
              period={period}
              totals={totals}
              balance={remaining}
              settled={summary.data?.settled}
              canWithdraw={remaining >= 1}
              onWithdraw={() => setWithdrawOpen(true)}
              deltaPercent={deltaPercent}
              loading={summary.isLoading || summary.restaurantLoading}
              refreshing={summary.isFetching && !summary.isLoading}
            />
          )}
          {summary.data ? <EarningsTrend summary={summary.data} period={period} /> : null}
          {totals ? <EarningsBreakdown totals={totals} /> : null}
        </ScrollView>
      ) : (
        <PassbookView
          period={period}
          totals={totals}
          balance={remaining}
          onRefreshSummary={refreshSummary}
        />
      )}
      <WithdrawEarningsSheet
        visible={withdrawOpen}
        available={remaining}
        onClose={() => setWithdrawOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F6F7' },
  controls: { gap: 10 },
  content: { paddingHorizontal: 16, paddingTop: 2, gap: 12 },
});
