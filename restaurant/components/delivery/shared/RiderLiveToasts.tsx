import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  dismissLiveToast,
  subscribeLiveToasts,
  type LiveToast,
} from '@/lib/delivery-partner/live-toast-store';

export function RiderLiveToasts() {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<LiveToast[]>([]);

  useEffect(() => subscribeLiveToasts(setToasts), []);

  if (!toasts.length) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }]}>
      {toasts.map((toast) => (
        <Pressable
          key={toast.id}
          onPress={() => dismissLiveToast(toast.id)}
          style={[styles.card, toast.tone === 'warn' && styles.warn]}
        >
          <Text style={styles.title}>{toast.title}</Text>
          <Text style={styles.body}>{toast.body}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 80,
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3D2C4',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  warn: { borderColor: '#FDBA74' },
  title: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: authTheme.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
  },
});
