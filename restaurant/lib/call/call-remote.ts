import { callErrorMessage, disconnectInternetCall, getInternetCall } from '@/lib/call/api';
import {
  connectOutgoingCall,
  finishCall,
  isCallClosed,
  ringIncomingCall,
  type RingMeta,
} from '@/lib/call/call-engine';
import { getCall, useCallStore } from '@/lib/call/call-store';
import { END_REASON, reportNativeCallEnded } from '@/lib/call/native-incoming-call';
import { dismissIncomingCallNotification } from '@/lib/call/incoming-call-notify';
import type { VoiceLinkState } from '@/lib/call/internet-audio';

const TERMINAL = new Set(['ended', 'declined', 'timed_out']);
const DROPPED = 'Call dropped. Check your connection and call again.';

function terminalNotice(
  state: string,
  direction: 'in' | 'out',
  wasRinging: boolean,
  endReason: string | undefined,
  peerName: string,
): string {
  if (endReason === 'dropped') return DROPPED;
  if (direction === 'out') {
    if (endReason === 'busy') return `${peerName} is on another call. Try again shortly.`;
    if (state === 'timed_out') return 'No answer. Try again or use chat.';
    if (state === 'declined') return 'Call declined.';
    return 'Call ended.';
  }
  if (wasRinging) return state === 'declined' ? 'Call ended.' : 'Missed call.';
  return 'Call ended.';
}

/** Server state for a call id (socket, poll, or stop push). Drives the local screen. */
export async function applyRemoteCallState(
  callId: string,
  state: string,
  extra?: { reason?: string; endReason?: string },
): Promise<void> {
  const call = getCall();
  if (!call || call.callId !== callId) {
    if (TERMINAL.has(state) || extra?.reason) {
      reportNativeCallEnded(callId, END_REASON.unanswered);
      void dismissIncomingCallNotification();
    }
    return;
  }
  if (TERMINAL.has(state)) {
    const ringing = call.phase === 'incoming';
    const reason = !ringing
      ? END_REASON.remoteEnded
      : state === 'declined' ? END_REASON.declinedElsewhere : END_REASON.unanswered;
    const notice = terminalNotice(state, call.direction, ringing, extra?.endReason, call.peerName);
    await finishCall(callId, { notice, reason });
    return;
  }
  if (state !== 'accepted') return;
  if (call.direction === 'out') {
    await connectOutgoingCall(callId);
    return;
  }
  if (call.phase === 'incoming') {
    await finishCall(callId, {
      notice: 'Answered on another device.',
      reason: END_REASON.answeredElsewhere,
    });
  }
}

function text(row: Record<string, unknown>, key: string): string | null {
  return typeof row[key] === 'string' ? (row[key] as string) : null;
}

/** Socket `call:internet` payload. `viewer` is who this device is on the order. */
export function onCallSocketEvent(payload: unknown, viewer: string, myUserId: string | null): void {
  const row = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const callId = String(row.callId ?? '');
  const orderId = String(row.orderId ?? '');
  const state = String(row.state ?? '');
  if (!callId || !orderId || isCallClosed(callId)) return;
  const current = getCall();
  if (current?.callId === callId) {
    void applyRemoteCallState(callId, state, { endReason: text(row, 'endReason') ?? undefined });
    return;
  }
  const calleeRole = String(row.calleeRole ?? '');
  const callerUserId = row.callerUserId ? String(row.callerUserId) : null;
  if (state !== 'ringing' || calleeRole !== viewer) return;
  if (myUserId && callerUserId === myUserId) return;
  const meta: RingMeta = {
    orderId,
    callId,
    callerRole: String(row.callerRole ?? ''),
    calleeRole,
    callerName: text(row, 'callerName'),
    callerLogoUrl: text(row, 'callerLogoUrl'),
    orderNumber: text(row, 'orderNumber'),
  };
  void ringIncomingCall(meta);
}

/** Poll safety net when a socket event was missed (network switch, background). */
export async function syncCurrentCall(): Promise<void> {
  const call = getCall();
  if (!call || call.phase === 'connecting') return;
  try {
    const session = await getInternetCall(call.callId);
    if (session.state !== call.remoteState || TERMINAL.has(session.state)) {
      await applyRemoteCallState(call.callId, session.state, { endReason: session.endReason ?? undefined });
    }
  } catch (err) {
    if (/not found|no longer|ended/i.test(callErrorMessage(err))) {
      await finishCall(call.callId, { notice: 'Call ended.' });
    }
  }
}

/** Our own audio link. LiveKit retries first; `dropped` means it gave up. */
export function handleVoiceLink(state: VoiceLinkState): void {
  const call = getCall();
  if (!call || call.phase !== 'active') return;
  if (state !== 'dropped') {
    useCallStore.getState().patchCall(call.callId, { reconnecting: state === 'reconnecting' });
    return;
  }
  void finishCall(call.callId, { notice: DROPPED, reason: END_REASON.failed }).then(() =>
    disconnectInternetCall(call.callId).catch(() => undefined)
  );
}
