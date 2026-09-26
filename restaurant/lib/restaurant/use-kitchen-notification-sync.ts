import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import {
  isGloballyBackingOff,
  isRateLimitedError,
  noteRateLimited,
} from '@/lib/live-query';
import {
  addNotificationOpenListener,
  syncDeviceAlertsForNotifications,
} from '@/lib/notification/device-alerts';
import { useMyRestaurantId } from '@/lib/order/hooks';
import {
  kitchenInboxApi,
} from '@/lib/restaurant/inbox-api';
import { kitchenInboxKeys } from '@/lib/restaurant/inbox-hooks';
import { useAuthStore } from '@/store/auth-store';

const POLL_MS = 25_000;
const BACKOFF_POLL_MS = 75_000;

/**
 * Kitchen inbox poll + tray alerts (dev/prod builds only; skipped in Expo Go).
 * Remote KYC push still comes from notification-service when a device token is registered.
 */
export function useKitchenNotificationSync(enabled = true) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const restaurant = useMyRestaurantId();
  const restaurantId = restaurant.data?.id ?? '';
  const lastCountRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    const isKitchen =
      role === 'restaurant' ||
      role === 'restaurant_owner' ||
      role === 'owner';
    const active = Boolean(enabled && token && isKitchen && restaurantId);
    if (!active) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = (ms: number) => {
      if (cancelled) return;
      timer = setTimeout(() => {
        void tick();
      }, ms);
    };

    const tick = async () => {
      if (cancelled || runningRef.current) {
        scheduleNext(POLL_MS);
        return;
      }
      if (AppState.currentState !== 'active') {
        scheduleNext(POLL_MS);
        return;
      }
      if (isGloballyBackingOff()) {
        scheduleNext(BACKOFF_POLL_MS);
        return;
      }

      runningRef.current = true;
      try {
        const list = await kitchenInboxApi.listNotifications(restaurantId, {
          page: 1,
          limit: 40,
        });
        if (cancelled) return;

        queryClient.setQueryData(
          kitchenInboxKeys.list(restaurantId, { page: 1 }),
          list
        );

        const count = list.unreadCount;
        const prev = lastCountRef.current;
        lastCountRef.current = count;

        await syncDeviceAlertsForNotifications(list.notifications);

        if (prev != null && count > prev) {
          void queryClient.invalidateQueries({
            queryKey: kitchenInboxKeys.restaurant(restaurantId),
            refetchType: 'none',
          });
        }

        scheduleNext(POLL_MS);
      } catch (error) {
        if (isRateLimitedError(error)) {
          noteRateLimited(error);
          scheduleNext(BACKOFF_POLL_MS);
        } else {
          scheduleNext(POLL_MS);
        }
      } finally {
        runningRef.current = false;
      }
    };

    scheduleNext(1_500);

    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !runningRef.current) {
        if (timer) clearTimeout(timer);
        scheduleNext(400);
      }
    });

    const responseSub = addNotificationOpenListener((data) => {
      const screen = data.screen != null ? String(data.screen) : '';
      if (screen === 'onboarding' || String(data.action ?? '').includes('kyc')) {
        router.push('/onboarding' as never);
        return;
      }
      router.push('/notifications' as never);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      appSub.remove();
      responseSub.remove();
    };
  }, [enabled, token, role, restaurantId, queryClient, router]);
}
