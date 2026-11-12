import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import {
  ORDER_BELL_BURST_PLAYS,
  playOrderBellBurst,
  stopOrderBell,
} from '@/lib/notification/order-bell-loop';
import { useMyRestaurantId, useRestaurantOrders } from '@/lib/order/hooks';
import { useRestaurantDetail } from '@/lib/restaurant/settings-hooks';
import { useCallStore } from '@/lib/call/call-store';

const RECHECK_MS = 15_000;

function isWaitingToAccept(
  order: { status: string; kitchenReleaseAt?: string | null },
  now: number
): boolean {
  if (order.status !== 'placed') return false;
  const release = order.kitchenReleaseAt ? Date.parse(order.kitchenReleaseAt) : NaN;
  return !Number.isFinite(release) || release <= now;
}

/**
 * Short bell burst (2–3 chimes) when a new order is waiting to be accepted — not a continuous loop.
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
  /** Each order id rings at most once per app session while foregrounded. */
  const alertedOrderRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const isActive = state === 'active';
      setActive(isActive);
      if (!isActive) {
        stopOrderBell();
        alertedOrderRef.current = new Set();
      }
    });
    const timer = setInterval(() => setNow(Date.now()), RECHECK_MS);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);

  const waitingIds = useMemo(() => {
    const ids = (orders.data ?? [])
      .filter((order) => isWaitingToAccept(order, now))
      .map((order) => order.id)
      .filter(Boolean);
    return ids.sort().join(',');
  }, [orders.data, now]);

  useEffect(() => {
    if (Platform.OS === 'web' || !active || !bellOn || inCall) {
      stopOrderBell();
      return;
    }

    const current = new Set(waitingIds ? waitingIds.split(',') : []);
    const fresh = [...current].filter((id) => !alertedOrderRef.current.has(id));

    if (fresh.length > 0) {
      for (const id of fresh) alertedOrderRef.current.add(id);
      void playOrderBellBurst(ORDER_BELL_BURST_PLAYS);
    }
  }, [waitingIds, active, bellOn, inCall]);

  useEffect(() => () => stopOrderBell(), []);

  return null;
}
