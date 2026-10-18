import type { EarningsPeriod, EarningsSummary, PassbookEntry } from '@/lib/restaurant/earnings-types';

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PERIOD_LABELS: Record<EarningsPeriod, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
};

/** IST wall clock as a Date whose UTC fields hold the IST values. */
function istWall(iso: string | Date): Date | null {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + IST_OFFSET_MS);
}

export function istDateKey(iso: string | Date): string {
  return istWall(iso)?.toISOString().slice(0, 10) ?? '';
}

export function formatIstTime(iso: string | null): string {
  const w = iso ? istWall(iso) : null;
  if (!w) return '—';
  const h = w.getUTCHours();
  const m = String(w.getUTCMinutes()).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

function shortDate(w: Date, withWeekday = false): string {
  const base = `${w.getUTCDate()} ${MONTHS[w.getUTCMonth()]}`;
  return withWeekday ? `${WEEKDAYS[w.getUTCDay()]}, ${base}` : base;
}

/** "Today", "Yesterday", or "Mon, 12 Oct" for passbook day headers. */
export function dayHeaderLabel(dateKey: string, now = new Date()): string {
  const today = istDateKey(now);
  const yesterday = istDateKey(new Date(now.getTime() - 86_400_000));
  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';
  const w = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(w.getTime())) return dateKey;
  return shortDate(w, true);
}

export function periodRangeLabel(period: EarningsPeriod, fromIso: string): string {
  const w = fromIso ? istWall(fromIso) : null;
  if (!w) return 'IST';
  if (period === 'today') return `${shortDate(w, true)} · IST`;
  return `${shortDate(w)} – today · IST`;
}

export function dayBarLabel(dateKey: string, period: EarningsPeriod): string {
  const w = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(w.getTime())) return '';
  return period === 'month' ? String(w.getUTCDate()) : WEEKDAYS[w.getUTCDay()].slice(0, 1);
}

export const DELTA_LABELS: Record<EarningsPeriod, string> = {
  today: 'vs yesterday',
  week: 'vs last week',
  month: 'vs last month',
};

function shiftDay(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * % change of net earnings against the same number of days just before the period.
 * Null when the daily series does not reach back far enough or the prior window is ₹0.
 */
export function periodDeltaPercent(summary: EarningsSummary, period: EarningsPeriod): number | null {
  const from = istDateKey(summary.periods[period].from);
  const today = istDateKey(new Date());
  if (!from || !summary.daily.length) return null;
  const length = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
  const prevStart = shiftDay(from, -length);
  const prevEnd = shiftDay(from, -1);
  const earliest = summary.daily.reduce((min, d) => (d.date < min ? d.date : min), summary.daily[0].date);
  if (earliest > prevStart) return null;

  let current = 0;
  let previous = 0;
  for (const d of summary.daily) {
    if (d.date >= from && d.date <= today) current += d.netEarnings;
    else if (d.date >= prevStart && d.date <= prevEnd) previous += d.netEarnings;
  }
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function entryTitle(entry: PassbookEntry): string {
  const ref = entry.orderNumber
    ? `#${entry.orderNumber}`
    : entry.orderId
      ? `#${entry.orderId.slice(-6).toUpperCase()}`
      : '';
  if (entry.kind === 'order') return `Order ${ref}`.trim();
  if (entry.kind === 'rto_credit') return `Returned order ${ref}`.trim();
  if (entry.kind === 'no_rider_credit') return `Cancelled order ${ref}`.trim();
  if (entry.kind === 'payout') {
    return entry.payoutId ? `Bank payout · ${entry.payoutId.slice(-6).toUpperCase()}` : 'Bank payout';
  }
  return entry.description || 'Wallet adjustment';
}

export const KIND_LABELS: Record<PassbookEntry['kind'], string> = {
  order: 'Delivered',
  rto_credit: 'RTO food credit',
  no_rider_credit: 'No rider · food paid',
  payout: 'Paid to bank',
  adjustment: 'Adjustment',
};
