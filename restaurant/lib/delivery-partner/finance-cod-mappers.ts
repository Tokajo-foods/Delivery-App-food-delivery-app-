import type {
  CodLimitStatus,
  CodPending,
  CodRemittance,
  CodUpiQr,
  CodUpiSettlement,
} from '@/lib/delivery-partner/finance-types';
import {
  asRecord,
  pickBool,
  pickNumber,
  pickString,
  unwrap,
} from '@/lib/delivery-partner/finance-mappers';

/** COD DTO mappers — /partners/me/cod/* and per-trip UPI QR. */

export function mapCodPending(raw: unknown): CodPending {
  const record = asRecord(unwrap(raw));
  const today = asRecord(record.today);
  return {
    currency: pickString(record, ['currency']) ?? 'INR',
    cashInHand: pickNumber(record, ['cashInHand']) ?? 0,
    limit: pickNumber(record, ['limit']) ?? 0,
    remainingCapacity: pickNumber(record, ['remainingCapacity']) ?? 0,
    blocked: pickBool(record, ['blocked']) ?? false,
    remitDueToday: pickBool(record, ['remitDueToday']) ?? false,
    remittedLifetime: pickNumber(record, ['remittedLifetime']) ?? 0,
    minRemit: pickNumber(record, ['minRemit']) ?? 1,
    maxRemit: pickNumber(record, ['maxRemit']) ?? 0,
    todayCollected: pickNumber(today, ['collected']),
    todayCount: pickNumber(today, ['count']),
  };
}

export function mapCodLimit(raw: unknown): CodLimitStatus {
  const record = asRecord(unwrap(raw));
  return {
    cashInHand: pickNumber(record, ['cashInHand']) ?? 0,
    limit: pickNumber(record, ['limit']) ?? 0,
    remainingCapacity: pickNumber(record, ['remainingCapacity']) ?? 0,
    usedPercent: pickNumber(record, ['usedPercent']) ?? 0,
    blocked: pickBool(record, ['blocked']) ?? false,
    remitDueToday: pickBool(record, ['remitDueToday']) ?? false,
    blocksNewCodOrders: pickBool(record, ['blocksNewCodOrders']) ?? false,
    code: pickString(record, ['code']),
    message: pickString(record, ['message']),
  };
}

export function mapRemittance(raw: unknown): CodRemittance | null {
  const row = asRecord(unwrap(raw));
  const remittanceId = pickString(row, ['remittanceId', 'id']);
  if (!remittanceId) return null;
  return {
    remittanceId,
    amount: pickNumber(row, ['amount']) ?? 0,
    method: pickString(row, ['method']) ?? 'hub_cash',
    reference: pickString(row, ['reference']),
    note: pickString(row, ['note']),
    status: pickString(row, ['status']) ?? 'recorded',
    cashBefore: pickNumber(row, ['cashBefore']),
    cashAfter: pickNumber(row, ['cashAfter']),
    remittedAt: pickString(row, ['remittedAt', 'createdAt']),
  };
}

export function mapUpiQr(raw: unknown): CodUpiQr {
  const record = asRecord(unwrap(raw));
  return {
    deliveryId: pickString(record, ['deliveryId']) ?? '',
    orderId: pickString(record, ['orderId']),
    amount: pickNumber(record, ['amount']) ?? 0,
    currency: pickString(record, ['currency']) ?? 'INR',
    upiIntent: pickString(record, ['upiIntent']),
    qrImageUrl: pickString(record, ['qrImageUrl']) ?? null,
    qrId: pickString(record, ['qrId']) ?? null,
    expiresAt: pickString(record, ['expiresAt']),
    source: pickString(record, ['source']),
    settledVia: pickString(record, ['settledVia']) ?? null,
  };
}

export function mapUpiSettlement(raw: unknown): CodUpiSettlement {
  const record = asRecord(unwrap(raw));
  return {
    deliveryId: pickString(record, ['deliveryId']) ?? '',
    orderId: pickString(record, ['orderId']),
    amount: pickNumber(record, ['amount']) ?? 0,
    settledVia: pickString(record, ['settledVia']) ?? 'upi',
    cashInHandDelta: pickNumber(record, ['cashInHandDelta']) ?? 0,
    cashInHand: pickNumber(record, ['cashInHand']) ?? 0,
    txnRef: pickString(record, ['txnRef']),
    collectedAt: pickString(record, ['collectedAt']),
  };
}
