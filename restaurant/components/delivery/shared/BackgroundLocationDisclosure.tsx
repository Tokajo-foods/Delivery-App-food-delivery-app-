import { MapPin } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/constants/typography';
import {
  BACKGROUND_LOCATION_DISCLOSURE,
  registerBackgroundLocationDisclosure,
} from '@/lib/delivery-partner/background-location-consent';
import { LEGAL_URLS } from '@/lib/legal/urls';

/**
 * Full-screen consent shown before Android's "Allow all the time" dialog.
 * Mount once while a delivery partner is signed in.
 */
export function BackgroundLocationDisclosure() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const decideRef = useRef<((accepted: boolean) => void) | null>(null);

  useEffect(() => {
    return registerBackgroundLocationDisclosure(
      () =>
        new Promise<boolean>((resolve) => {
          decideRef.current = resolve;
          setVisible(true);
        })
    );
  }, []);

  const finish = (accepted: boolean) => {
    setVisible(false);
    const decide = decideRef.current;
    decideRef.current = null;
    decide?.(accepted);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => finish(false)}
    >
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.iconWrap}>
          <MapPin color="#EA4B14" size={40} />
        </View>
        <Text style={styles.title}>{BACKGROUND_LOCATION_DISCLOSURE.title}</Text>
        <Text style={styles.body}>{BACKGROUND_LOCATION_DISCLOSURE.body}</Text>
        <View style={styles.note}>
          <Text style={styles.noteText}>{BACKGROUND_LOCATION_DISCLOSURE.detail}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            onPress={() => finish(true)}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>{BACKGROUND_LOCATION_DISCLOSURE.allow}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            onPress={() => finish(false)}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>{BACKGROUND_LOCATION_DISCLOSURE.decline}</Text>
          </Pressable>
          <Pressable
            onPress={() => void Linking.openURL(LEGAL_URLS.privacy)}
            accessibilityRole="link"
          >
            <Text style={styles.link}>Privacy policy</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    lineHeight: 32,
    color: '#111827',
  },
  body: {
    marginTop: 14,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  note: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: '#9A3412',
  },
  actions: {
    marginTop: 'auto',
    gap: 10,
  },
  primary: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#EA4B14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  primaryText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#4B5563',
  },
  link: {
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#EA4B14',
    paddingVertical: 8,
  },
});
