import { useMemo } from 'react';

import {
  usePartnerEarnings,
  usePartnerEarningsRange,
} from '@/lib/delivery-partner/analytics-hooks';
import { usePartnerDutySummary } from '@/lib/delivery-partner/availability-hooks';
import { codPeriodsFrom, codRangeFor } from '@/lib/delivery-partner/cod-periods';
import { useCodPending, useWalletTransactions } from '@/lib/delivery-partner/finance-hooks';
import { selectPartnerTodayStats } from '@/lib/delivery-partner/today-stats';

export const PASSBOOK_DAYS = 90;

/** Live queries behind the earnings screen; socket events invalidate analytics + finance keys. */
export function useEarningsData() {
  const earnings = usePartnerEarnings();
  const dutySummary = usePartnerDutySummary();
  const today = selectPartnerTodayStats(dutySummary.data, earnings.data);
  const range = codRangeFor(earnings.data);
  const codDaily = usePartnerEarningsRange(range?.from, range?.to, Boolean(range));
  const codPending = useCodPending(true);
  const passbook = useWalletTransactions('delivery_credit', true, PASSBOOK_DAYS);

  const codPeriods = useMemo(
    () =>
      earnings.data && codDaily.data
        ? codPeriodsFrom(codDaily.data.points, earnings.data)
        : null,
    [earnings.data, codDaily.data]
  );

  const codLoading =
    (earnings.isLoading && !earnings.data) ||
    (Boolean(range) && codDaily.isLoading && !codDaily.data);

  const rows = useMemo(
    () => passbook.data?.pages.flatMap((page) => page.items) ?? [],
    [passbook.data]
  );

  return {
    earnings,
    today,
    codDaily,
    codPeriods,
    codLoading,
    codPending,
    passbook,
    rows,
    total: passbook.data?.pages[0]?.total ?? 0,
  };
}
