import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';

import { useDeliveryOrderMutations } from '@/lib/delivery-partner/hooks';
import {
  labelForCoords,
  readAccurateGps,
} from '@/lib/delivery-partner/live-place';
import {
  getLivePlaceSnapshot,
  patchLivePlace,
  type LocationLockReason,
} from '@/lib/delivery-partner/live-place-store';
import {
  readLocationLock,
  restoreLocationAccess,
} from '@/lib/delivery-partner/location-restore';
import { pushLiveToast } from '@/lib/delivery-partner/live-toast-store';
import { getApiErrorCode } from '@/lib/errors';

const SERVICE_WATCH_MS = 4000;

function confirmGoOffline(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Location is off',
      'Turning location off will take you offline and you will stop getting new orders.',
      [
        { text: 'Turn location on', onPress: () => resolve(false) },
        { text: 'Go offline', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });
}

/**
 * While the rider is online, location must stay on.
 * - Online, no trip: warn first; the rider chooses to turn it back on or go offline.
 * - On a trip (accept → delivered): never offer offline. `TripLocationLock` blocks the app until fixed.
 */
export function useAutoLivePlace(enabled: boolean, isOnline: boolean, onTrip: boolean) {
  const { setOnline } = useDeliveryOrderMutations();
  const onlineRef = useRef(isOnline);
  const onTripRef = useRef(onTrip);
  const goOfflineRef = useRef(setOnline.mutate);
  const promptedRef = useRef(false);
  const forcedRef = useRef(false);
  const tripPromptedRef = useRef(false);
  onlineRef.current = isOnline;
  onTripRef.current = onTrip;
  goOfflineRef.current = setOnline.mutate;

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let watch: Location.LocationSubscription | null = null;
    let applying = false;
    let refreshing = false;

    const applyCoords = async (latitude: number, longitude: number) => {
      if (applying) return;
      applying = true;
      try {
        const label = await labelForCoords(latitude, longitude);
        if (!alive) return;
        patchLivePlace({ label, latitude, longitude, locating: false, servicesOn: true });
        // Server GPS is owned by partnerLocationTracker. This hook only labels the header.
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
        await applyCoords(read.latitude, read.longitude);
        if (!alive || watch) return;
        watch = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 40,
            timeInterval: 15000,
            mayShowUserSettingsDialog: false,
          },
          (pos) => {
            void applyCoords(pos.coords.latitude, pos.coords.longitude);
          }
        );
      } finally {
        refreshing = false;
      }
    };

    const goOffline = () => {
      forcedRef.current = true;
      goOfflineRef.current(false, {
        onSuccess: () => {
          pushLiveToast({
            title: 'You are offline',
            body: 'Location is off, so you will not get new orders.',
            tone: 'warn',
          });
        },
        onError: (err) => {
          forcedRef.current = false;
          pushLiveToast({
            title: 'Still online',
            body:
              getApiErrorCode(err) === 'ACTIVE_DELIVERY'
                ? 'Finish your active delivery first. Keep location on.'
                : 'Could not go offline. Turn location back on.',
            tone: 'warn',
          });
        },
      });
    };

    const onLocationBlocked = async (reason: LocationLockReason) => {
      if (reason !== 'background') {
        patchLivePlace({ servicesOn: reason !== 'services', locating: false });
        watch?.remove();
        watch = null;
      }

      if (onTripRef.current) {
        // The lock screen owns the UI. Fire the Android system dialog once per outage.
        if (tripPromptedRef.current) return;
        tripPromptedRef.current = true;
        await restoreLocationAccess(reason);
        return;
      }

      if (!onlineRef.current) {
        if (promptedRef.current || reason === 'background') return;
        promptedRef.current = true;
        const turnedOn = await restoreLocationAccess(reason);
        if (turnedOn && alive) {
          promptedRef.current = false;
          await refreshPlace();
        }
        return;
      }

      if (forcedRef.current || promptedRef.current) return;
      promptedRef.current = true;
      const wantsOffline = await confirmGoOffline();
      if (!alive || !onlineRef.current) {
        promptedRef.current = false;
        return;
      }
      if (onTripRef.current) {
        // Accepted an order while the alert was open: offline is no longer allowed.
        promptedRef.current = false;
        return;
      }
      if (wantsOffline) {
        promptedRef.current = false;
        goOffline();
        return;
      }
      const turnedOn = await restoreLocationAccess(reason);
      promptedRef.current = false;
      if (turnedOn && alive) await refreshPlace();
    };

    const checkServices = async (refresh: boolean) => {
      const lock = await readLocationLock(onTripRef.current);
      if (!alive) return;
      const relevant = lock && (onlineRef.current || onTripRef.current || lock === 'services')
        ? lock
        : null;
      patchLivePlace({ lockReason: onTripRef.current ? relevant : null });
      if (!onlineRef.current) forcedRef.current = false;
      if (relevant) {
        await onLocationBlocked(relevant);
        return;
      }
      forcedRef.current = false;
      promptedRef.current = false;
      tripPromptedRef.current = false;
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

  useEffect(() => {
    if (!onTrip) patchLivePlace({ lockReason: null });
  }, [onTrip]);
}
