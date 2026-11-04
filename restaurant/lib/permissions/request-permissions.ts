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
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: 'Microphone for in-app calls',
      message:
        'TOKAJO uses the microphone only during an in-app order call. Your mobile number stays hidden.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
  }
  const webrtc = await import('@livekit/react-native-webrtc');
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
