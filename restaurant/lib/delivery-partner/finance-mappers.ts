import type {
  InstantEligibility,
  PartnerPayout,
  PartnerWallet,
  PayoutSchedule,
  TripEarnings,
  TripEarningsBreakdown,
  WalletCodSnapshot,
  WalletTransaction,
} from '@/lib/delivery-partner/finance-types';

/** DTO mappers for /partners/me/{wallet,payouts,cod,earnings/:id}. Tolerant of legacy field names. */

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function unwrap(payload: unknown): unknown {
  const record = asRecord(payload);
  if ('data' in record) return record.data;
  return payload;
}

export function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

export function pickNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

export function pickBool(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true') return true;
    if (value === 0 || value === '0' || value === 'false') return false;
  }
  return undefined;
}

export function pickStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}


function extractRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const record = asRecord(data);
  const nested =
    record.items ??
    record.transactions ??
    record.payouts ??
    record.remittances ??
    record.rows ??
    record.results;
  return Array.isArray(nested) ? (nested as Record<string, unknown>[]) : [];
}

export function mapPaged<T>(
  payload: unknown,
  mapItem: (row: Record<string, unknown>) => T | null
): {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
} {
  const record = asRecord(payload);
  const data = unwrap(payload);
  const rows = extractRows(data).length ? extractRows(data) : extractRows(payload);
  const meta = asRecord(data);
  const page = pickNumber(record, ['page']) ?? pickNumber(meta, ['page']) ?? 1;
  const limit =
    pickNumber(record, ['limit']) ?? pickNumber(meta, ['limit']) ?? rows.length;
  const total =
    pickNumber(record, ['total']) ??
    pickNumber(meta, ['total']) ??
    pickNumber(record, ['count']) ??
    rows.length;
  const totalPages =
    pickNumber(record, ['totalPages']) ??
    pickNumber(meta, ['totalPages']) ??
    (limit > 0 ? Math.ceil(total / limit) : 1);
  return {
    items: rows.map(mapItem).filter((row): row is T => row != null),
    page,
    limit,
    total,
    hasNext: page < totalPages || (limit > 0 && page * limit < total),
  };
}

export function mapCodSnapshot(raw: unknown): WalletCodSnapshot | undefined {
  const record = asRecord(raw);
  if (!Object.keys(record).length) return undefined;
  return {
    cashInHand: pickNumber(record, ['cashInHand']) ?? 0,
    limit: pickNumber(record, ['limit']) ?? 0,
    remainingCapacity: pickNumber(record, ['remainingCapacity']) ?? 0,
    blocked: pickBool(record, ['blocked']) ?? false,
    remitDueToday: pickBool(record, ['remitDueToday']) ?? false,
  };
}

export function mapWallet(raw: unknown): PartnerWallet {
  const record = asRecord(unwrap(raw));
  return {
    currency: pickString(record, ['currency']) ?? 'INR',
    earningsBalance: pickNumber(record, ['earningsBalance', 'balance']) ?? 0,
    pendingPayouts: pickNumber(record, ['pendingPayouts']) ?? 0,
    lifetimeEarnings: pickNumber(record, ['lifetimeEarnings']) ?? 0,
    cashInHand: pickNumber(record, ['cashInHand']) ?? 0,
    nextWeeklyPayoutAt: pickString(record, ['nextWeeklyPayoutAt']),
    instantEligible: pickBool(record, ['instantEligible']) ?? false,
    cod: mapCodSnapshot(record.cod),
  };
}

export function mapTxn(row: Record<string, unknown>): WalletTransaction | null {
  const id =
    pickString(row, ['txnId', 'id', 'transactionId']) ??
    pickString(row, ['deliveryId', 'payoutId', 'remittanceId']);
  if (!id) return null;
  const direction = pickString(row, ['direction']);
  const breakdown = asRecord(row.breakdown);
  return {
    tripKind: pickString(row, ['tripKind']),
    breakdown: Object.keys(breakdown).length
      ? {
          base: pickNumber(breakdown, ['base']) ?? 0,
          incentive: pickNumber(breakdown, ['incentive']) ?? 0,
          tip: pickNumber(breakdown, ['tip']) ?? 0,
        }
      : undefined,
    distanceKm: row.distanceKm == null ? undefined : pickNumber(row, ['distanceKm']),
    paymentMethod: pickString(row, ['paymentMethod']),
    orderNumber: pickString(row, ['orderNumber']),
    restaurantName: pickString(row, ['restaurantName']),
    id,
    type: pickString(row, ['type']) ?? 'ledger',
    direction,
    amount: pickNumber(row, ['amount']) ?? 0,
    feeAmount: pickNumber(row, ['feeAmount']),
    netAmount: pickNumber(row, ['netAmount']),
    currency: pickString(row, ['currency']) ?? 'INR',
    status: pickString(row, ['status']),
    deliveryId: pickString(row, ['deliveryId']),
    orderId: pickString(row, ['orderId']),
    payoutId: pickString(row, ['payoutId']),
    remittanceId: pickString(row, ['remittanceId']),
    note: pickString(row, ['note', 'description']),
    createdAt: pickString(row, ['occurredAt', 'createdAt', 'at']),
  };
}

