import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { deliveryPartnerApi } from '@/lib/delivery-partner/api';
import { useDeliveryOrderMutations } from '@/lib/delivery-partner/hooks';
import {
  askToEnableLocation,
  labelForCoords,
  readAccurateGps,
} from '@/lib/delivery-partner/live-place';
import {
  getLivePlaceSnapshot,
  patchLivePlace,
} from '@/lib/delivery-partner/live-place-store';
import { pushLiveToast } from '@/lib/delivery-partner/live-toast-store';

const SERVICE_WATCH_MS = 4000;

/**
 * On enter: if location is on, reverse-geocode the GPS fix for the header.
 * If it is off, ask to turn it on. If the rider is online and location drops, go offline.
 */
export function useAutoLivePlace(enabled: boolean, isOnline: boolean) {
  const { setOnline } = useDeliveryOrderMutations();
  const onlineRef = useRef(isOnline);
  const goOfflineRef = useRef(setOnline.mutate);
  const promptedRef = useRef(false);
  const forcedRef = useRef(false);
  onlineRef.current = isOnline;
  goOfflineRef.current = setOnline.mutate;

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let watch: Location.LocationSubscription | null = null;
    let applying = false;
    let refreshing = false;

    const applyCoords = async (latitude: number, longitude: number, accuracy?: number | null) => {
      if (applying) return;
      applying = true;
      try {
        const label = await labelForCoords(latitude, longitude);
        if (!alive) return;
        patchLivePlace({
          label,
          latitude,
          longitude,
          locating: false,
          servicesOn: true,
        });
        try {
          await deliveryPartnerApi.pushLocation({
            latitude,
            longitude,
            accuracy: accuracy ?? undefined,
            timestamp: Date.now(),
          });
        } catch {
          // header still shows the Google place
        }
      } finally {
        applying = false;
      }
    };

    const refreshPlace = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        patchLivePlace({ locating: true });
        const read = await readAccurateGps();
        if (!alive) return;
        if (!read.ok) {
          patchLivePlace({
            locating: false,
            servicesOn: read.reason !== 'fix' ? false : getLivePlaceSnapshot().servicesOn,
          });
          return;
        }
        await applyCoords(read.latitude, read.longitude, read.accuracy);
        if (!alive || watch) return;
        watch = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 20,
            timeInterval: 8000,
            mayShowUserSettingsDialog: false,
          },
          (pos) => {
            void applyCoords(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy
            );
          }
        );
      } finally {
        refreshing = false;
      }
    };

    const onServicesOff = async () => {
      patchLivePlace({ servicesOn: false, locating: false });
      watch?.remove();
      watch = null;
      if (onlineRef.current && !forcedRef.current) {
        forcedRef.current = true;
        goOfflineRef.current(false, {
          onSuccess: () => {
            pushLiveToast({
              title: "You're offline",
              body: 'Location was turned off, so duty stopped.',
              tone: 'warn',
            });
          },
        });
      }
      if (promptedRef.current) return;
      promptedRef.current = true;
      const turnedOn = await askToEnableLocation();
      if (turnedOn && alive) {
        forcedRef.current = false;
        promptedRef.current = false;
        await refreshPlace();
      }
    };

    const checkServices = async (refresh: boolean) => {
      const servicesOn = await Location.hasServicesEnabledAsync().catch(() => false);
      if (!alive) return;
      if (!servicesOn) {
        await onServicesOff();
        return;
      }
      forcedRef.current = false;
      promptedRef.current = false;
      patchLivePlace({ servicesOn: true });
      if (refresh || !getLivePlaceSnapshot().label) await refreshPlace();
    };

    void checkServices(true);
    const timer = setInterval(() => {
      void checkServices(false);
    }, SERVICE_WATCH_MS);
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkServices(true);
    });

    return () => {
      alive = false;
      clearInterval(timer);
      appSub.remove();
      watch?.remove();
    };
  }, [enabled]);
}
