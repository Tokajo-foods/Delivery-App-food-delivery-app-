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
  type BackgroundLocationMode,
  type QueuedFix,
} from '@/lib/delivery-partner/background-location-policy';
import { ensureBackgroundLocationPermission } from '@/lib/delivery-partner/background-location-consent';
import { foregroundOwnsLocation } from '@/lib/delivery-partner/foreground-location-owner';
import { partnerTrackingApi } from '@/lib/delivery-partner/tracking-api';
import { getApiErrorCode } from '@/lib/errors';

type TaskManagerModule = typeof import('expo-task-manager');

/** Expo Go and an older dev build have no ExpoTaskManager native module. */
function loadTaskManager(): TaskManagerModule | null {
  if (!requireOptionalNativeModule('ExpoTaskManager')) return null;
  return require('expo-task-manager') as TaskManagerModule;
}

const tasks = loadTaskManager();

export const TRIP_LOCATION_TASK = 'tokajo-trip-location';

/** Server rejects these for good; retrying only drains battery. */
const STOP_CODES = new Set(['PARTNER_OFFLINE', 'PARTNER_NOT_ACTIVE', 'UNAUTHORIZED', 'SESSION_EXPIRED']);

let lastSample: { latitude: number; longitude: number; at: number } | null = null;
let attempt = 0;
let nextAllowedAt = 0;
let flushing = false;
let startedMode: BackgroundLocationMode | null = null;
/** After a swipe-kill the JS restarts with no React state, so the last ping decides the cadence. */
let serverTripActive: boolean | null = null;

if (tasks) tasks.defineTask(TRIP_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (foregroundOwnsLocation()) return;
  const mode: BackgroundLocationMode =
    serverTripActive === false ? 'idle' : startedMode ?? 'trip';
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
  for (const pos of locations) {
    const fix = toFix(pos);
    if (!fix || !isUsableAccuracy(fix.accuracy)) continue;
    if (!shouldSampleFix(lastSample, fix, mode)) continue;
    lastSample = { latitude: fix.latitude, longitude: fix.longitude, at: fix.timestamp };
    await enqueueFix(fix);
  }
  await flushQueue();
});

const MODE_OPTIONS: Record<BackgroundLocationMode, Location.LocationTaskOptions> = {
  trip: {
    accuracy: Location.Accuracy.High,
    timeInterval: 4_000,
    distanceInterval: 0,
    foregroundService: {
      notificationTitle: 'Delivery in progress',
      notificationBody: 'TOKAJO is sharing your live location with the customer until this order is complete.',
      notificationColor: '#7A0E22',
      killServiceOnDestroy: false,
    },
  },
  idle: {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10_000,
    distanceInterval: 0,
    foregroundService: {
      notificationTitle: 'You are online',
      notificationBody: 'TOKAJO is finding orders near you. Go offline in the app to stop.',
      notificationColor: '#7A0E22',
      killServiceOnDestroy: false,
    },
  },
};

async function hasBackgroundPermission(): Promise<boolean> {
  return ensureBackgroundLocationPermission('sync');
}

/**
 * Keeps GPS flowing when the app is backgrounded or swiped away:
 * - online, no trip → 10s pings so offers keep matching this rider
 * - accepted → delivered / returned → 4s pings for the customer map
 */
export async function syncTripBackgroundLocation(
  status: string | null | undefined,
  online: boolean,
): Promise<void> {
  try {
    if (!online) {
      await stopTripBackgroundLocation();
      return;
    }
    if (!tasks || Constants.appOwnership === 'expo') return;
    const mode: BackgroundLocationMode = isBackgroundTripStatus(status) ? 'trip' : 'idle';
    serverTripActive = mode === 'trip';
    const foreground = await Location.getForegroundPermissionsAsync();
    if (foreground.status !== 'granted') return;
    if (!(await hasBackgroundPermission())) return;
    const started = await Location.hasStartedLocationUpdatesAsync(TRIP_LOCATION_TASK);
    if (started && startedMode === mode) return;
    if (started) await Location.stopLocationUpdatesAsync(TRIP_LOCATION_TASK);
    await Location.startLocationUpdatesAsync(TRIP_LOCATION_TASK, {
      ...MODE_OPTIONS[mode],
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
    });
    startedMode = mode;
  } catch {
    // Android blocks starting a foreground service from the background; the next foreground sync retries.
  }
}

export async function stopTripBackgroundLocation(): Promise<void> {
  lastSample = null;
  attempt = 0;
  nextAllowedAt = 0;
  startedMode = null;
  serverTripActive = null;
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
        const result = await partnerTrackingApi.pushLocation({
          latitude: next.latitude,
          longitude: next.longitude,
          accuracy: next.accuracy,
          speed: next.speed,
          heading: next.heading,
          timestamp: next.timestamp,
        });
        serverTripActive = Boolean(result.activeDeliveryId);
        pending = pending.slice(1);
        attempt = 0;
        nextAllowedAt = 0;
        await writeFixQueue(pending);
      } catch (error) {
        if (STOP_CODES.has(getApiErrorCode(error) ?? '')) {
          await stopTripBackgroundLocation();
          return;
        }
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
