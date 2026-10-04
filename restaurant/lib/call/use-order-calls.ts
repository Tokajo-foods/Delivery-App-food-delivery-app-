import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  acceptInternetCall,
  callErrorMessage,
  createInternetCall,
  declineInternetCall,
  endInternetCall,
  getOrderMasks,
  recordAttempt,
} from '@/lib/call/api';
import { connectVoice, disconnectVoice } from '@/lib/call/internet-audio';
import { listenOrderCallEvents } from '@/lib/call/listen';
import { buildCallRows } from '@/lib/call/rows';
import {
  DISCLOSURE,
  isCallRole,
  pairKeyFor,
  type CallRole,
  type LiveCall,
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

export function useOrderCalls(orderId: string, viewer: ViewerKind) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['order-call-masks', orderId],
    queryFn: () => getOrderMasks(orderId),
    enabled: Boolean(orderId),
    refetchInterval: (current) =>
      (current.state.data?.masks.length ?? 0) === 0 ? 8_000 : 20_000,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [live, setLive] = useState<LiveCall | null>(null);
  const liveRef = useRef<LiveCall | null>(null);
  liveRef.current = live;
  const rows = useMemo(() => buildCallRows(query.data, viewer), [query.data, viewer]);

  useEffect(() => {
    if (!orderId) return undefined;
    return listenOrderCallEvents(viewer, orderId, (event, payload) => {
      const row = asRecord(payload);
      if (String(row.orderId ?? '') !== orderId) return;
      if (event === 'call:masks') {
        const reason = String(row.reason ?? '');
        if (/reassign/i.test(reason)) {
          setNotice('Call numbers were refreshed after the rider changed.');
        } else if (/expir|terminal|closed/i.test(reason)) {
          setNotice('Masked numbers for this order have expired.');
        }
        void queryClient.invalidateQueries({ queryKey: ['order-call-masks', orderId] });
        return;
      }
      const callId = String(row.callId ?? '');
      const state = String(row.state ?? '');
      const callerRole = String(row.callerRole ?? '');
      const calleeRole = String(row.calleeRole ?? '');
      const current = liveRef.current;
      if (current && current.callId === callId) {
        if (TERMINAL.has(state)) {
          void disconnectVoice();
          setLive(null);
          setNotice(terminalCopy(state));
          return;
        }
        setLive({ ...current, state });
        return;
      }
      if (state === 'ringing' && calleeRole === viewer && isCallRole(callerRole)) {
        setLive({ callId, state, direction: 'in', role: callerRole, callerRole, calleeRole });
      }
    });
  }, [orderId, queryClient, viewer]);

  useEffect(() => () => {
    void disconnectVoice();
  }, []);

  async function dial(role: CallRole) {
    const pairKey = pairKeyFor(viewer, role);
    const number = rows.find((row) => row.role === role)?.virtualNumber;
    if (!pairKey || !number) {
      setNotice('No virtual number is ready. You can still use an in-app call or chat.');
      return;
    }
    setBusy(`cell:${role}`);
    setNotice(null);
    try {
      await recordAttempt(orderId, pairKey);
      await Linking.openURL(`tel:${number}`);
    } catch (err) {
      setNotice(callErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function startInternet(role: CallRole) {
    setBusy(`net:${role}`);
    setNotice(null);
    try {
      const session = await createInternetCall(orderId, role);
      setLive({
        callId: session.callId,
        state: session.state,
        direction: 'out',
        role,
        callerRole: session.callerRole,
        calleeRole: session.calleeRole,
      });
      if (session.token && session.livekitUrl) {
        try {
          await connectVoice(session.livekitUrl, session.token);
        } catch (err) {
          setNotice(callErrorMessage(err));
        }
      }
    } catch (err) {
      setNotice(callErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function accept() {
    if (!live) return;
    setBusy('accept');
    setNotice(null);
    try {
      const session = await acceptInternetCall(live.callId);
      setLive({ ...live, state: 'accepted' });
      if (session.token && session.livekitUrl) await connectVoice(session.livekitUrl, session.token);
    } catch (err) {
      setNotice(callErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function decline() {
    if (!live) return;
    setBusy('decline');
    try {
      await declineInternetCall(live.callId);
      setLive(null);
      setNotice('The call was declined.');
    } catch (err) {
      setNotice(callErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function hangup() {
    if (!live) return;
    setBusy('end');
    try {
      await endInternetCall(live.callId);
      await disconnectVoice();
      setLive(null);
    } catch (err) {
      setNotice(callErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return {
    disclosure: query.data?.disclosure || DISCLOSURE,
    rows,
    loading: query.isLoading,
    loadError: query.error ? callErrorMessage(query.error) : null,
    notice,
    busy,
    live,
    dial,
    startInternet,
    accept,
    decline,
    hangup,
  };
}
