import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from 'react-native';

import { ensureBackgroundLocationPermission } from '@/lib/delivery-partner/background-location-consent';
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
  const ok = await ensureBackgroundLocationPermission('online');
  if (ok) return 'granted';
  const current = await Location.getBackgroundPermissionsAsync();
  return mapBgStatus(current.status);
}

function mapBgStatus(status: string | undefined): PermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

async function requestCamera(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  const next = await ImagePicker.requestCameraPermissionsAsync();
  return mapBgStatus(next.status);
}

async function requestPhotos(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  const next = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return mapBgStatus(next.status);
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
    case 'camera':
      return requestCamera();
    case 'photos':
      return requestPhotos();
    default:
      return 'denied';
  }
}

export async function requestAllAppPermissions(ids: PermissionId[]): Promise<void> {
  for (const id of ids) {
    await requestAppPermission(id);
  }
}
