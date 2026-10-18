import { Alert, Platform } from 'react-native';

import { canUseFullScreenIntent, openFullScreenIntentSettings } from '@/modules/tokajo-call-lock';
import { storageGetItem, storageSetItem } from '@/lib/storage';

const ASKED_KEY = 'call_full_screen_permission_asked_v1';

/**
 * Android 14+ can block full-screen alerts; calls then only show as a banner on the lock
 * screen. Ask once to turn it back on.
 */
export async function askFullScreenCallPermissionOnce(): Promise<void> {
  if (Platform.OS !== 'android' || canUseFullScreenIntent()) return;
  if (await storageGetItem(ASKED_KEY)) return;
  await storageSetItem(ASKED_KEY, '1');
  Alert.alert(
    'Show calls on the lock screen',
    'Allow TOKAJO to show full-screen calls so order calls ring like a normal phone call, even when the phone is locked.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Allow', onPress: () => void openFullScreenIntentSettings() },
    ],
  );
}
