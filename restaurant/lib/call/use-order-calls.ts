import { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { callErrorMessage, getOrderMasks, recordAttempt } from '@/lib/call/api';
import { startOutgoingCall } from '@/lib/call/call-engine';
import { useCallStore } from '@/lib/call/call-store';
import { listenOrderCallEvents } from '@/lib/call/listen';
import { buildCallRows } from '@/lib/call/rows';
import { DISCLOSURE, pairKeyFor, type CallRole, type ViewerKind } from '@/lib/call/types';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Order call buttons stay here. The full-screen WhatsApp UI lives in CallHost. */
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
  const engineBusy = useCallStore((s) => s.busy);
  const engineNotice = useCallStore((s) => s.notice);

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

  async function startInternet(role: CallRole, fallbackName?: string) {
    setNotice(null);
    await startOutgoingCall(orderId, role, fallbackName);
  }

  return {
    disclosure: query.data?.disclosure || DISCLOSURE,
    rows,
    loading: query.isLoading,
    loadError: query.error ? callErrorMessage(query.error) : null,
    notice: notice || engineNotice,
    busy: dialBusy || engineBusy,
    dial,
    startInternet,
  };
}
