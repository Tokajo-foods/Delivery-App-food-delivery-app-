import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { useEarningsSummary } from '@/lib/restaurant/earnings-hooks';
import type { EarningsPeriod } from '@/lib/restaurant/earnings-types';

import { periodDeltaPercent } from './earnings-format';
import { EarningsBreakdown } from './EarningsBreakdown';
import { EarningsHero } from './EarningsHero';
import { EarningsError } from './EarningsStates';
import { EarningsTrend } from './EarningsTrend';
import { type EarningsView, EarningsViewToggle } from './EarningsViewToggle';
import { PassbookView } from './PassbookView';

export function EarningsManager() {
  const [view, setView] = useState<EarningsView>('earnings');
  const [period, setPeriod] = useState<EarningsPeriod>('today');
  const summary = useEarningsSummary();

  const totals = summary.data?.periods[period];
  const deltaPercent = useMemo(
    () => (summary.data ? periodDeltaPercent(summary.data, period) : null),
    [summary.data, period]
  );
  const refreshSummary = () => void summary.refetch();

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader title="Earnings" subtitle="Net of platform fee · IST" showBack>
        <EarningsViewToggle value={view} onChange={setView} />
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
              onPeriodChange={setPeriod}
              totals={totals}
              balance={summary.data?.balance}
              deltaPercent={deltaPercent}
              loading={summary.isLoading || summary.restaurantLoading}
              refreshing={summary.isFetching && !summary.isLoading}
            />
          )}
          {summary.data ? <EarningsTrend summary={summary.data} period={period} /> : null}
          {totals ? (
            <EarningsBreakdown
              totals={totals}
              commissionPercent={summary.data?.commissionPercent}
              onOpenPassbook={() => setView('passbook')}
            />
          ) : null}
        </ScrollView>
      ) : (
        <PassbookView
          period={period}
          onPeriodChange={setPeriod}
          totals={totals}
          balance={summary.data?.balance}
          onRefreshSummary={refreshSummary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
});
