import axios from 'axios';

import { api } from '@/lib/api';
import type { CallRole, InternetCallSession, OrderMasks } from '@/lib/call/types';

const ROOT = '/api/v1/call-service';

export async function getOrderMasks(orderId: string): Promise<OrderMasks> {
  const res = await api.get(`${ROOT}/orders/${encodeURIComponent(orderId)}/masks`);
  return unwrap<OrderMasks>(res.data);
}

export async function recordAttempt(orderId: string, pairKey: string): Promise<void> {
  const res = await api.post(
    `${ROOT}/orders/${encodeURIComponent(orderId)}/pairs/${encodeURIComponent(pairKey)}/attempts`,
    {}
  );
  unwrap(res.data);
}

export async function createInternetCall(
  orderId: string,
  to: CallRole
): Promise<InternetCallSession> {
  const res = await api.post(
    `${ROOT}/orders/${encodeURIComponent(orderId)}/internet-calls`,
    { to }
  );
  return unwrap<InternetCallSession>(res.data);
}

export async function acceptInternetCall(callId: string): Promise<InternetCallSession> {
  const res = await api.post(`${ROOT}/internet-calls/${encodeURIComponent(callId)}/accept`, {});
  return unwrap<InternetCallSession>(res.data);
}

export async function declineInternetCall(callId: string): Promise<void> {
  const res = await api.post(`${ROOT}/internet-calls/${encodeURIComponent(callId)}/decline`, {});
  unwrap(res.data);
}

export async function endInternetCall(callId: string): Promise<void> {
  const res = await api.post(`${ROOT}/internet-calls/${encodeURIComponent(callId)}/end`, {});
  unwrap(res.data);
}

export function callErrorMessage(error: unknown): string {
  const parsed = readError(error);
  if (parsed.code === 'CALL_RATE_LIMITED' || parsed.status === 429) {
    return safe(parsed.message, 'This number has already been used 12 times this hour. Try again later, or use chat.');
  }
  if (
    parsed.code === 'MASKED_CALL_UNAVAILABLE' ||
    parsed.code === 'INTERNET_CALL_UNAVAILABLE' ||
    parsed.status === 503
  ) {
    return safe(parsed.message, 'Calling is unavailable right now. Chat still works.');
  }
  if (parsed.code === 'MASK_NOT_ACTIVE' || parsed.code === 'CALL_WINDOW_CLOSED') {
    return safe(parsed.message, 'This masked number has expired. Chat still works.');
  }
  if (parsed.code === 'CALL_IN_PROGRESS') {
    return safe(parsed.message, 'A call is already in progress on this order.');
  }
  if (parsed.code === 'RIDER_NOT_ASSIGNED') {
    return 'No rider has accepted this order yet.';
  }
  return safe(parsed.message, 'Could not start the call. Chat still works.');
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const envelope = payload as { success?: boolean; message?: string; data?: T };
    if (envelope.success === false) {
      throw new Error(envelope.message || 'Call request failed');
    }
    return envelope.data as T;
  }
  return payload as T;
}

function readError(error: unknown): { message: string; code?: string; status?: number } {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; code?: string } | undefined;
    return {
      message: data?.message || error.message || '',
      code: data?.code,
      status: error.response?.status,
    };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: '' };
}

function safe(message: string, fallback: string): string {
  const text = message.trim();
  if (!text || /\d{10,}/.test(text)) return fallback;
  return text;
}
