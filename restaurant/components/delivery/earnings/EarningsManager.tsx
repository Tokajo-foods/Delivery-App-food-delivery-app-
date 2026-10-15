import { FlatList, View } from 'react-native';

import { CodCollectedCard } from '@/components/delivery/earnings/CodCollectedCard';
import { EarningsSummaryCard } from '@/components/delivery/earnings/EarningsSummaryCard';
import { PassbookFooter, PassbookHeader } from '@/components/delivery/earnings/PassbookStates';
import { PassbookRow } from '@/components/delivery/earnings/PassbookRow';
import { earningsStyles as styles } from '@/components/delivery/earnings/earnings-styles';
import { PASSBOOK_DAYS, useEarningsData } from '@/components/delivery/earnings/use-earnings-data';
import { PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { formatFinanceError } from '@/lib/delivery-partner/finance-api';

function errorText(query: { isError: boolean; error: unknown; data?: unknown }, fallback: string) {
  return query.isError && !query.data ? formatFinanceError(query.error, fallback) : null;
}

/** Earnings today/week/month, COD collected, and the paid-trip passbook — all live queries. */
export function PartnerEarningsManager() {
  const { earnings, today, codDaily, codPeriods, codLoading, codPending, passbook, rows, total } =
    useEarningsData();
  const earningsError = errorText(earnings, 'Could not load earnings.');
  const codError = earningsError ? null : errorText(codDaily, 'Could not load COD collected.');

  const loadMore = () => {
    if (passbook.hasNextPage && !passbook.isFetchingNextPage && !passbook.isError) {
      void passbook.fetchNextPage();
    }
  };

  const header = (
    <View style={styles.header}>
      <EarningsSummaryCard
        summary={earnings.data}
        today={today}
        loading={earnings.isLoading && !earnings.data}
        error={earningsError}
        onRetry={() => void earnings.refetch()}
      />
      <CodCollectedCard
        currency={codPending.data?.currency ?? earnings.data?.currency ?? 'INR'}
        periods={codPeriods}
        cashInHand={codPending.data?.cashInHand}
        loading={codLoading}
        error={codError ?? (earningsError || !codPeriods ? 'Could not load COD collected.' : null)}
        onRetry={() => void (codError ? codDaily.refetch() : earnings.refetch())}
      />
      <PassbookHeader days={PASSBOOK_DAYS} total={total} />
    </View>
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.id}
      renderItem={({ item, index }) => <PassbookRow row={item} first={index === 0} />}
      ListHeaderComponent={header}
      ListFooterComponent={
        <PassbookFooter
          loading={passbook.isLoading && !passbook.data}
          error={passbook.isError ? formatFinanceError(passbook.error, 'Could not load the passbook.') : null}
          empty={!rows.length}
          loadingMore={passbook.isFetchingNextPage}
          days={PASSBOOK_DAYS}
          onRetry={() => void (rows.length ? passbook.fetchNextPage() : passbook.refetch())}
        />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      contentContainerStyle={[styles.list, { paddingBottom: PARTNER_BOTTOM_NAV_INSET + 24 }]}
      showsVerticalScrollIndicator={false}
    />
  );
}
