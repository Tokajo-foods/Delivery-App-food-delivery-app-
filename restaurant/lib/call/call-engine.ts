import { Platform } from 'react-native';

import {
  acceptInternetCall,
  callErrorMessage,
  createInternetCall,
  declineInternetCall,
  disconnectInternetCall,
  getInternetCall,
} from '@/lib/call/api';
import { keepCallOverLockScreen, releaseCallLockScreen } from '@/lib/call/android-call-alert';
import { startCallOngoingService, stopCallOngoingService } from '@/lib/call/call-ongoing-service';
import { getCall, roleLabel, useCallStore, type ActiveCall } from '@/lib/call/call-store';
import { startRingback, stopCallTones } from '@/lib/call/call-tones';
import { dismissIncomingCallNotification } from '@/lib/call/incoming-call-notify';
import {
  connectVoice,
  disconnectVoice,
  ensureMicrophone,
  refreshVoiceSession,
  setVoiceMuted,
  setVoiceSpeaker,
} from '@/lib/call/internet-audio';
import {
  answerNativeCall,
  bindNativeCallActions,
  bringAppToForeground,
  END_REASON,
  endNativeCall,
  markNativeCallActive,
  reportNativeCallEnded,
  setNativeCallMuted,
} from '@/lib/call/native-incoming-call';
import { isCallRole, type CallRole, type InternetCallSession } from '@/lib/call/types';

const closed = new Set<string>();
const store = () => useCallStore.getState();

export function isCallClosed(callId: string): boolean {
  return closed.has(callId);
}

export function markCallClosed(callId: string): void {
  closed.add(callId);
}

export function fromSession(session: InternetCallSession, direction: 'in' | 'out'): ActiveCall {
  const peer = direction === 'out' ? session.calleeRole : session.callerRole;
  const peerRole: CallRole = isCallRole(peer) ? peer : 'customer';
  const name = direction === 'out' ? session.calleeName : session.callerName;
  const logo = direction === 'out' ? session.calleeLogoUrl : session.callerLogoUrl;
  return {
    callId: session.callId,
    orderId: session.orderId,
    phase: direction === 'out' ? 'outgoing' : 'incoming',
    direction,
    peerRole,
    peerName: name?.trim() || roleLabel(peerRole),
    peerLogoUrl: logo?.trim() || null,
    orderNumber: session.orderNumber ?? null,
    callerRole: session.callerRole,
    calleeRole: session.calleeRole,
    remoteState: session.state,
    connectedAt: null,
    nativeRinging: false,
  };
}

/** The OS call screen answer / end / mute buttons drive the same actions as the app. */
export function ensureNativeBindings(): Promise<void> {
  return bindNativeCallActions({
    onAnswer: (callId) => void acceptCall(callId, { fromNative: true }),
    onEnd: (callId) => {
      if (closed.has(callId)) return;
      const call = getCall();
      if (call?.callId === callId && call.phase !== 'incoming') void hangupCall();
      else void declineCall(callId);
    },
    onMute: (callId, muted) => {
      if (getCall()?.callId === callId && store().muted !== muted) void setMuted(muted);
    },
    onAudioActivated: () => void refreshVoiceSession(),
  });
}

async function joinVoice(url: string, token: string): Promise<void> {
  await connectVoice(url, token);
  const { muted, speaker } = store();
  await setVoiceMuted(muted);
  await setVoiceSpeaker(speaker);
}

export async function startOutgoingCall(orderId: string, role: CallRole, fallbackName?: string): Promise<void> {
  if (store().call) {
    store().set({ notice: 'Finish the current call first.' });
    return;
  }
  store().set({ busy: `net:${role}`, notice: null, muted: false, speaker: false });
  try {
    await ensureMicrophone();
    const session = await createInternetCall(orderId, role);
    const call = fromSession(session, 'out');
    if (call.peerName === roleLabel(role) && fallbackName) call.peerName = fallbackName;
    store().set({ call });
    void startCallOngoingService(call.callId, call.peerName);
    void startRingback(true);
  } catch (err) {
    store().set({ notice: callErrorMessage(err) });
  } finally {
    store().set({ busy: null });
  }
}

