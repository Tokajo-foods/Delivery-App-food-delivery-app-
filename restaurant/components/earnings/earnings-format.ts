import type { EarningsPeriod, PassbookEntry } from '@/lib/restaurant/earnings-types';

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

export function entryTitle(entry: PassbookEntry): string {
  const ref = entry.orderNumber
    ? `#${entry.orderNumber}`
    : entry.orderId
      ? `#${entry.orderId.slice(-6).toUpperCase()}`
      : '';
  if (entry.kind === 'order') return `Order ${ref}`.trim();
  if (entry.kind === 'rto_credit') return `Returned order ${ref}`.trim();
  if (entry.kind === 'payout') {
    return entry.payoutId ? `Bank payout · ${entry.payoutId.slice(-6).toUpperCase()}` : 'Bank payout';
  }
  return entry.description || 'Wallet adjustment';
}

export const KIND_LABELS: Record<PassbookEntry['kind'], string> = {
  order: 'Delivered',
  rto_credit: 'RTO food credit',
  payout: 'Paid to bank',
  adjustment: 'Adjustment',
};
