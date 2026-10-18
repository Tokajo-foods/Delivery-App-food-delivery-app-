import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import { useEarningsPassbook } from '@/lib/restaurant/earnings-hooks';
import type {
  EarningsPeriod,
  EarningsPeriodTotals,
  PassbookEntry,
  PassbookFilter,
} from '@/lib/restaurant/earnings-types';

import { dayHeaderLabel, istDateKey, PERIOD_LABELS } from './earnings-format';
import { PassbookFilterChips, PeriodTabs } from './EarningsControls';
import { EarningsError, PassbookDayHeader, PassbookEmpty, PassbookFooter } from './EarningsStates';
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

function Flow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.flow}>
      <Text style={styles.flowLabel}>{label}</Text>
      <Text style={[styles.flowValue, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export function PassbookView({
  period,
  onPeriodChange,
  totals,
  balance,
  onRefreshSummary,
}: {
  period: EarningsPeriod;
  onPeriodChange: (next: EarningsPeriod) => void;
  totals?: EarningsPeriodTotals;
  balance?: number;
  onRefreshSummary: () => void;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<PassbookFilter>('all');
  const passbook = useEarningsPassbook(period, filter);
  const items = useMemo(() => withDayHeaders(passbook.entries), [passbook.entries]);

  const openOrder = useCallback(
    (orderId: string) => router.push({ pathname: '/order/[orderId]', params: { orderId } }),
    [router]
  );

  const refreshing = passbook.isRefetching && !passbook.isFetchingNextPage && !passbook.isLoading;
  const credited = (totals?.orderEarnings ?? 0) + (totals?.returnedEarnings ?? 0);

  const header = (
    <View style={styles.header}>
      <PeriodTabs value={period} onChange={onPeriodChange} />
      <View style={styles.flows}>
        <Flow label="Credited" value={`+${formatCurrency(credited)}`} color="#15803D" />
        <View style={styles.flowDivider} />
        <Flow label="Paid to bank" value={`−${formatCurrency(totals?.payouts ?? 0)}`} color="#1D4ED8" />
        <View style={styles.flowDivider} />
        <Flow label="Balance" value={formatCurrency(balance ?? 0)} color={authTheme.text} />
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Transactions</Text>
        {passbook.total > 0 ? <Text style={styles.count}>{passbook.total} entries</Text> : null}
      </View>
      <PassbookFilterChips value={filter} onChange={setFilter} />
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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            onRefreshSummary();
            void passbook.refetch();
          }}
          tintColor={authTheme.brand}
        />
      }
      contentContainerStyle={{ paddingBottom: PARTNER_BOTTOM_NAV_INSET }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, gap: 14 },
  pad: { paddingHorizontal: 16 },
  flows: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    paddingVertical: 14,
  },
  flow: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  flowLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: authTheme.textMuted },
  flowValue: { fontFamily: fonts.extraBold, fontSize: 15, letterSpacing: -0.2 },
  flowDivider: { width: 1, height: 28, backgroundColor: authTheme.cardBorder },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontFamily: fonts.extraBold, fontSize: 17, color: authTheme.text, letterSpacing: -0.3 },
  count: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: authTheme.cardBorder, marginLeft: 62 },
});
