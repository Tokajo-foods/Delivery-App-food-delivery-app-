import * as Application from 'expo-application';
import { NativeModules, Platform } from 'react-native';

import { getAuthDeviceId } from '@/lib/auth/device';
import { registerVoipDevice, unregisterVoipDevice } from '@/lib/call/api';
import { handleVoipPush } from '@/lib/call/call-push';

type VoipApp = 'kitchen' | 'rider';
type VoipEvent = { name: string; data: unknown };
type VoipModule = {
  addEventListener: (type: string, handler: (value: unknown) => void) => void;
  registerVoipToken: () => void;
  RNVoipPushRemoteNotificationsRegisteredEvent: string;
  RNVoipPushRemoteNotificationReceivedEvent: string;
};

const UNREGISTER_TIMEOUT_MS = 4000;

let voip: VoipModule | null | undefined;
let started = false;
let token: string | null = null;
let signedInApp: VoipApp | null = null;
let registeredKey: string | null = null;

function load(): VoipModule | null {
  if (voip !== undefined) return voip;
  voip = null;
  if (Platform.OS !== 'ios' || !NativeModules.RNVoipPushNotificationManager) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-voip-push-notification') as { default?: VoipModule } & VoipModule;
    voip = mod.default ?? mod;
  } catch {
    voip = null;
  }
  return voip;
}

async function flush(): Promise<void> {
  const bundleId = Application.applicationId;
  if (!token || !signedInApp || !bundleId) return;
  const key = `${signedInApp}:${token}`;
  if (registeredKey === key) return;
  registeredKey = key;
  try {
    await registerVoipDevice({ voipToken: token, bundleId, app: signedInApp, deviceId: await getAuthDeviceId() });
  } catch {
    registeredKey = null;
  }
}

/**
 * At bundle load. When a VoIP push launches the closed app, native code has already shown
 * CallKit; this hands the call to the engine so answer / decline / remote hang-up work.
 */
export function startVoipPushListener(): void {
  const v = load();
  if (!v || started) return;
  started = true;
  v.addEventListener('register', (value) => {
    if (typeof value === 'string' && value) token = value;
    void flush();
  });
  v.addEventListener('notification', (payload) => {
    void handleVoipPush(payload);
  });
  v.addEventListener('didLoadWithEvents', (value) => {
    const events = Array.isArray(value) ? (value as VoipEvent[]) : [];
    for (const event of events) {
      if (event.name === v.RNVoipPushRemoteNotificationsRegisteredEvent) token = String(event.data);
      else if (event.name === v.RNVoipPushRemoteNotificationReceivedEvent) void handleVoipPush(event.data);
    }
    void flush();
  });
  v.registerVoipToken();
}

/** Signed in → bind this iPhone to the account. Null while signed out. */
export function syncVoipDevice(app: VoipApp | null): void {
  signedInApp = app;
  if (!app) registeredKey = null;
  void flush();
}

/** Call before the session is revoked so a signed-out iPhone stops ringing for this account. */
export async function releaseVoipDevice(): Promise<void> {
  signedInApp = null;
  registeredKey = null;
  if (!token) return;
  await Promise.race([
    unregisterVoipDevice(token),
    new Promise((resolve) => setTimeout(resolve, UNREGISTER_TIMEOUT_MS)),
  ]).catch(() => undefined);
}
