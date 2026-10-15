import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ActiveTripSession } from '@/components/delivery/orders/ActiveTripSession';
import { RiderLiveToasts } from '@/components/delivery/shared/RiderLiveToasts';
import { refreshCsrfToken } from '@/lib/api';
import { ensureDeviceNotificationReady } from '@/lib/notification/device-alerts';

/**
 * Trip session, offer sheet, and toasts for delivery routes.
 * The app-root RiderLiveSync already owns the socket and GPS ping.
 */
export function DeliveryLiveSync({ enabled }: { enabled: boolean }) {

  useEffect(() => {
    if (!enabled) return;
    void refreshCsrfToken(true).catch(() => undefined);
    if (Platform.OS !== 'web') {
      void ensureDeviceNotificationReady();
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <ActiveTripSession />
      <RiderLiveToasts />
    </View>
  );
}
