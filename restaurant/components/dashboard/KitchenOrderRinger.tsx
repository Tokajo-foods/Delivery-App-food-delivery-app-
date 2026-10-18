import { useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { startOrderBell, stopOrderBell } from '@/lib/notification/order-bell-loop';
import { useMyRestaurantId, useRestaurantOrders } from '@/lib/order/hooks';
import { useRestaurantDetail } from '@/lib/restaurant/settings-hooks';
import { useCallStore } from '@/lib/call/call-store';

const RECHECK_MS = 15_000;

/**
 * Keeps ringing the order bell while the app is open and any order is waiting to be accepted
 * (Swiggy/Zomato partner style). Stops as soon as every order is accepted, rejected or cancelled,
 * when the outlet turns the bell off, during an in-app call, or when the app goes to background
 * (the push + reminders take over there).
 */
export function KitchenOrderRinger() {
  const restaurant = useMyRestaurantId();
  const restaurantId = restaurant.data?.id;
  const orders = useRestaurantOrders(restaurantId, { enabled: Boolean(restaurantId) });
  const detail = useRestaurantDetail(Boolean(restaurantId));
  const inCall = useCallStore((s) => s.call != null);
  const bellOn = detail.data?.settings?.orderBellEnabled !== false;
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    const timer = setInterval(() => setNow(Date.now()), RECHECK_MS);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);

  const waiting = useMemo(
    () =>
      (orders.data ?? []).some((order) => {
        if (order.status !== 'placed') return false;
        const release = order.kitchenReleaseAt ? Date.parse(order.kitchenReleaseAt) : NaN;
        return !Number.isFinite(release) || release <= now;
      }),
    [orders.data, now]
  );

  const ring = Platform.OS !== 'web' && active && bellOn && waiting && !inCall;

  useEffect(() => {
    if (ring) void startOrderBell();
    else stopOrderBell();
  }, [ring]);

  useEffect(() => () => stopOrderBell(), []);

  return null;
}
