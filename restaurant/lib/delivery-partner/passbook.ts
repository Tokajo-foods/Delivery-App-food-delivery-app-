import type { PartnerDailyEarning } from '@/lib/delivery-partner/analytics-types';
import type { WalletTransaction } from '@/lib/delivery-partner/finance-types';
import { walletTxnLabel } from '@/lib/delivery-partner/finance-types';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** IST calendar day `YYYY-MM-DD` (matches the server's daily earnings keys). */
export function istDayKey(input: string | number | Date = Date.now()) {
  const ms = typeof input === 'number' ? input : new Date(input).getTime();
  if (!Number.isFinite(ms)) return '';
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function dayLabel(key: string) {
  if (!key) return '—';
  const today = istDayKey();
  if (key === today) return 'Today';
  if (key === istDayKey(Date.now() - DAY_MS)) return 'Yesterday';
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function shortDayLabel(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  return date.toLocaleDateString('en-IN', { weekday: 'narrow', timeZone: 'UTC' });
}

export function timeLabel(iso?: string) {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/** Last `n` IST days oldest → newest, zero-filled where the API has no row. */
export function fillDays(points: PartnerDailyEarning[], n: number): PartnerDailyEarning[] {
  const byKey = new Map(points.map((p) => [String(p.date).slice(0, 10), p]));
  const out: PartnerDailyEarning[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const key = istDayKey(Date.now() - i * DAY_MS);
    out.push(
      byKey.get(key) ?? { date: key, label: dayLabel(key), orders: 0, earnings: 0, codCollected: 0, codOrders: 0 }
    );
  }
  return out;
}

export type PassbookKind = 'earning' | 'debit' | 'cash_in' | 'cash_out';

/** Earnings rows change the wallet; COD rows are cash the rider holds for the platform. */
export function passbookKind(row: WalletTransaction): PassbookKind {
  const type = row.type.toLowerCase();
  if (type === 'cod_collect') return 'cash_in';
  if (type === 'cod_remit') return 'cash_out';
  if (type === 'cod_adjust') return row.direction === 'debit' ? 'cash_out' : 'cash_in';
  return (row.direction ?? '').toLowerCase() === 'debit' ? 'debit' : 'earning';
}

/** Payouts leave the wallet at gross (fee is taken from it); everything else at net. */
export function passbookAmount(row: WalletTransaction) {
  if (row.type === 'payout_debit') return row.amount;
  return row.netAmount ?? row.amount;
}

export function passbookTitle(row: WalletTransaction) {
  const order = row.orderNumber ? `Order #${row.orderNumber}` : null;
  switch (row.type.toLowerCase()) {
    case 'delivery_credit':
      if (row.tripKind === 'return') return order ? `Return trip · ${order}` : 'Return trip paid';
      return order ? `Trip · ${order}` : 'Trip earning';
    case 'cod_collect':
      return order ? `Cash collected · ${order}` : 'Cash collected';
    case 'cod_remit':
      return 'Cash deposited';
    case 'payout_debit':
      return row.note ?? 'Payout to bank';
    case 'incentive_credit':
      return 'Incentive bonus';
    default:
      return walletTxnLabel(row.type);
  }
}

export function passbookSubtitle(row: WalletTransaction, money: (n: number) => string) {
  const parts: string[] = [];
  if (row.restaurantName) parts.push(row.restaurantName);
  const b = row.breakdown;
  if (b && row.type === 'delivery_credit') {
    const pieces = [`Pay ${money(b.base)}`];
    if (b.incentive > 0) pieces.push(`Bonus ${money(b.incentive)}`);
    if (b.tip > 0) pieces.push(`Tip ${money(b.tip)}`);
    parts.push(pieces.join(' + '));
  } else if (row.type !== 'delivery_credit' && row.note && row.type !== 'payout_debit') {
    parts.push(row.note);
  }
  if (row.type === 'payout_debit' && row.status) parts.push(row.status.replace(/_/g, ' '));
  if (row.distanceKm != null && row.distanceKm > 0) parts.push(`${row.distanceKm.toFixed(1)} km`);
  return parts.join(' · ');
}

export type PassbookDay = {
  key: string;
  label: string;
  earned: number;
  paidOut: number;
  cashIn: number;
  rows: WalletTransaction[];
};

/** Rows are newest first from the API; groups keep that order. */
export function groupPassbook(rows: WalletTransaction[]): PassbookDay[] {
  const days: PassbookDay[] = [];
  const byKey = new Map<string, PassbookDay>();
  for (const row of rows) {
    const key = istDayKey(row.createdAt ?? '') || 'unknown';
    let day = byKey.get(key);
    if (!day) {
      day = { key, label: dayLabel(key), earned: 0, paidOut: 0, cashIn: 0, rows: [] };
      byKey.set(key, day);
      days.push(day);
    }
    const amount = passbookAmount(row);
    const kind = passbookKind(row);
    if (kind === 'earning') day.earned += amount;
    else if (kind === 'debit') day.paidOut += amount;
    else if (kind === 'cash_in') day.cashIn += amount;
    day.rows.push(row);
  }
  return days;
}
