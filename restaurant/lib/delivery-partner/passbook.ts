import type { WalletTransaction } from '@/lib/delivery-partner/finance-types';

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
  if (key === istDayKey()) return 'Today';
  if (key === istDayKey(Date.now() - DAY_MS)) return 'Yesterday';
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function timeLabel(iso?: string) {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

/** "Today, 7:20 pm" / "12 Oct, 9:05 am" in IST. */
export function passbookWhen(iso?: string) {
  const key = istDayKey(iso ?? '');
  const time = timeLabel(iso);
  if (!key) return time;
  return time ? `${dayLabel(key)}, ${time}` : dayLabel(key);
}

/** Amount the wallet was credited for this trip (net of any fee). */
export function passbookAmount(row: WalletTransaction) {
  return row.netAmount ?? row.amount;
}

export function passbookTripLabel(row: WalletTransaction) {
  return row.tripKind === 'return' ? 'Return (RTO)' : 'Delivery';
}

export function passbookTitle(row: WalletTransaction) {
  return row.orderNumber ? `Order #${row.orderNumber}` : 'Trip';
}
