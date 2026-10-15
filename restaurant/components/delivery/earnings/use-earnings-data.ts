import { useState } from 'react';

import type { PassbookRange } from '@/components/delivery/earnings/PassbookPanel';
import type { DailyRange } from '@/components/delivery/earnings/EarningsDailyCard';
import {
  usePartnerDailyEarnings,
  usePartnerEarnings,
  usePartnerIncentives,
} from '@/lib/delivery-partner/analytics-hooks';
import { usePartnerDutySummary } from '@/lib/delivery-partner/availability-hooks';
import { selectPartnerTodayStats } from '@/lib/delivery-partner/today-stats';
import { usePartnerBank } from '@/lib/delivery-partner/bank-hooks';
import {
  useCodPending,
  useCodRemittanceHistory,
  useInstantPayoutEligibility,
  usePartnerPayouts,
  usePartnerWallet,
  usePayoutSchedule,
  useWalletTransactions,
} from '@/lib/delivery-partner/finance-hooks';

export type EarningsTab = 'overview' | 'passbook' | 'cash' | 'payouts';

/** Every query the earnings screen reads; lists only load when their tab is open. */
export function useEarningsData(tab: EarningsTab) {
  const [dailyRange, setDailyRange] = useState<DailyRange>(7);
  const [passbookFilter, setPassbookFilter] = useState('');
  const [passbookRange, setPassbookRange] = useState<PassbookRange>(30);

  const earnings = usePartnerEarnings();
  const dutySummary = usePartnerDutySummary();
  const today = selectPartnerTodayStats(dutySummary.data, earnings.data);
  const daily = usePartnerDailyEarnings(dailyRange);
  const incentives = usePartnerIncentives(tab === 'overview');
  const wallet = usePartnerWallet(true);
  const eligibility = useInstantPayoutEligibility(true);
  const schedule = usePayoutSchedule(true);
  const codPending = useCodPending(true);
  const bank = usePartnerBank(true);
  const remittances = useCodRemittanceHistory(tab === 'cash');
  const payouts = usePartnerPayouts(tab === 'payouts');
  const passbook = useWalletTransactions(passbookFilter || undefined, tab === 'passbook', passbookRange);

  const refetchAll = () =>
    Promise.all([
      earnings.refetch(),
      dutySummary.refetch(),
      daily.refetch(),
      wallet.refetch(),
      eligibility.refetch(),
      schedule.refetch(),
      codPending.refetch(),
      bank.refetch(),
      ...(tab === 'overview' ? [incentives.refetch()] : []),
      ...(tab === 'cash' ? [remittances.refetch()] : []),
      ...(tab === 'payouts' ? [payouts.refetch()] : []),
      ...(tab === 'passbook' ? [passbook.refetch()] : []),
    ]);

  return {
    earnings,
    today,
    daily,
    dailyRange,
    setDailyRange,
    incentives,
    wallet,
    eligibility,
    schedule,
    codPending,
    bank,
    remittances,
    payouts,
    passbook,
    passbookFilter,
    setPassbookFilter,
    passbookRange,
    setPassbookRange,
    refetchAll,
  };
}
