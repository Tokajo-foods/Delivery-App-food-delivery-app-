import { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { callErrorMessage, getOrderMasks, recordAttempt } from '@/lib/call/api';
import { listenOrderCallEvents } from '@/lib/call/listen';
import { buildCallRows } from '@/lib/call/rows';
import { DISCLOSURE, pairKeyFor, type CallRole, type ViewerKind } from '@/lib/call/types';
import { useLiveCall } from '@/lib/call/use-live-call';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function useOrderCalls(orderId: string, viewer: ViewerKind) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['order-call-masks', orderId],
    queryFn: () => getOrderMasks(orderId),
    enabled: Boolean(orderId),
    refetchInterval: 10_000,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [dialBusy, setDialBusy] = useState<string | null>(null);
  const rows = useMemo(() => buildCallRows(query.data, viewer), [query.data, viewer]);
  const voice = useLiveCall(orderId, viewer, query.data?.live, setNotice);

  useEffect(() => {
    if (!orderId) return undefined;
    return listenOrderCallEvents(viewer, orderId, (event, payload) => {
      if (event !== 'call:masks') return;
      const row = asRecord(payload);
      if (String(row.orderId ?? '') !== orderId) return;
      const reason = String(row.reason ?? '');
      if (/reassign/i.test(reason)) setNotice('Call numbers were refreshed after the rider changed.');
      else if (/expir|terminal|closed/i.test(reason)) setNotice('Masked numbers for this order have expired.');
      void queryClient.invalidateQueries({ queryKey: ['order-call-masks', orderId] });
    });
  }, [orderId, queryClient, viewer]);

  async function dial(role: CallRole) {
    const pairKey = pairKeyFor(viewer, role);
    const number = rows.find((row) => row.role === role)?.virtualNumber;
    if (!pairKey || !number) {
      setNotice('No virtual number is ready. You can still use an in-app call or chat.');
      return;
    }
    setDialBusy(`cell:${role}`);
    setNotice(null);
    try {
      await recordAttempt(orderId, pairKey);
      await Linking.openURL(`tel:${number}`);
    } catch (err) {
      setNotice(callErrorMessage(err));
    } finally {
      setDialBusy(null);
    }
  }

  return {
    disclosure: query.data?.disclosure || DISCLOSURE,
    rows,
    loading: query.isLoading,
    loadError: query.error ? callErrorMessage(query.error) : null,
    notice,
    busy: dialBusy || voice.busy,
    live: voice.live,
    muted: voice.muted,
    dial,
    startInternet: voice.startInternet,
    accept: voice.accept,
    decline: voice.decline,
    hangup: voice.hangup,
    toggleMute: voice.toggleMute,
  };
}
