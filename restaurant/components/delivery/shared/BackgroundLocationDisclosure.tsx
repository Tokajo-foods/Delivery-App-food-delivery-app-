import { LinearGradient } from 'expo-linear-gradient';
import { MapPin } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  BACKGROUND_LOCATION_DISCLOSURE,
  registerBackgroundLocationDisclosure,
} from '@/lib/delivery-partner/background-location-consent';
import { LEGAL_URLS } from '@/lib/legal/urls';

function Backdrop() {
  return (
    <>
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.45)', 'rgba(15, 23, 42, 0.78)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.dimVeil} pointerEvents="none" />
    </>
  );
}

/**
 * Play-required disclosure before background location. Fits content — no scroll.
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

  const footerPad = Math.max(insets.bottom, 10);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => finish(false)}
    >
      <View style={styles.root}>
        <Backdrop />

        <View style={[styles.sheet, { marginBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <MapPin color={authTheme.brand} size={26} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{BACKGROUND_LOCATION_DISCLOSURE.title}</Text>
            <Text style={styles.body}>{BACKGROUND_LOCATION_DISCLOSURE.body}</Text>
            <Text style={styles.noteText}>{BACKGROUND_LOCATION_DISCLOSURE.detail}</Text>
          </View>

          <View style={[styles.footer, { paddingBottom: footerPad }]}>
            <PrimaryButton
              label={BACKGROUND_LOCATION_DISCLOSURE.allow}
              onPress={() => finish(true)}
            />
            <Pressable
              onPress={() => finish(false)}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{BACKGROUND_LOCATION_DISCLOSURE.decline}</Text>
            </Pressable>
            <Pressable onPress={() => void Linking.openURL(LEGAL_URLS.privacy)} accessibilityRole="link">
              <Text style={styles.link}>Privacy policy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
  },
  dimVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 4,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#374151',
  },
  noteText: {
    marginTop: 10,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 17,
    color: '#9A3412',
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1EAE3',
    backgroundColor: '#FFFFFF',
  },
  secondary: {
    minHeight: 40,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  secondaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#4B5563',
  },
  link: {
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.brand,
    paddingVertical: 4,
  },
});
