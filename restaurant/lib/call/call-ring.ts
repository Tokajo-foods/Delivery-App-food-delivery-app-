import { AppState, Platform } from 'react-native';

import { getInternetCall } from '@/lib/call/api';
import { showFullScreenCallAlert } from '@/lib/call/android-call-alert';
import {
  ensureNativeBindings,
  finishCall,
  fromSession,
  isCallClosed,
  markCallClosed,
  rejectBusy,
} from '@/lib/call/call-engine';
import { getCall, roleLabel, useCallStore, type ActiveCall } from '@/lib/call/call-store';
import { startRingtone, stopCallTones } from '@/lib/call/call-tones';
import { dismissIncomingCallNotification, presentIncomingCallNotification } from '@/lib/call/incoming-call-notify';
import { displayNativeIncomingCall, END_REASON, reportNativeCallEnded } from '@/lib/call/native-incoming-call';
import { isCallRole, type CallRole } from '@/lib/call/types';

export type RingMeta = {
  orderId: string;
  callId: string;
  callerRole: string;
  calleeRole?: string;
  callerName?: string | null;
  callerLogoUrl?: string | null;
  orderNumber?: string | null;
};

type RingOptions = {
  /** Re-check with the server first (stale push, notification tap). */
  verify?: boolean;
  /** The app is open: ring inside the app only. */
  inApp?: boolean;
  /** iOS CallKit is already ringing from a VoIP push. */
  nativeShown?: boolean;
};

const store = () => useCallStore.getState();

/** Past the server ring window (45 s default). Covers a missed stop push or socket while locked. */
const RING_GUARD_MS = 50_000;
const RING_GUARD_RETRY_MS = 15_000;

function guardRing(callId: string, delay = RING_GUARD_MS): void {
  setTimeout(() => {
    void (async () => {
      const call = getCall();
      if (!call || call.callId !== callId || call.phase !== 'incoming') return;
      const session = await getInternetCall(callId).catch(() => null);
      if (session?.state === 'ringing') {
        guardRing(callId, RING_GUARD_RETRY_MS);
        return;
      }
      if (getCall()?.phase !== 'incoming') return;
      await finishCall(callId, { notice: 'Missed call.', reason: END_REASON.unanswered });
    })();
  }, delay);
}

function fromMeta(meta: RingMeta): ActiveCall {
  const peerRole: CallRole = isCallRole(meta.callerRole) ? meta.callerRole : 'customer';
  return {
    callId: meta.callId,
    orderId: meta.orderId,
    phase: 'incoming',
    direction: 'in',
    peerRole,
    peerName: meta.callerName?.trim() || roleLabel(peerRole),
    peerLogoUrl: meta.callerLogoUrl?.trim() || null,
    orderNumber: meta.orderNumber?.trim() || null,
    callerRole: meta.callerRole,
    calleeRole: meta.calleeRole ?? '',
    remoteState: 'ringing',
    connectedAt: null,
    nativeRinging: false,
  };
}

/** Null = the call is over. A network failure still rings a call CallKit already shows. */
async function verifiedCall(meta: RingMeta, nativeShown: boolean): Promise<ActiveCall | null> {
  const session = await getInternetCall(meta.callId).catch(() => undefined);
  if (session === undefined && nativeShown) return fromMeta(meta);
  if (!session || session.state !== 'ringing') return null;
  return fromSession(session, 'in');
}

/** Socket, push, VoIP push, or the order screen saw a ring for this device. Idempotent per call id. */
export async function ringIncomingCall(meta: RingMeta, opts: RingOptions = {}): Promise<void> {
  if (!meta.callId || !meta.orderId) return;
  const nativeShown = Boolean(opts.nativeShown);
  if (isCallClosed(meta.callId)) {
    if (nativeShown) reportNativeCallEnded(meta.callId, END_REASON.unanswered);
    return;
  }
  const current = getCall();
  if (current) {
    if (current.callId !== meta.callId) {
      if (nativeShown) reportNativeCallEnded(meta.callId, END_REASON.unanswered);
      void rejectBusy(meta.callId, meta.calleeRole);
    } else if (nativeShown && current.phase === 'incoming' && !current.nativeRinging) {
      await stopCallTones();
      store().patchCall(current.callId, { nativeRinging: true });
    }
    return;
  }

  const call = opts.verify || nativeShown ? await verifiedCall(meta, nativeShown) : fromMeta(meta);
  if (!call) {
    markCallClosed(meta.callId);
    reportNativeCallEnded(meta.callId, END_REASON.unanswered);
    void dismissIncomingCallNotification();
    return;
  }
  if (getCall() || isCallClosed(call.callId)) return;
  guardRing(call.callId);

  if (nativeShown) {
    store().set({ call: { ...call, nativeRinging: true }, muted: false, speaker: false, notice: null });
    await ensureNativeBindings();
    return;
  }
  store().set({ call, muted: false, speaker: false, notice: null });
  if (opts.inApp || AppState.currentState === 'active') {
    void startRingtone();
    return;
  }
  await ensureNativeBindings();
  const shown = await displayNativeIncomingCall(call.callId, call.peerName);
  store().patchCall(call.callId, { nativeRinging: shown });
  if (shown) return;
  const alert = {
    orderId: call.orderId,
    callId: call.callId,
    callerRole: call.callerRole,
    calleeRole: call.calleeRole,
    callerName: call.peerName,
    callerLogoUrl: call.peerLogoUrl,
    orderNumber: call.orderNumber,
  };
  if (Platform.OS === 'android' && (await showFullScreenCallAlert(alert))) return;
  await presentIncomingCallNotification(alert);
}
