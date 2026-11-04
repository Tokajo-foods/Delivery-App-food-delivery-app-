import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from 'react-native';

import { permissionCatalog } from '@/lib/permissions/catalog';
import type {
  PermissionId,
  PermissionSnapshot,
  PermissionStatus,
} from '@/lib/permissions/types';

function mapExpoStatus(status: string | undefined): PermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

async function readNotifications(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  const Notifications = await import('expo-notifications');
  const current = await Notifications.getPermissionsAsync();
  return mapExpoStatus(current.status);
}

async function readMicrophone(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  if (Platform.OS === 'android') {
    const ok = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    return ok ? 'granted' : 'undetermined';
  }
  try {
    const webrtc = await import('@livekit/react-native-webrtc');
    const result = await webrtc.permissions.query({ name: 'microphone' });
    const state =
      result && typeof result === 'object' && 'state' in result
        ? String((result as { state: unknown }).state)
        : String(result);
    if (state === 'granted') return 'granted';
    if (state === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

async function readForegroundLocation(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  const current = await Location.getForegroundPermissionsAsync();
  return mapExpoStatus(current.status);
}

async function readBackgroundLocation(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'granted';
  const current = await Location.getBackgroundPermissionsAsync();
  return mapExpoStatus(current.status);
}

async function readOne(id: PermissionId): Promise<PermissionStatus> {
  switch (id) {
    case 'notifications':
      return readNotifications();
    case 'microphone':
      return readMicrophone();
    case 'location':
      return readForegroundLocation();
    case 'locationBackground':
      return readBackgroundLocation();
    default:
      return 'denied';
  }
}

export async function snapshotAppPermissions(options?: {
  includeRiderBackground?: boolean;
}): Promise<PermissionSnapshot[]> {
  const catalog = permissionCatalog(options);
  const rows = await Promise.all(
    catalog.map(async (def) => {
      const status = await readOne(def.id);
      return {
        ...def,
        status,
        blocked: status === 'denied',
      };
    }),
  );
  return rows;
}

export function allPermissionsGranted(rows: PermissionSnapshot[]): boolean {
  return rows.every((row) => row.status === 'granted');
}
