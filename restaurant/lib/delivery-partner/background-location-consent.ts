import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

/**
 * Play requires this sentence, inside the app, before the system
 * "Allow all the time" dialog. Do not shorten the closed-or-not-in-use line.
 */
export const BACKGROUND_LOCATION_DISCLOSURE = {
  title: 'Allow location all the time',
  body:
    'TOKAJO Delivery collects location data to assign nearby orders and to share your live position with the customer during a delivery, even when the app is closed or not in use.',
  detail:
    'Sharing stays on only while you are online or on a trip. Go offline after the trip ends and sharing stops.',
  allow: 'Allow all the time',
  decline: 'No thanks',
} as const;

export const BACKGROUND_LOCATION_DENIED_MESSAGE =
  'Choose Allow all the time to go online. TOKAJO Delivery collects location even when the app is closed or not in use so nearby orders can reach you and the customer can follow the trip.';

type Presenter = () => Promise<boolean>;

let present: Presenter | null = null;
let pending: Promise<boolean> | null = null;
/** Automatic GPS sync must not pop the disclosure again after No thanks. Go online can ask again. */
let syncSuppressed = false;

export function registerBackgroundLocationDisclosure(presenter: Presenter) {
  present = presenter;
  return () => {
    if (present === presenter) present = null;
  };
}

function canRequestBackground(): boolean {
  return Platform.OS !== 'web' && Constants.appOwnership !== 'expo';
}

/**
 * In-app disclosure, then the system background-location prompt.
 * A No thanks never opens the system dialog.
 * `online` is the rider tapping Go online. `sync` is the GPS service catching up.
 */
export function ensureBackgroundLocationPermission(
  source: 'online' | 'sync'
): Promise<boolean> {
  if (pending) return pending;
  pending = run(source).finally(() => {
    pending = null;
  });
  return pending;
}

async function run(source: 'online' | 'sync'): Promise<boolean> {
  if (!canRequestBackground()) return true;

  const current = await Location.getBackgroundPermissionsAsync();
  if (current.status === 'granted') {
    syncSuppressed = false;
    return true;
  }
  if (source === 'sync' && (syncSuppressed || !current.canAskAgain)) return false;
  if (!present) return false;

  const accepted = await present();
  if (!accepted) {
    syncSuppressed = true;
    return false;
  }
  syncSuppressed = false;

  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    if (!foreground.canAskAgain) {
      await Linking.openSettings();
      return false;
    }
    const asked = await Location.requestForegroundPermissionsAsync();
    if (asked.status !== 'granted') return false;
  }

  const again = await Location.getBackgroundPermissionsAsync();
  if (again.status === 'granted') return true;
  if (!again.canAskAgain) {
    await Linking.openSettings();
    return false;
  }
  const next = await Location.requestBackgroundPermissionsAsync();
  return next.status === 'granted';
}
