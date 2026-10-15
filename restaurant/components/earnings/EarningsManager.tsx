import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useEarningsPassbook, useEarningsSummary } from '@/lib/restaurant/earnings-hooks';
import type { EarningsPeriod, PassbookEntry, PassbookFilter } from '@/lib/restaurant/earnings-types';

import { dayHeaderLabel, istDateKey, PERIOD_LABELS } from './earnings-format';
import { PassbookFilterChips, PeriodTabs } from './EarningsControls';
import { EarningsHero } from './EarningsHero';
import { EarningsError, PassbookDayHeader, PassbookEmpty, PassbookFooter } from './EarningsStates';
import { EarningsTrend } from './EarningsTrend';
import { PassbookRow } from './PassbookRow';

type ListItem =
  | { type: 'day'; key: string; label: string }
  | { type: 'entry'; key: string; entry: PassbookEntry };

function withDayHeaders(entries: PassbookEntry[]): ListItem[] {
  const out: ListItem[] = [];
  let lastDay = '';
  for (const entry of entries) {
    const day = entry.createdAt ? istDateKey(entry.createdAt) : '';
    if (day !== lastDay) {
      out.push({ type: 'day', key: `day-${day}`, label: day ? dayHeaderLabel(day) : 'Undated' });
      lastDay = day;
    }
    out.push({ type: 'entry', key: entry.id, entry });
  }
  return out;
}

export function EarningsManager() {
  const router = useRouter();
  const [period, setPeriod] = useState<EarningsPeriod>('today');
  const [filter, setFilter] = useState<PassbookFilter>('all');
  const summary = useEarningsSummary();
  const passbook = useEarningsPassbook(period, filter);

  const items = useMemo(() => withDayHeaders(passbook.entries), [passbook.entries]);
  const totals = summary.data?.periods[period];

  const openOrder = useCallback(
    (orderId: string) => router.push({ pathname: '/order/[orderId]', params: { orderId } }),
    [router]
  );

  const refreshing =
    (summary.isRefetching && !summary.isLoading) ||
    (passbook.isRefetching && !passbook.isFetchingNextPage && !passbook.isLoading);

  const onRefresh = () => {
    void summary.refetch();
    void passbook.refetch();
  };

  const header = (
    <View style={styles.headerContent}>
      <PeriodTabs value={period} onChange={setPeriod} />
      {summary.error && !summary.data ? (
        <EarningsError message={summary.error.message} onRetry={() => void summary.refetch()} />
      ) : (
        <EarningsHero
          totals={totals}
          balance={summary.data?.balance}
          commissionPercent={summary.data?.commissionPercent}
          loading={summary.isLoading || summary.restaurantLoading}
          refreshing={summary.isFetching && !summary.isLoading}
        />
      )}
      {summary.data ? <EarningsTrend summary={summary.data} period={period} /> : null}
      <View style={styles.passbookHead}>
        <View style={styles.passbookTitleRow}>
          <Text style={styles.passbookTitle}>Passbook</Text>
          {passbook.total > 0 ? (
            <Text style={styles.passbookCount}>{passbook.total} entries</Text>
          ) : null}
        </View>
        <PassbookFilterChips value={filter} onChange={setFilter} />
      </View>
    </View>
  );

  const empty = passbook.isLoading ? (
    <PassbookEmpty title="Loading passbook…" hint="Fetching your wallet entries." />
  ) : passbook.error ? (
    <View style={styles.pad}>
      <EarningsError message={passbook.error.message} onRetry={() => void passbook.refetch()} />
    </View>
  ) : (
    <PassbookEmpty
      title={`No entries ${period === 'today' ? 'today' : PERIOD_LABELS[period].toLowerCase()}`}
      hint="Delivered orders credit your net earnings here. Bank payouts and adjustments also show up in this passbook."
    />
  );

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader title="Earnings" subtitle="Net of platform fee · IST" showBack />
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) =>
          item.type === 'day' ? (
            <PassbookDayHeader label={item.label} />
          ) : (
            <PassbookRow entry={item.entry} onOpenOrder={openOrder} />
          )
        }
        ItemSeparatorComponent={({ leadingItem }: { leadingItem?: ListItem }) =>
          leadingItem?.type === 'entry' ? <View style={styles.separator} /> : null
        }
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          <PassbookFooter
            loadingMore={passbook.isFetchingNextPage}
            done={!passbook.hasNextPage}
            count={passbook.entries.length}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (passbook.hasNextPage && !passbook.isFetchingNextPage) void passbook.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={authTheme.brand} />
        }
        contentContainerStyle={{ paddingBottom: PARTNER_BOTTOM_NAV_INSET }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F5' },
  headerContent: { padding: 16, gap: 14 },
  pad: { paddingHorizontal: 16 },
  passbookHead: { gap: 10, marginTop: 6 },
  passbookTitleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  passbookTitle: { fontFamily: fonts.extraBold, fontSize: 17, color: authTheme.text, letterSpacing: -0.3 },
  passbookCount: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: authTheme.cardBorder, marginLeft: 62 },
});
