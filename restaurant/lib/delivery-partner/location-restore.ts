import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

import { ensureBackgroundLocationPermission } from '@/lib/delivery-partner/background-location-consent';
import { askToEnableLocation } from '@/lib/delivery-partner/live-place';
import type { LocationLockReason } from '@/lib/delivery-partner/live-place-store';

/** Background "Allow all the time" is only enforceable in a dev / store build, not Expo Go. */
function canCheckBackground(): boolean {
  return Platform.OS !== 'web' && Constants.appOwnership !== 'expo';
}

/** First thing blocking live location, or null when GPS, permission and (on a trip) background are fine. */
export async function readLocationLock(onTrip: boolean): Promise<LocationLockReason | null> {
  const servicesOn = await Location.hasServicesEnabledAsync().catch(() => false);
  if (!servicesOn) return 'services';
  const foreground = await Location.getForegroundPermissionsAsync().catch(() => null);
  if (foreground?.status !== 'granted') return 'permission';
  if (!onTrip || !canCheckBackground()) return null;
  const background = await Location.getBackgroundPermissionsAsync().catch(() => null);
  if (background && background.status !== 'granted') return 'background';
  return null;
}

/** Opens the system prompt that fixes `reason`, falling back to app settings. */
export async function restoreLocationAccess(reason: LocationLockReason): Promise<boolean> {
  if (reason === 'services') return askToEnableLocation();
  if (reason === 'background') return ensureBackgroundLocationPermission('online');
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === 'granted') return true;
    if (current.canAskAgain) {
      const next = await Location.requestForegroundPermissionsAsync();
      if (next.status === 'granted') return true;
    }
  } catch {
    // Fall through to settings.
  }
  await Linking.openSettings();
  return false;
}
