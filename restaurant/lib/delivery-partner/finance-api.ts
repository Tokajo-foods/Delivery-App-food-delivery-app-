import axios from 'axios';

import { API_BASE_URL, api, assertApiBaseUrl } from '@/lib/api';
import { mapPartnerDelivery } from '@/lib/delivery-partner/api';
import {
  mapCodLimit,
  mapCodPending,
  mapRemittance,
  mapUpiQr,
  mapUpiSettlement,
} from '@/lib/delivery-partner/finance-cod-mappers';
import {
  asRecord,
  mapEligibility,
  mapPaged,
  mapPayout,
  mapSchedule,
  mapTripEarnings,
  mapTxn,
  mapWallet,
  pickString,
} from '@/lib/delivery-partner/finance-mappers';
import type {
  CodRemitPayload,
  CodRemittanceHistory,
  PartnerPayoutsResult,
  WalletTransactionsResult,
} from '@/lib/delivery-partner/finance-types';
import { formatTripError } from '@/lib/delivery-partner/rider-ack';
import {
  getApiErrorCode,
  PartnerApiError,
} from '@/lib/errors';

const ME_BASE = '/api/v1/delivery-service/partners/me';

function extractErrorCode(data: unknown): string | undefined {
  const payload = asRecord(data);
  const nested = asRecord(payload.data);
  const errorObj = asRecord(
    typeof payload.error === 'object' ? payload.error : undefined
  );
  const code =
    pickString(nested, ['code']) ??
    pickString(payload, ['code']) ??
    pickString(errorObj, ['code']);
  return code ? code.toUpperCase().replace(/[\s-]+/g, '_') : undefined;
}

export function formatFinanceError(error: unknown, fallback: string): string {
  return formatTripError(error, fallback);
}

function newIdempotencyKey() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
    idempotencyKey?: string;
  } = {}
): Promise<T> {
  const { method = 'GET', body, params, idempotencyKey } = options;
  assertApiBaseUrl();
  try {
    const response = await api.request<T>({
      url: path,
      method,
      params,
      data: method === 'GET' ? undefined : (body ?? {}),
      headers: idempotencyKey
        ? { 'Idempotency-Key': idempotencyKey }
        : undefined,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      throw new PartnerApiError(
        `Cannot reach ${API_BASE_URL}. Check Wi‑Fi and try again.`,
        'NETWORK_ERROR'
      );
    }
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const code =
        extractErrorCode(error.response?.data) ??
        getApiErrorCode(error) ??
        (status === 404 ? 'NOT_FOUND' : undefined);
      throw new PartnerApiError(
        formatFinanceError(error, `Request failed (${status ?? 0})`),
        code
      );
    }
    throw error;
  }
}

export const partnerFinanceApi = {
  getWallet() {
    return request<unknown>(`${ME_BASE}/wallet`).then(mapWallet);
  },

  getWalletTransactions(params: {
    page?: number;
    limit?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<WalletTransactionsResult> {
    return request<unknown>(`${ME_BASE}/wallet/transactions`, {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        type: params.type || undefined,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
    }).then((payload) => mapPaged(payload, mapTxn));
  },

  getTripEarnings(deliveryId: string) {
    return request<unknown>(
      `${ME_BASE}/earnings/${encodeURIComponent(deliveryId)}`
    ).then(mapTripEarnings);
  },

  getPayouts(page = 1, limit = 20): Promise<PartnerPayoutsResult> {
    return request<unknown>(`${ME_BASE}/payouts`, {
      params: { page, limit },
    }).then((payload) => mapPaged(payload, mapPayout));
  },

  getPayout(payoutId: string) {
    return request<unknown>(
      `${ME_BASE}/payouts/${encodeURIComponent(payoutId)}`
    ).then((payload) => {
      const mapped = mapPayout(payload);
      if (!mapped) {
        throw new PartnerApiError('Payout not found.', 'PAYOUT_NOT_FOUND');
      }
      return mapped;
    });
  },

  getInstantEligibility() {
    return request<unknown>(`${ME_BASE}/payouts/instant/eligibility`).then(
      mapEligibility
    );
  },

  getPayoutSchedule() {
    return request<unknown>(`${ME_BASE}/payouts/schedule`).then(mapSchedule);
  },

  requestInstantPayout(amount?: number) {
    const body: { amount?: number; idempotencyKey?: string } = {};
    if (amount != null && Number.isFinite(amount)) body.amount = amount;
    const key = newIdempotencyKey();
    body.idempotencyKey = key;
    return request<unknown>(`${ME_BASE}/payouts/instant`, {
      method: 'POST',
      body,
      idempotencyKey: key,
    }).then((payload) => {
      const mapped = mapPayout(payload);
      if (!mapped) {
        throw new PartnerApiError('Payout was not created.', 'PAYOUT_NOT_FOUND');
      }
      return mapped;
    });
  },

  getCodPending() {
    return request<unknown>(`${ME_BASE}/cod/pending`).then(mapCodPending);
  },

  getCodLimitStatus() {
    return request<unknown>(`${ME_BASE}/cod/limit-status`).then(mapCodLimit);
  },

  remitCod(payload: CodRemitPayload) {
    const key = newIdempotencyKey();
    const body: Record<string, unknown> = {
      method: payload.method,
      idempotencyKey: key,
    };
    if (payload.amount != null && Number.isFinite(payload.amount)) {
      body.amount = payload.amount;
    }
    if (payload.reference?.trim()) body.reference = payload.reference.trim();
    if (payload.note?.trim()) body.note = payload.note.trim();
    return request<unknown>(`${ME_BASE}/cod/remit`, {
      method: 'POST',
      body,
      idempotencyKey: key,
    }).then((raw) => {
      const mapped = mapRemittance(raw);
      if (!mapped) {
        throw new PartnerApiError('Remittance was not recorded.', 'NO_COD_DUE');
      }
      return mapped;
    });
  },

  getCodRemittanceHistory(
    page = 1,
    limit = 20
  ): Promise<CodRemittanceHistory> {
    return request<unknown>(`${ME_BASE}/cod/remittance-history`, {
      params: { page, limit },
    }).then((payload) => mapPaged(payload, mapRemittance));
  },

  createCodUpiQr(deliveryId: string) {
    return request<unknown>(
      `${ME_BASE}/deliveries/${encodeURIComponent(deliveryId)}/cod/upi-qr`,
      { method: 'POST', body: {} }
    ).then(mapUpiQr);
  },

  collectDoorstepCash(deliveryId: string) {
    return request<unknown>(
      `${ME_BASE}/deliveries/${encodeURIComponent(deliveryId)}/cod/collect-cash`,
      { method: 'POST', body: {} }
    ).then(mapPartnerDelivery);
  },

  completeDoorstepUpi(deliveryId: string) {
    return request<unknown>(
      `${ME_BASE}/deliveries/${encodeURIComponent(deliveryId)}/cod/complete-upi`,
      { method: 'POST', body: {} }
    ).then(mapPartnerDelivery);
  },

  markCodUpi(deliveryId: string, txnRef: string, note?: string) {
    return request<unknown>(
      `${ME_BASE}/deliveries/${encodeURIComponent(deliveryId)}/cod/mark-upi`,
      {
        method: 'POST',
        body: {
          txnRef: txnRef.trim(),
          note: note?.trim() || undefined,
        },
      }
    ).then(mapUpiSettlement);
  },
};
