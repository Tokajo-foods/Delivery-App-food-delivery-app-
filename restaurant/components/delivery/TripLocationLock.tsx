import { MapPinOff } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import {
  patchLivePlace,
  useLivePlaceSnapshot,
  type LocationLockReason,
} from '@/lib/delivery-partner/live-place-store';
import { restoreLocationAccess } from '@/lib/delivery-partner/location-restore';

const COPY: Record<LocationLockReason, { title: string; body: string; action: string }> = {
  services: {
    title: 'Turn on location',
    body: 'Your phone location is off. The customer is tracking this order live, so location must stay on until it is delivered.',
    action: 'Turn on location',
  },
  permission: {
    title: 'Allow location access',
    body: 'TOKAJO no longer has location permission. Allow it to continue this order.',
    action: 'Allow location',
  },
  background: {
    title: 'Allow location all the time',
    body: 'TOKAJO Delivery collects location data to share your live position with the customer during this delivery, even when the app is closed or not in use.',
    action: 'Continue',
  },
};

/**
 * Blocks the rider app during an accepted trip while GPS / permission is off.
 * It cannot be dismissed; it clears itself once `useAutoLivePlace` sees location back.
 */
export function TripLocationLock({ onTrip }: { onTrip: boolean }) {
  const { lockReason } = useLivePlaceSnapshot();
  const [busy, setBusy] = useState(false);
  const reason = onTrip ? lockReason : null;
  if (!reason) return null;
  const copy = COPY[reason];

  const onFix = async () => {
    setBusy(true);
    try {
      const fixed = await restoreLocationAccess(reason);
      if (fixed) patchLivePlace({ lockReason: null, servicesOn: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => undefined}>
      <View style={styles.screen}>
        <View style={styles.iconWrap}>
          <MapPinOff color="#EA4B14" size={44} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <View style={styles.note}>
          <Text style={styles.noteText}>
            You cannot go offline or turn location off until this order is complete.
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={() => void onFix()}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>{copy.action}</Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    textAlign: 'center',
  },
  note: {
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  noteText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
    textAlign: 'center',
  },
  primary: {
    alignSelf: 'stretch',
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#EA4B14',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
