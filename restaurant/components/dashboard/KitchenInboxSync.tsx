import { useKitchenNotificationSync } from '@/lib/restaurant/use-kitchen-notification-sync';

/** Polls kitchen inbox and presents tray alerts in native/dev builds. */
export function KitchenInboxSync() {
  useKitchenNotificationSync(true);
  return null;
}
