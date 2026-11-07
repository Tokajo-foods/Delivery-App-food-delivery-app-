import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from 'react-native';

import type { PermissionId, PermissionStatus } from '@/lib/permissions/types';

async function requestNotifications(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  const Notifications = await import('expo-notifications');
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  const next = await Notifications.requestPermissionsAsync();
  return next.status === 'granted' ? 'granted' : next.status === 'denied' ? 'denied' : 'undetermined';
}

async function requestMicrophone(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  if (Platform.OS === 'android') {
    const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (already) return 'granted';
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
  }
  const webrtc = await import('@livekit/react-native-webrtc');
  try {
    const current = await webrtc.permissions.query({ name: 'microphone' });
    const state =
      current && typeof current === 'object' && 'state' in current
        ? String((current as { state: unknown }).state)
        : String(current);
    if (state === 'granted') return 'granted';
  } catch {
    // Fall through and let the system dialog decide.
  }
  const result: unknown = await webrtc.permissions.request({ name: 'microphone' });
  const status =
    result && typeof result === 'object' && 'status' in result
      ? String((result as { status: unknown }).status)
      : String(result);
  if (result === true || status === 'granted') return 'granted';
  return status === 'denied' ? 'denied' : 'undetermined';
}

async function requestForegroundLocation(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  const next = await Location.requestForegroundPermissionsAsync();
  return next.status === 'granted' ? 'granted' : next.status === 'denied' ? 'denied' : 'undetermined';
}

async function requestBackgroundLocation(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    const ask = await Location.requestForegroundPermissionsAsync();
    if (ask.status !== 'granted') {
      return ask.status === 'denied' ? 'denied' : 'undetermined';
    }
  }
  const current = await Location.getBackgroundPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  const next = await Location.requestBackgroundPermissionsAsync();
  return next.status === 'granted' ? 'granted' : next.status === 'denied' ? 'denied' : 'undetermined';
}

/** System location dialog only when access is still off, or device location is switched off. */
export async function requestLocationIfOff(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status !== 'granted') {
    return requestForegroundLocation();
  }
  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn && Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // The system dialog was dismissed.
    }
  }
  return 'granted';
}

export async function requestAppPermission(id: PermissionId): Promise<PermissionStatus> {
  switch (id) {
    case 'notifications':
      return requestNotifications();
    case 'microphone':
      return requestMicrophone();
    case 'location':
      return requestForegroundLocation();
    case 'locationBackground':
      return requestBackgroundLocation();
    default:
      return 'denied';
  }
}

export async function requestAllAppPermissions(ids: PermissionId[]): Promise<void> {
  for (const id of ids) {
    await requestAppPermission(id);
  }
}
