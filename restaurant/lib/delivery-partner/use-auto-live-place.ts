import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';

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

function confirmKeepLocation(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Location is required',
      'By closing the location your ID goes offline.',
      [
        { text: 'Stay tuned', onPress: () => resolve(true) },
        { text: 'OK', style: 'destructive', onPress: () => resolve(false) },
      ],
      { cancelable: false }
    );
  });
}

/**
 * While the rider is online, location must stay on.
 * The first time it drops, ask: OK goes offline, Stay tuned keeps duty and turns location back on.
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
      if (!onlineRef.current) {
        if (promptedRef.current) return;
        promptedRef.current = true;
        const turnedOn = await askToEnableLocation();
        if (turnedOn && alive) {
          promptedRef.current = false;
          await refreshPlace();
        }
        return;
      }
      if (forcedRef.current || promptedRef.current) return;
      promptedRef.current = true;
      const stayTuned = await confirmKeepLocation();
      if (!alive || !onlineRef.current) {
        promptedRef.current = false;
        return;
      }
      if (!stayTuned) {
        promptedRef.current = false;
        forcedRef.current = true;
        goOfflineRef.current(false, {
          onSuccess: () => {
            pushLiveToast({
              title: 'You are offline',
              body: 'Location is off, so your ID is offline.',
              tone: 'warn',
            });
          },
        });
        return;
      }
      const turnedOn = await askToEnableLocation();
      promptedRef.current = false;
      if (turnedOn && alive) {
        await refreshPlace();
      }
    };

    const checkServices = async (refresh: boolean) => {
      const servicesOn = await Location.hasServicesEnabledAsync().catch(() => false);
      const permission = await Location.getForegroundPermissionsAsync().catch(
        () => null
      );
      const allowed = permission?.status === 'granted';
      if (!alive) return;
      if (!onlineRef.current) forcedRef.current = false;
      if (!servicesOn || (onlineRef.current && !allowed)) {
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
