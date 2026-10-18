import { releaseVoipDevice } from '@/lib/call/voip-push';
import { getNotificationsModule } from '@/lib/notification/device-alerts';
import { stopOrderBell } from '@/lib/notification/order-bell-loop';
import {
  clearStoredKitchenDevice,
  kitchenInboxApi,
  loadStoredKitchenDevice,
} from '@/lib/restaurant/inbox-api';
import { userAccountApi } from '@/lib/user/account-api';
import { clearStoredPushDevice, loadStoredPushDevice } from '@/lib/user/push-token';

const TIMEOUT_MS = 4000;

function withTimeout<T>(work: Promise<T>): Promise<T | void> {
  return Promise.race([work, new Promise<void>((resolve) => setTimeout(resolve, TIMEOUT_MS))]);
}

/**
 * Call while the session is still valid, so a signed-out phone stops receiving the outlet's
 * order bell and alerts. Never blocks logout for more than a few seconds.
 */
export async function unregisterKitchenPush(): Promise<void> {
  stopOrderBell();
  const [outlet, account] = await Promise.all([
    loadStoredKitchenDevice().catch(() => null),
    loadStoredPushDevice().catch(() => null),
  ]);
  await withTimeout(
    Promise.allSettled([
      outlet ? kitchenInboxApi.unregisterDevice(outlet.restaurantId, outlet.deviceId) : Promise.resolve(),
      account ? userAccountApi.unregisterDevice(account.deviceId) : Promise.resolve(),
      releaseVoipDevice(),
    ])
  );
  await Promise.allSettled([clearStoredKitchenDevice(), clearStoredPushDevice()]);
  await getNotificationsModule()?.setBadgeCountAsync(0).catch(() => undefined);
}