/** `fromNative`: the OS call screen already moved to answered. */
export async function acceptCall(callId: string, opts?: { fromNative?: boolean }): Promise<void> {
  if (closed.has(callId)) return;
  let call = getCall();
  if (call && call.callId !== callId) return;
  if (!call) {
    const session = await getInternetCall(callId).catch(() => null);
    if (!session || session.state !== 'ringing') {
      reportNativeCallEnded(callId, END_REASON.unanswered);
      return;
    }
    call = fromSession(session, 'in');
    store().set({ call });
  }
  if (call.phase !== 'incoming') return;
  const nativeRinging = call.nativeRinging;
  await stopCallTones();
  void dismissIncomingCallNotification();
  store().patchCall(callId, { phase: 'connecting', nativeRinging: false });
  store().set({ busy: 'accept', notice: null });
  if (nativeRinging && !opts?.fromNative && Platform.OS === 'ios') answerNativeCall(callId);
  if (Platform.OS === 'android') keepCallOverLockScreen();
  bringAppToForeground();
  try {
    await ensureMicrophone();
    void startCallOngoingService(callId, call.peerName);
    const session = await acceptInternetCall(callId);
    if (!session.token || !session.livekitUrl) throw new Error('Call audio is not ready. Try again.');
    await joinVoice(session.livekitUrl, session.token);
    markNativeCallActive(callId);
    store().patchCall(callId, { phase: 'active', remoteState: 'accepted', connectedAt: Date.now() });
  } catch (err) {
    await disconnectInternetCall(callId).catch(() => undefined);
    await finishCall(callId, { notice: callErrorMessage(err), local: true });
  } finally {
    store().set({ busy: null });
  }
}

/** The caller's side: the other phone answered, so stop the ringback and join audio. */
export async function connectOutgoingCall(callId: string): Promise<void> {
  const call = getCall();
  if (!call || call.callId !== callId || call.phase !== 'outgoing') return;
  store().patchCall(callId, { phase: 'connecting', remoteState: 'accepted' });
  await stopCallTones();
  try {
    const session = await getInternetCall(callId);
    if (!session.token || !session.livekitUrl) throw new Error('Call audio is not ready.');
    await joinVoice(session.livekitUrl, session.token);
    store().patchCall(callId, { phase: 'active', connectedAt: Date.now() });
  } catch (err) {
    await disconnectInternetCall(callId).catch(() => undefined);
    await finishCall(callId, { notice: callErrorMessage(err), local: true });
  }
}

export async function declineCall(callId: string): Promise<void> {
  if (closed.has(callId)) return;
  closed.add(callId);
  store().set({ busy: 'decline' });
  await stopCallTones();
  try {
    await declineInternetCall(callId);
  } catch {
    // The ring may already have timed out. Clear it here either way.
  }
  await finishCall(callId, { local: true });
}

/** Already on a call here. An outlet rings every staff phone, so only a person line answers busy. */
export async function rejectBusy(callId: string, calleeRole?: string): Promise<void> {
  if (calleeRole === 'restaurant' || closed.has(callId)) return;
  closed.add(callId);
  await declineInternetCall(callId, 'busy').catch(() => undefined);
}

export async function hangupCall(): Promise<void> {
  const call = getCall();
  if (!call) return;
  if (call.phase === 'incoming') {
    await declineCall(call.callId);
    return;
  }
  store().set({ busy: 'end' });
  closed.add(call.callId);
  await stopCallTones();
  try {
    await disconnectInternetCall(call.callId);
  } catch {
    // Already ended on the server.
  }
  await finishCall(call.callId, { local: true });
}

export async function setMuted(muted: boolean): Promise<void> {
  const call = getCall();
  store().set({ muted });
  await setVoiceMuted(muted).catch(() => undefined);
  if (call) setNativeCallMuted(call.callId, muted);
}

export async function setSpeaker(speaker: boolean): Promise<void> {
  const call = getCall();
  store().set({ speaker });
  if (call?.phase === 'outgoing') {
    void startRingback(!speaker);
    return;
  }
  await setVoiceSpeaker(speaker);
}

export async function finishCall(
  callId: string,
  opts: { notice?: string | null; local?: boolean; reason?: number },
): Promise<void> {
  closed.add(callId);
  const call = getCall();
  if (call && call.callId !== callId) return;
  await stopCallTones();
  if (opts.local) endNativeCall(callId);
  else reportNativeCallEnded(callId, opts.reason ?? END_REASON.remoteEnded);
  void dismissIncomingCallNotification();
  releaseCallLockScreen();
  await stopCallOngoingService();
  await disconnectVoice();
  store().set({ call: null, busy: null, muted: false, speaker: false, notice: opts.notice ?? null });
}
