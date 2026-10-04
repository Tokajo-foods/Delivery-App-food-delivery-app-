import { useEffect, useRef, useState } from 'react';

import {
  acceptInternetCall,
  callErrorMessage,
  createInternetCall,
  declineInternetCall,
  disconnectInternetCall,
  getInternetCall,
} from '@/lib/call/api';
import {
  connectVoice,
  disconnectVoice,
  ensureMicrophone,
  setVoiceMuted,
} from '@/lib/call/internet-audio';
import { listenOrderCallEvents } from '@/lib/call/listen';
import {
  isCallRole,
  type CallRole,
  type InternetCallSession,
  type LiveCall,
  type LiveCallSummary,
  type ViewerKind,
} from '@/lib/call/types';

const TERMINAL = new Set(['ended', 'declined', 'timed_out']);

function terminalCopy(state: string): string {
  if (state === 'timed_out') return 'They did not answer. You can try again or use chat.';
  if (state === 'declined') return 'The call was declined.';
  return 'The call ended.';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function fromSummary(row: LiveCallSummary): LiveCall | null {
  if (!isCallRole(row.role)) return null;
  return {
    callId: row.callId,
    state: row.state,
    direction: row.direction === 'in' ? 'in' : 'out',
    role: row.role,
    callerRole: row.callerRole,
    calleeRole: row.calleeRole,
  };
}

export function useLiveCall(
  orderId: string,
  viewer: ViewerKind,
  summaries: LiveCallSummary[] | undefined,
  onNotice: (message: string | null) => void,
) {
  const [live, setLive] = useState<LiveCall | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const liveRef = useRef<LiveCall | null>(null);
  const joined = useRef(false);
  const closed = useRef(new Set<string>());
  const noticeRef = useRef(onNotice);
  liveRef.current = live;
  noticeRef.current = onNotice;

  useEffect(() => {
    if (liveRef.current) return;
    const open = (summaries ?? []).filter((row) => !closed.current.has(row.callId));
    const next = open.find((row) => row.direction === 'in' && row.state === 'ringing') ?? open[0];
    const mapped = next ? fromSummary(next) : null;
    if (mapped) setLive(mapped);
  }, [summaries]);

  useEffect(() => {
    if (!orderId) return undefined;
    return listenOrderCallEvents(viewer, orderId, (event, payload) => {
      if (event !== 'call:internet') return;
      const row = asRecord(payload);
      if (String(row.orderId ?? '') !== orderId) return;
      const callId = String(row.callId ?? '');
      const state = String(row.state ?? '');
      if (!callId || closed.current.has(callId)) return;
      const current = liveRef.current;
      if (TERMINAL.has(state) && current?.callId === callId) {
        finish(callId, state);
        return;
      }
      if (current?.callId === callId) {
        setLive({ ...current, state });
        return;
      }
      const callerRole = String(row.callerRole ?? '');
      const calleeRole = String(row.calleeRole ?? '');
      if (state === 'ringing' && calleeRole === viewer && isCallRole(callerRole) && !current) {
        setLive({ callId, state, direction: 'in', role: callerRole, callerRole, calleeRole });
      }
    });
  }, [orderId, viewer]);

  useEffect(() => {
    if (!live) return undefined;
    let stop = false;
    const sync = async () => {
      try {
        const session = await getInternetCall(live.callId);
        if (stop || closed.current.has(live.callId)) return;
        if (TERMINAL.has(session.state)) {
          finish(live.callId, session.state);
          return;
        }
        setLive((prev) => (prev && prev.callId === live.callId ? { ...prev, state: session.state } : prev));
        const shouldJoin = session.state === 'accepted' || (session.state === 'ringing' && live.direction === 'out');
        if (!shouldJoin || !session.token || !session.livekitUrl || joined.current) return;
        const url = session.livekitUrl;
        const token = session.token;
        if (joined.current || stop) return;
        await connectVoice(url, token);
        if (!stop) joined.current = true;
      } catch (err) {
        if (stop) return;
        const message = callErrorMessage(err);
        if (/not found|ended|expired/i.test(message)) finish(live.callId, 'ended');
      }
    };
    const timer = setInterval(() => void sync(), 4_000);
    void sync();
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [live?.callId, live?.direction]);

  useEffect(() => () => {
    void disconnectVoice();
  }, []);

  function finish(callId: string, state: string) {
    closed.current.add(callId);
    joined.current = false;
    void disconnectVoice();
    setMuted(false);
    setLive(null);
    noticeRef.current(terminalCopy(state));
  }

  async function join(session: InternetCallSession, role: CallRole, direction: 'in' | 'out') {
    setLive({
      callId: session.callId,
      state: session.state,
      direction,
      role,
      callerRole: session.callerRole,
      calleeRole: session.calleeRole,
    });
    if (!session.token || !session.livekitUrl) return;
    try {
      await connectVoice(session.livekitUrl, session.token);
      joined.current = true;
    } catch (err) {
      joined.current = false;
      closed.current.add(session.callId);
      await disconnectInternetCall(session.callId).catch(() => undefined);
      await disconnectVoice();
      setLive(null);
      throw err;
    }
  }

  async function startInternet(role: CallRole) {
    setBusy(`net:${role}`);
    noticeRef.current(null);
    try {
      await ensureMicrophone();
      const session = await createInternetCall(orderId, role);
      await join(session, role, 'out');
    } catch (err) {
      noticeRef.current(callErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function accept() {
    if (!live) return;
    setBusy('accept');
    noticeRef.current(null);
    try {
      await ensureMicrophone();
      const session = await acceptInternetCall(live.callId);
      await join(session, live.role, 'in');
    } catch (err) {
      noticeRef.current(callErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function decline() {
    if (!live) return;
    setBusy('decline');
    const callId = live.callId;
    closed.current.add(callId);
    try {
      await declineInternetCall(callId);
      setLive(null);
      noticeRef.current('The call was declined.');
    } catch (err) {
      closed.current.delete(callId);
      noticeRef.current(callErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function hangup() {
    if (!live) return;
    setBusy('end');
    const callId = live.callId;
    closed.current.add(callId);
    try {
      await disconnectInternetCall(callId);
      joined.current = false;
      setMuted(false);
      await disconnectVoice();
      setLive(null);
    } catch (err) {
      closed.current.delete(callId);
      noticeRef.current(callErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function toggleMute() {
    const next = !muted;
    try {
      await setVoiceMuted(next);
      setMuted(next);
    } catch (err) {
      noticeRef.current(callErrorMessage(err));
    }
  }

  return { live, busy, muted, startInternet, accept, decline, hangup, toggleMute };
}
