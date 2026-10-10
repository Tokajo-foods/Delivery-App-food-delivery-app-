import type {
  EarningsPeriod,
  PartnerDailyEarning,
} from '@/lib/delivery-partner/analytics-types';

export type AnalyticsMode = 'day' | 'week' | 'month' | 'range';

export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function keyToDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function addDays(key: string, days: number): string {
  const date = keyToDate(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function prettyDate(key: string): string {
  return keyToDate(key).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function daySpan(from: string, to: string): number {
  const ms = keyToDate(to).getTime() - keyToDate(from).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function sumDaily(points: PartnerDailyEarning[]): EarningsPeriod {
  return points.reduce<EarningsPeriod>(
    (acc, point) => ({
      totalEarnings: acc.totalEarnings + point.earnings,
      baseEarnings: acc.baseEarnings + (point.baseEarnings ?? 0),
      incentives: acc.incentives + (point.incentives ?? 0),
      tips: acc.tips + (point.tips ?? 0),
      deductions: acc.deductions,
      totalDeliveries: acc.totalDeliveries + point.orders,
      onlineHours: acc.onlineHours + (point.onlineHours ?? 0),
    }),
    {
      totalEarnings: 0,
      baseEarnings: 0,
      incentives: 0,
      tips: 0,
      deductions: 0,
      totalDeliveries: 0,
      onlineHours: 0,
    }
  );
}

export function fillDaily(
  from: string,
  to: string,
  points: PartnerDailyEarning[]
): PartnerDailyEarning[] {
  const byDate = new Map(points.map((point) => [point.date.slice(0, 10), point]));
  const span = Math.min(daySpan(from, to), 366);
  const rows: PartnerDailyEarning[] = [];
  let cursor = from;
  for (let index = 0; index < span; index += 1) {
    const found = byDate.get(cursor);
    const date = keyToDate(cursor);
    const label =
      span > 14
        ? String(date.getDate())
        : date.toLocaleDateString('en-IN', { weekday: 'short' });
    rows.push(
      found
        ? { ...found, label }
        : { date: cursor, label, orders: 0, earnings: 0 }
    );
    cursor = addDays(cursor, 1);
  }
  return rows;
}
