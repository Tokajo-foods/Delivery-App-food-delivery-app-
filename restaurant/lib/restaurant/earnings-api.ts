import axios from 'axios';

import { api } from '@/lib/api';
import type {
  EarningsDay,
  EarningsPeriod,
  EarningsPeriodTotals,
  EarningsSummary,
  PassbookEntry,
  PassbookEntryKind,
  PassbookFilter,
  PassbookPage,
} from '@/lib/restaurant/earnings-types';

const RESTAURANT_BASE = '/api/v1/restaurant-service/restaurants';
const PERIODS: EarningsPeriod[] = ['today', 'week', 'month'];
const KINDS: PassbookEntryKind[] = [
  'order',
  'rto_credit',
  'no_rider_credit',
  'payout',
  'adjustment',
];

export type EarningsApiError = Error & { status?: number; code?: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(value: unknown): number | null {
  return value == null ? null : num(value);
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function toEarningsError(error: unknown, fallback: string): EarningsApiError {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(fallback);
  }
  if (!error.response) {
    return new Error('Network request failed. Check your internet connection and try again.');
  }
  const status = error.response.status;
  const data = asRecord(error.response.data);
  const code = typeof data.code === 'string' ? data.code : undefined;
  let message = typeof data.message === 'string' ? data.message : fallback;
  if (status === 401) message = 'Your session expired. Please sign in again.';
  else if (code === 'STAFF_PERMISSION_DENIED') {
    message = 'Your staff role cannot view earnings. Ask the owner to grant “View reports”.';
  } else if (status === 403) message = 'You do not have access to this outlet’s earnings.';
  else if (status === 503 || code === 'PAYMENT_SERVICE_UNAVAILABLE') {
    message = 'Earnings are temporarily unavailable. Try again in a moment.';
  }
  const err = new Error(`${message}${code ? ` (${code})` : ` (${status})`}`) as EarningsApiError;
  err.status = status;
  err.code = code;
  return err;
}

function mapPeriod(raw: unknown, period: EarningsPeriod): EarningsPeriodTotals {
  const r = asRecord(raw);
  return {
    period,
    from: String(r.from ?? ''),
    to: String(r.to ?? ''),
    orders: num(r.orders),
    deliveredOrders: num(r.deliveredOrders),
    returnedOrders: num(r.returnedOrders),
    noRiderOrders: num(r.noRiderOrders),
    grossSales: num(r.grossSales),
    commission: num(r.commission),
    commissionPercent: r.commissionPercent == null ? undefined : num(r.commissionPercent),
    orderEarnings: num(r.orderEarnings),
    returnedEarnings: num(r.returnedEarnings),
    noRiderEarnings: num(r.noRiderEarnings),
    adjustments: num(r.adjustments),
    adjustmentCount: num(r.adjustmentCount),
    netEarnings: num(r.netEarnings),
    payouts: num(r.payouts),
    payoutCount: num(r.payoutCount),
  };
}

function mapEntry(raw: Record<string, unknown>): PassbookEntry | null {
  const id = String(raw.id ?? '').trim();
  if (!id) return null;
  const kind = KINDS.includes(raw.kind as PassbookEntryKind)
    ? (raw.kind as PassbookEntryKind)
    : 'order';
  return {
    id,
    kind,
    orderId: strOrNull(raw.orderId),
    orderNumber: strOrNull(raw.orderNumber),
    payoutId: strOrNull(raw.payoutId),
    grossAmount: numOrNull(raw.grossAmount),
    commissionAmount: numOrNull(raw.commissionAmount),
    commissionRate: numOrNull(raw.commissionRate),
    amount: num(raw.amount),
    balanceAfter: num(raw.balanceAfter),
    description: String(raw.description ?? ''),
    createdAt: strOrNull(raw.createdAt),
  };
}

export const restaurantEarningsApi = {
  getSummary: async (restaurantId: string): Promise<EarningsSummary> => {
    try {
      const res = await api.get(`${RESTAURANT_BASE}/${restaurantId}/earnings/summary`);
      const data = asRecord(asRecord(res.data).data);
      const periods = asRecord(data.periods);
      const daily = Array.isArray(data.daily) ? data.daily : [];
      return {
        restaurantId: String(data.restaurantId ?? restaurantId),
        generatedAt: String(data.generatedAt ?? new Date().toISOString()),
        balance: num(data.balance),
        commissionPercent: num(data.commissionPercent),
        periods: Object.fromEntries(
          PERIODS.map((p) => [p, mapPeriod(periods[p], p)])
        ) as Record<EarningsPeriod, EarningsPeriodTotals>,
        daily: daily.map((row): EarningsDay => {
          const r = asRecord(row);
          return { date: String(r.date ?? ''), orders: num(r.orders), netEarnings: num(r.netEarnings) };
        }),
      };
    } catch (error) {
      throw toEarningsError(error, 'Failed to load earnings');
    }
  },

  listPassbook: async (
    restaurantId: string,
    params: { period: EarningsPeriod; filter: PassbookFilter; page: number; limit?: number }
  ): Promise<PassbookPage> => {
    try {
      const res = await api.get(`${RESTAURANT_BASE}/${restaurantId}/earnings/passbook`, {
        params: {
          period: params.period,
          page: params.page,
          limit: params.limit ?? 20,
          type: params.filter === 'all' ? undefined : params.filter,
        },
      });
      const body = asRecord(res.data);
      const meta = asRecord(body.meta);
      const rows = Array.isArray(body.data) ? body.data : [];
      const page = num(meta.page) || params.page;
      const totalPages = Math.max(1, num(meta.totalPages));
      return {
        items: rows.map((row) => mapEntry(asRecord(row))).filter(Boolean) as PassbookEntry[],
        total: num(meta.total),
        page,
        totalPages,
        hasNext: typeof meta.hasNext === 'boolean' ? meta.hasNext : page < totalPages,
      };
    } catch (error) {
      throw toEarningsError(error, 'Failed to load passbook');
    }
  },
};
