import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { ensureNativeBindings } from '@/lib/call/call-engine';
import { handleCallPush, handleCallResponse } from '@/lib/call/call-push';
import { onCallSocketEvent, syncCurrentCall } from '@/lib/call/call-remote';
import { useCallStore } from '@/lib/call/call-store';
import { ensureCallNotificationSetup } from '@/lib/call/incoming-call-notify';
import { subscribeRiderGateway } from '@/lib/delivery-partner/rider-gateway';
import { subscribeKitchenEvents } from '@/lib/gateway/kitchen-client';
import { getNotificationsModule } from '@/lib/notification/device-alerts';

const POLL_MS = 3_000;
const handledResponses = new Set<string>();

/** Wires sockets, pushes, and the OS call screen into the global call engine. */
export function useCallSync(viewer: 'restaurant' | 'rider', userId: string | null, enabled: boolean) {
  const callId = useCallStore((s) => s.call?.callId ?? null);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    void ensureCallNotificationSetup();
    void ensureNativeBindings();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onEvent = (event: string, payload: unknown) => {
      if (event === 'call:internet') onCallSocketEvent(payload, viewer, userId);
    };
    const offKitchen = subscribeKitchenEvents(onEvent);
    const offRider = subscribeRiderGateway(onEvent);
    return () => {
      offKitchen();
      offRider();
    };
  }, [enabled, userId, viewer]);

  useEffect(() => {
    if (!callId) return undefined;
    const timer = setInterval(() => void syncCurrentCall(), POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncCurrentCall();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [callId]);

  useEffect(() => {
    if (!enabled) return undefined;
    const N = getNotificationsModule();
    if (!N) return undefined;
    const respond = (response: {
      actionIdentifier: string;
      notification: { request: { identifier: string; content: { data: unknown } } };
    }) => {
      const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handledResponses.has(key)) return;
      handledResponses.add(key);
      void handleCallResponse(response.actionIdentifier, response.notification.request.content.data);
    };
    const received = N.addNotificationReceivedListener((n) => {
      void handleCallPush(n.request.content.data, 'foreground');
    });
    const tapped = N.addNotificationResponseReceivedListener(respond);
    void N.getLastNotificationResponseAsync()
      .then((last) => {
        if (last) respond(last);
      })
      .catch(() => undefined);
    return () => {
      received.remove();
      tapped.remove();
    };
  }, [enabled]);
}
