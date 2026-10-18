import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import { useEarningsPassbook } from '@/lib/restaurant/earnings-hooks';
import type { EarningsPeriod, EarningsPeriodTotals, PassbookEntry, PassbookFilter } from '@/lib/restaurant/earnings-types';

import { dayHeaderLabel, istDateKey, PERIOD_LABELS } from './earnings-format';
import { PassbookFilterChips } from './EarningsControls';
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
      <Text style={[styles.flowValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function PassbookView({
  period,
  totals,
  balance,
  onRefreshSummary,
}: {
  period: EarningsPeriod;
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
      <View style={styles.flows}>
        <Flow label="Credited" value={`+${formatCurrency(credited)}`} color="#15803D" />
        <View style={styles.flowDivider} />
        <Flow label="Paid out" value={`−${formatCurrency(totals?.payouts ?? 0)}`} color="#1D4ED8" />
        <View style={styles.flowDivider} />
        <Flow label="Balance" value={formatCurrency(balance ?? 0)} color={authTheme.text} />
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Transactions</Text>
        {passbook.total > 0 ? <Text style={styles.count}>{passbook.total}</Text> : null}
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

  const last = items.length - 1;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={({ item, index }) => (
        <View
          style={[
            styles.cell,
            index === 0 && styles.cellFirst,
            index === last && styles.cellLast,
          ]}
        >
          {item.type === 'day' ? (
            <PassbookDayHeader label={item.label} />
          ) : (
            <PassbookRow entry={item.entry} onOpenOrder={openOrder} />
          )}
        </View>
      )}
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
  header: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 12, gap: 14 },
  pad: { paddingHorizontal: 16 },
  flows: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    paddingVertical: 14,
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  flow: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  flowLabel: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  flowValue: { fontFamily: fonts.extraBold, fontSize: 15, letterSpacing: -0.3 },
  flowDivider: { width: 1, height: 28, backgroundColor: '#D6D3D1' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontFamily: fonts.semiBold, fontSize: 13, color: '#1C1917' },
  count: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  cell: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F1EAE3',
  },
  cellFirst: { borderTopWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  cellLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
    marginBottom: 4,
  },
});