export function mapPayout(raw: unknown): PartnerPayout | null {
  const row = asRecord(unwrap(raw));
  const payoutId = pickString(row, ['payoutId', 'id']);
  if (!payoutId) return null;
  return {
    payoutId,
    kind: pickString(row, ['kind', 'type']) ?? 'weekly',
    status: pickString(row, ['status']) ?? 'pending',
    period: pickString(row, ['period']),
    grossAmount: pickNumber(row, ['grossAmount', 'amount']) ?? 0,
    feeAmount: pickNumber(row, ['feeAmount']) ?? 0,
    tdsAmount: pickNumber(row, ['tdsAmount']) ?? 0,
    netAmount: pickNumber(row, ['netAmount']) ?? 0,
    bankAccountMasked: pickString(row, ['bankAccountMasked', 'accountMasked']),
    ifscCode: pickString(row, ['ifscCode', 'ifsc']),
    gatewayPayoutId: pickString(row, ['gatewayPayoutId']) ?? null,
    failureReason: pickString(row, ['failureReason']) ?? null,
    gatewayAvailable: pickBool(row, ['gatewayAvailable']),
    requestedAt: pickString(row, ['requestedAt', 'createdAt']),
    paidAt: pickString(row, ['paidAt']) ?? null,
  };
}

export function mapEligibility(raw: unknown): InstantEligibility {
  const record = asRecord(unwrap(raw));
  return {
    eligible: pickBool(record, ['eligible']) ?? false,
    reasons: pickStringList(record.reasons),
    availableBalance: pickNumber(record, ['availableBalance']) ?? 0,
    minAmount: pickNumber(record, ['minAmount']) ?? 200,
    maxAmount: pickNumber(record, ['maxAmount']) ?? 0,
    feePercent: pickNumber(record, ['feePercent']) ?? 0,
    feeMin: pickNumber(record, ['feeMin']) ?? 0,
    estimatedFee: pickNumber(record, ['estimatedFee']) ?? 0,
    estimatedNet: pickNumber(record, ['estimatedNet']) ?? 0,
    dailyRemainingAmount: pickNumber(record, ['dailyRemainingAmount']),
    dailyRemainingCount: pickNumber(record, ['dailyRemainingCount']),
    bankOnFile: pickBool(record, ['bankOnFile']) ?? false,
    bankVerified: pickBool(record, ['bankVerified']) ?? false,
    kycActive: pickBool(record, ['kycActive']) ?? false,
    nextWeeklyPayoutAt: pickString(record, ['nextWeeklyPayoutAt']),
  };
}

export function mapSchedule(raw: unknown): PayoutSchedule {
  const record = asRecord(unwrap(raw));
  const instant = asRecord(record.instant);
  const period = asRecord(record.currentPeriod);
  return {
    cycle: pickString(record, ['cycle']) ?? 'weekly',
    weekday: pickString(record, ['weekday']),
    timezone: pickString(record, ['timezone']),
    nextPayoutDate: pickString(record, ['nextPayoutDate']),
    nextPayoutAt: pickString(record, ['nextPayoutAt']),
    cutoff: pickString(record, ['cutoff']),
    currentPeriodLabel: pickString(period, ['label']),
    instantMin: pickNumber(instant, ['minAmount']),
    instantFeePercent: pickNumber(instant, ['feePercent']),
    instantFeeMin: pickNumber(instant, ['feeMin']),
    instantDailyCap: pickNumber(instant, ['dailyCapAmount']),
    instantDailyCount: pickNumber(instant, ['dailyCapCount']),
  };
}

export function mapBreakdown(raw: unknown): TripEarningsBreakdown {
  const record = asRecord(raw);
  return {
    baseFare: pickNumber(record, ['baseFare']),
    distanceFare: pickNumber(record, ['distanceFare']),
    surge: pickNumber(record, ['surge']),
    waitTime: pickNumber(record, ['waitTime']),
    tip: pickNumber(record, ['tip']),
    incentive: pickNumber(record, ['incentive']),
    platformFee: pickNumber(record, ['platformFee']),
    tds: pickNumber(record, ['tds']),
  };
}

export function mapTripEarnings(raw: unknown): TripEarnings {
  const record = asRecord(unwrap(raw));
  return {
    deliveryId: pickString(record, ['deliveryId', 'id']) ?? '',
    orderId: pickString(record, ['orderId']),
    status: pickString(record, ['status']),
    deliveredAt: pickString(record, ['deliveredAt']),
    actualDistanceKm: pickNumber(record, ['actualDistanceKm']),
    waitMinutes: pickNumber(record, ['waitMinutes']),
    currency: pickString(record, ['currency']) ?? 'INR',
    breakdown: mapBreakdown(record.breakdown),
    gross: pickNumber(record, ['gross']) ?? 0,
    net: pickNumber(record, ['net']) ?? 0,
  };
}
