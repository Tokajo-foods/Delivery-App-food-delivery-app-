import { useMemo } from 'react';

import { usePartnerEarnings } from '@/lib/delivery-partner/analytics-hooks';
import { usePartnerDutySummary } from '@/lib/delivery-partner/availability-hooks';
import { codPeriodsFrom } from '@/lib/delivery-partner/cod-periods';
import { useCodPending, useWalletTransactions } from '@/lib/delivery-partner/finance-hooks';
import { selectPartnerTodayStats } from '@/lib/delivery-partner/today-stats';

export const PASSBOOK_DAYS = 90;

/** Live queries behind the earnings screen; socket events invalidate analytics + finance keys. */
export function useEarningsData() {
  const earnings = usePartnerEarnings();
  const dutySummary = usePartnerDutySummary();
  const today = selectPartnerTodayStats(dutySummary.data, earnings.data);
  const codPending = useCodPending(true);
  const passbook = useWalletTransactions('delivery_credit', true, PASSBOOK_DAYS);

  const codPeriods = useMemo(() => codPeriodsFrom(earnings.data), [earnings.data]);
  const codLoading = earnings.isLoading && !earnings.data;

  const rows = useMemo(
    () => passbook.data?.pages.flatMap((page) => page.items) ?? [],
    [passbook.data]
  );

  return {
    earnings,
    today,
    codPeriods,
    codLoading,
    codPending,
    passbook,
    rows,
    total: passbook.data?.pages[0]?.total ?? 0,
  };
}
