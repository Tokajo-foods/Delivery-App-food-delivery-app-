import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type CallLockModule = {
  setShowWhenLocked: (on: boolean) => void;
  isDeviceLocked: () => boolean;
  canUseFullScreenIntent: () => boolean;
  openFullScreenIntentSettings: () => boolean;
};

/** Null on iOS, web, and builds made before this module existed. */
const native = Platform.OS === 'android' ? requireOptionalNativeModule<CallLockModule>('TokajoCallLock') : null;

/** Let the call screen show over the lock screen. Turn off as soon as the call is over. */
export function setCallShowWhenLocked(on: boolean): void {
  try {
    native?.setShowWhenLocked(on);
  } catch {
    // Older build without the module.
  }
}

export function isDeviceLocked(): boolean {
  try {
    return native?.isDeviceLocked() ?? false;
  } catch {
    return false;
  }
}

export function canUseFullScreenIntent(): boolean {
  try {
    return native?.canUseFullScreenIntent() ?? true;
  } catch {
    return true;
  }
}

export function openFullScreenIntentSettings(): boolean {
  try {
    return native?.openFullScreenIntentSettings() ?? false;
  } catch {
    return false;
  }
}
