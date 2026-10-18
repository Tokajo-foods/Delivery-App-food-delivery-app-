import type {
  EarningsPeriod,
  PartnerEarningsSummary,
} from '@/lib/delivery-partner/analytics-types';

export type CodPeriodTotal = { amount: number; orders: number };

export type CodPeriods = {
  today: CodPeriodTotal;
  week: CodPeriodTotal;
  month: CodPeriodTotal;
};

function periodTotal(period: EarningsPeriod): CodPeriodTotal | null {
  if (period.codCollected == null) return null;
  return { amount: period.codCollected, orders: period.codOrders ?? 0 };
}

/** Cash collected per IST period, as totalled by the server on GET /partners/me/earnings. */
export function codPeriodsFrom(summary?: PartnerEarningsSummary | null): CodPeriods | null {
  if (!summary) return null;
  const today = periodTotal(summary.today);
  const week = periodTotal(summary.week);
  const month = periodTotal(summary.month);
  return today && week && month ? { today, week, month } : null;
}
