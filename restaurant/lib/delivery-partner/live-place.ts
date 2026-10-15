import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

import { reverseGeocodeAddress } from '@/lib/address/search';
import {
  getLivePlaceSnapshot,
  patchLivePlace,
} from '@/lib/delivery-partner/live-place-store';
import { stripPlusCodes } from '@/lib/location/parse-address';

export type GpsRead =
  | { ok: true; latitude: number; longitude: number; accuracy: number | null }
  | { ok: false; reason: 'permission' | 'services' | 'fix' };

export async function readAccurateGps(): Promise<GpsRead> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return { ok: false, reason: 'permission' };

  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) return { ok: false, reason: 'services' };

  let best: Location.LocationObject | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      mayShowUserSettingsDialog: true,
    });
    const accuracy = pos.coords.accuracy ?? 9999;
    if (!best || accuracy < (best.coords.accuracy ?? 9999)) best = pos;
    if (accuracy <= 25) break;
  }

  if (!best) return { ok: false, reason: 'fix' };
  const { latitude, longitude, accuracy } = best.coords;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    (latitude === 0 && longitude === 0)
  ) {
    return { ok: false, reason: 'fix' };
  }
  return { ok: true, latitude, longitude, accuracy: accuracy ?? null };
}

export async function labelForCoords(latitude: number, longitude: number) {
  const geo = await reverseGeocodeAddress({ lat: latitude, lng: longitude });
  const formatted = stripPlusCodes(geo?.formattedAddress?.trim() ?? '');
  if (!formatted) return 'Current location';
  return formatted;
}

export function metersBetween(
  lat1?: number | null,
  lng1?: number | null,
  lat2?: number | null,
  lng2?: number | null
) {
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return Number.POSITIVE_INFINITY;
  }
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** One-shot GPS + address for the header Update button. */
export async function refreshLivePlaceNow(): Promise<
  | { ok: true; latitude: number; longitude: number; label: string }
  | { ok: false; reason: 'permission' | 'services' | 'fix' }
> {
  patchLivePlace({ locating: true });
  const read = await readAccurateGps();
  if (!read.ok) {
    patchLivePlace({
      locating: false,
      servicesOn: read.reason !== 'fix',
    });
    return read;
  }
  const prev = getLivePlaceSnapshot();
  const label = await labelForCoords(read.latitude, read.longitude);
  patchLivePlace({
    label: label || prev.label,
    latitude: read.latitude,
    longitude: read.longitude,
    locating: false,
    servicesOn: true,
  });
  return {
    ok: true,
    latitude: read.latitude,
    longitude: read.longitude,
    label: label || prev.label || 'Current location',
  };
}

/** System location dialog on Android, settings alert on iOS. */
export async function askToEnableLocation(): Promise<boolean> {
  if (await Location.hasServicesEnabledAsync()) return true;

  if (Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // fall through to the settings alert
    }
    if (await Location.hasServicesEnabledAsync()) return true;
  }

  return new Promise((resolve) => {
    Alert.alert(
      'Turn on location',
      'Your location is off. Turn it on so Tokajo can show where you actually are.',
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Open settings',
          onPress: () => {
            void Linking.openSettings();
            resolve(false);
          },
        },
      ]
    );
  });
}
