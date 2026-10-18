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

function formatSlot(iso: unknown): string | null {
  if (typeof iso !== 'string') return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Rings the kitchen doorbell for `kitchen:order-new` while the outlet is online
 * (scheduled orders becoming due ring regardless). `kitchen:order-scheduled`
 * shows a quiet heads-up for a future booking.
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
      if (event !== 'kitchen:order-new' && event !== 'kitchen:order-scheduled') return;
      if (AppState.currentState !== 'active') return;

      const record = asRecord(payload);
      const isScheduled = record.isScheduled === true;
      const booked = event === 'kitchen:order-scheduled';
      // Scheduled tickets were committed earlier, so they ring even if duty is toggled off.
      if (!onlineRef.current && !isScheduled) return;

      const orderId = String(record.orderId ?? record.id ?? '').trim();
      const seenKey = `${booked ? 'booked' : 'live'}:${orderId}`;
      if (!orderId || seenRef.current.has(seenKey)) return;
      seenRef.current.add(seenKey);
      if (seenRef.current.size > 80) {
        seenRef.current = new Set([...seenRef.current].slice(-40));
      }

      const orderNumber = String(record.orderNumber ?? '').trim();
      const slot = formatSlot(record.scheduledFor);
      const ref = orderNumber ? `#${orderNumber}` : 'An order';
      const bell = bellRef.current && !booked;
      const copy = booked
        ? {
            title: 'New scheduled order',
            body: `${ref} is scheduled for ${slot ?? 'later'}. It moves to Active and rings when it's time to prepare.`,
          }
        : isScheduled
          ? {
              title: 'Scheduled order due',
              body: `${ref}${slot ? ` for ${slot}` : ''} — start preparing and accept now.`,
            }
          : {
              title: 'New order',
              body: `${ref} just arrived — open to accept.`,
            };
      void presentDeviceNotification(
        {
          id: `kitchen-${booked ? 'scheduled' : 'new'}-${orderId}`,
          ...copy,
          type: 'order_update',
          isRead: false,
          data: {
            orderId,
            restaurantId: record.restaurantId,
            kind: booked ? 'kitchen_scheduled_order' : 'kitchen_new_order',
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
    const subscription = addNotificationOpenListener((data) => {
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
    return () => subscription?.remove();
  }, [enabled, router]);

  return null;
}
