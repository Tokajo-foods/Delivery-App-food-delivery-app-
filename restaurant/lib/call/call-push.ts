import { AppState, Platform } from 'react-native';

import {
  acceptCall,
  declineCall,
  ensureNativeBindings,
  isCallClosed,
  ringIncomingCall,
  type RingMeta,
} from '@/lib/call/call-engine';
import { applyRemoteCallState } from '@/lib/call/call-remote';
import { getCall } from '@/lib/call/call-store';
import { presentMissedCallNotification } from '@/lib/call/incoming-call-notify';

type Data = Record<string, unknown>;

const CALL_KINDS = new Set(['internet_call', 'internet_call_end', 'internet_call_missed']);

function record(value: unknown): Data | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Data;
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      return record(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return null;
}

/** Expo push, raw FCM data, and background-task payloads all nest the data differently. */
export function readCallPushData(raw: unknown): Data | null {
  const base = record(raw);
  if (!base) return null;
  const candidates = [base, record(base.dataString), record(base.body), record(base.data), record(base.payload)];
  for (const item of candidates) {
    if (item && CALL_KINDS.has(String(item.kind ?? ''))) return item;
  }
  return null;
}

export function isCallPush(raw: unknown): boolean {
  return readCallPushData(raw) !== null;
}

function metaOf(data: Data): RingMeta {
  const text = (key: string) => (typeof data[key] === 'string' ? String(data[key]) : null);
  return {
    orderId: text('orderId') ?? '',
    callId: text('callId') ?? '',
    callerRole: text('callerRole') ?? '',
    calleeRole: text('calleeRole') ?? undefined,
    callerName: text('callerName'),
    callerLogoUrl: text('callerLogoUrl'),
    orderNumber: text('orderNumber'),
  };
}

/** A call push arrived (background task on Android, foreground listener on both). */
export async function handleCallPush(raw: unknown, source: 'task' | 'foreground'): Promise<void> {
  const data = readCallPushData(raw);
  if (!data) return;
  const meta = metaOf(data);
  if (!meta.callId) return;
  const kind = String(data.kind);
  if (kind === 'internet_call') {
    await ensureNativeBindings();
    await ringIncomingCall(meta);
    return;
  }
  if (kind === 'internet_call_end') {
    const reason = String(data.reason ?? '');
    await applyRemoteCallState(meta.callId, reason === 'answered_elsewhere' ? 'accepted' : 'declined', { reason });
    return;
  }
  const ringingHere = getCall()?.callId === meta.callId;
  const handledHere = isCallClosed(meta.callId);
  await applyRemoteCallState(meta.callId, 'timed_out', { reason: 'missed' });
  const silentWake = source === 'task' && Platform.OS === 'android' && AppState.currentState !== 'active';
  if (silentWake && (ringingHere || !handledHere)) {
    await presentMissedCallNotification({
      orderId: meta.orderId,
      callId: meta.callId,
      callerName: meta.callerName?.trim() || 'Tokajo',
      orderNumber: meta.orderNumber,
    });
  }
}

/** Tap or Accept / Decline on the ringing notification. */
export async function handleCallResponse(actionIdentifier: string, raw: unknown): Promise<boolean> {
  const data = readCallPushData(raw);
  if (!data || String(data.kind) !== 'internet_call') return Boolean(data);
  const meta = metaOf(data);
  if (!meta.callId) return true;
  if (actionIdentifier === 'DECLINE') {
    await declineCall(meta.callId);
    return true;
  }
  await ringIncomingCall(meta, { verify: true, inApp: true });
  if (actionIdentifier === 'ACCEPT') await acceptCall(meta.callId);
  return true;
}
