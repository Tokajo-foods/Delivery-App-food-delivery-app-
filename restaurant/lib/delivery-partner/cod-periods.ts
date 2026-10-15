import type {
  PartnerDailyEarning,
  PartnerEarningsSummary,
} from '@/lib/delivery-partner/analytics-types';

export type CodPeriodTotal = { amount: number; orders: number };

export type CodPeriods = {
  today: CodPeriodTotal;
  week: CodPeriodTotal;
  month: CodPeriodTotal;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** One daily-range window covering the server's IST today, week and month. */
export function codRangeFor(summary?: PartnerEarningsSummary | null) {
  const keys = [summary?.today.from, summary?.week.from, summary?.month.from, summary?.today.to];
  if (!keys.every((key) => key && DATE_KEY.test(key))) return null;
  const from = [summary!.week.from!, summary!.month.from!].sort()[0]!;
  return { from, to: summary!.today.to! };
}

function sumBetween(points: PartnerDailyEarning[], from?: string, to?: string): CodPeriodTotal {
  let amount = 0;
  let orders = 0;
  for (const point of points) {
    const key = String(point.date).slice(0, 10);
    if (!from || !to || key < from || key > to) continue;
    amount += point.codCollected ?? 0;
    orders += point.codOrders ?? 0;
  }
  return { amount: Math.round(amount * 100) / 100, orders };
}

/** Cash collected from customers per IST period (UPI-settled COD excluded by the server). */
export function codPeriodsFrom(
  points: PartnerDailyEarning[],
  summary: PartnerEarningsSummary
): CodPeriods {
  return {
    today: sumBetween(points, summary.today.from, summary.today.to),
    week: sumBetween(points, summary.week.from, summary.week.to),
    month: sumBetween(points, summary.month.from, summary.month.to),
  };
}
