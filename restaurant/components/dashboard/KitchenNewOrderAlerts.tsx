import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  KITCHEN_ORDER_BELL_CHANNEL_ID,
  KITCHEN_ORDER_QUIET_CHANNEL_ID,
  addNotificationOpenListener,
  ensureDeviceNotificationReady,
  presentDeviceNotification,
} from '@/lib/notification/device-alerts';
import { subscribeKitchenEvents } from '@/lib/gateway/kitchen-client';
import type { KitchenInboundEvent } from '@/lib/gateway/kitchen-events';
import { useMyRestaurantId } from '@/lib/order/hooks';
import { useKitchenDuty } from '@/lib/restaurant/hooks';
import { useRestaurantDetail } from '@/lib/restaurant/settings-hooks';
import { useAuthStore } from '@/store/auth-store';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Rings the kitchen doorbell for `kitchen:order-new` while the outlet is online.
 * The sound file is two doorbells back to back, so one alert plays it twice.
 * A killed app still rings from the push, including on the lock screen.
 * Tapping the alert opens the order ticket.
 */
export function KitchenNewOrderAlerts() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role ?? s.role);
  const router = useRouter();
  const seenRef = useRef(new Set<string>());
  const enabled = Boolean(token) && role === 'restaurant';
  const restaurant = useMyRestaurantId();
  const restaurantId = restaurant.data?.id;
  const duty = useKitchenDuty(restaurantId, enabled && Boolean(restaurantId));
  const detail = useRestaurantDetail(enabled);
  const online =
    duty.data?.duty === 'online' && duty.data?.isOnline === true;
  const bellOn = detail.data?.settings?.orderBellEnabled !== false;
  const onlineRef = useRef(online);
  const bellRef = useRef(bellOn);
  onlineRef.current = online;
  bellRef.current = bellOn;

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    void ensureDeviceNotificationReady();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    return subscribeKitchenEvents((event: KitchenInboundEvent, payload) => {
      if (event !== 'kitchen:order-new') return;
      if (!onlineRef.current) return;
      if (AppState.currentState !== 'active') return;

      const record = asRecord(payload);
      const orderId = String(record.orderId ?? record.id ?? '').trim();
      if (!orderId || seenRef.current.has(orderId)) return;
      seenRef.current.add(orderId);
      if (seenRef.current.size > 80) {
        seenRef.current = new Set([...seenRef.current].slice(-40));
      }

      const orderNumber = String(record.orderNumber ?? '').trim();
      const bell = bellRef.current;
      void presentDeviceNotification(
        {
          id: `kitchen-new-${orderId}`,
          title: 'New order',
          body: orderNumber
            ? `Order #${orderNumber} just arrived — open to accept.`
            : 'A new order just arrived — open to accept.',
          type: 'order_update',
          isRead: false,
          data: {
            orderId,
            restaurantId: record.restaurantId,
            kind: 'kitchen_new_order',
            screen: 'order',
          },
        },
        {
          channelId: bell
            ? KITCHEN_ORDER_BELL_CHANNEL_ID
            : KITCHEN_ORDER_QUIET_CHANNEL_ID,
          sound: bell ? 'order_bell.wav' : false,
        }
      );
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    return addNotificationOpenListener((data) => {
      const orderId = String(data.orderId ?? '').trim();
      const kind = String(data.kind ?? data.type ?? '');
      if (!orderId) return;
      if (kind === 'restaurant_chat') {
        router.push({
          pathname: '/order/chat/[orderId]',
          params: { orderId },
        });
        return;
      }
      if (
        kind === 'kitchen_new_order' ||
        kind === 'order_update' ||
        data.screen === 'order'
      ) {
        router.push(`/order/${encodeURIComponent(orderId)}`);
      }
    });
  }, [enabled, router]);

  return null;
}
