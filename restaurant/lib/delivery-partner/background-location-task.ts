import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import * as Location from 'expo-location';

import {
  clearFixQueue,
  enqueueFix,
  takeSendableFixes,
  writeFixQueue,
} from '@/lib/delivery-partner/background-location-queue';
import {
  isBackgroundTripStatus,
  isUsableAccuracy,
  nextDelayMs,
  shouldSampleFix,
  type QueuedFix,
} from '@/lib/delivery-partner/background-location-policy';
import { foregroundOwnsLocation } from '@/lib/delivery-partner/foreground-location-owner';
import { partnerTrackingApi } from '@/lib/delivery-partner/tracking-api';

type TaskManagerModule = typeof import('expo-task-manager');

/** Expo Go and an older dev build have no ExpoTaskManager native module. */
function loadTaskManager(): TaskManagerModule | null {
  if (!requireOptionalNativeModule('ExpoTaskManager')) return null;
  return require('expo-task-manager') as TaskManagerModule;
}

const tasks = loadTaskManager();

export const TRIP_LOCATION_TASK = 'tokajo-trip-location';

let lastSample: { latitude: number; longitude: number; at: number } | null = null;
let attempt = 0;
let nextAllowedAt = 0;
let flushing = false;

if (tasks) tasks.defineTask(TRIP_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (foregroundOwnsLocation()) return;
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
  for (const pos of locations) {
    const fix = toFix(pos);
    if (!fix || !isUsableAccuracy(fix.accuracy)) continue;
    if (!shouldSampleFix(lastSample, fix)) continue;
    lastSample = { latitude: fix.latitude, longitude: fix.longitude, at: fix.timestamp };
    await enqueueFix(fix);
  }
  await flushQueue();
});

/** Starts the OS task only while the trip is customer-visible. Foreground watch is unchanged. */
export async function syncTripBackgroundLocation(
  status: string | null | undefined,
  online: boolean,
): Promise<void> {
  try {
    if (!online || !isBackgroundTripStatus(status)) {
      await stopTripBackgroundLocation();
      return;
    }
    if (!tasks || Constants.appOwnership === 'expo') return;
    const foreground = await Location.getForegroundPermissionsAsync();
    if (foreground.status !== 'granted') return;
    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== 'granted') return;
    const started = await Location.hasStartedLocationUpdatesAsync(TRIP_LOCATION_TASK);
    if (started) return;
    await Location.startLocationUpdatesAsync(TRIP_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 4_000,
      distanceInterval: 15,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: 'Delivery in progress',
        notificationBody: 'TOKAJO is sharing your location for this trip.',
        notificationColor: '#7A0E22',
        killServiceOnDestroy: false,
      },
    });
  } catch {
    // Expo Go has no background task. The foreground watch keeps running.
  }
}

export async function stopTripBackgroundLocation(): Promise<void> {
  lastSample = null;
  attempt = 0;
  nextAllowedAt = 0;
  if (!tasks) {
    await clearFixQueue().catch(() => undefined);
    return;
  }
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(TRIP_LOCATION_TASK);
    if (started) await Location.stopLocationUpdatesAsync(TRIP_LOCATION_TASK);
  } catch {
    // Task was never registered in this binary.
  }
  await clearFixQueue().catch(() => undefined);
}

async function flushQueue(): Promise<void> {
  if (flushing || Date.now() < nextAllowedAt) return;
  flushing = true;
  try {
    let pending = await takeSendableFixes(Date.now());
    while (pending.length) {
      const next = pending[0]!;
      try {
        await partnerTrackingApi.pushLocation({
          latitude: next.latitude,
          longitude: next.longitude,
          accuracy: next.accuracy,
          speed: next.speed,
          heading: next.heading,
          timestamp: next.timestamp,
        });
        pending = pending.slice(1);
        attempt = 0;
        nextAllowedAt = 0;
        await writeFixQueue(pending);
      } catch {
        attempt += 1;
        nextAllowedAt = Date.now() + nextDelayMs(attempt);
        await writeFixQueue(pending);
        return;
      }
    }
  } finally {
    flushing = false;
  }
}

function toFix(pos: Location.LocationObject): QueuedFix | null {
  const mocked = Boolean(
    (pos as { mocked?: boolean }).mocked ??
      (pos.coords as { mocked?: boolean }).mocked,
  );
  if (mocked) return null;
  const { latitude, longitude, accuracy, speed, heading } = pos.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
  const timestamp = Number.isFinite(pos.timestamp) ? pos.timestamp : Date.now();
  return {
    latitude,
    longitude,
    accuracy: accuracy ?? undefined,
    speed,
    heading,
    timestamp,
  };
}
