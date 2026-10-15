import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';

type Tone = 'neutral' | 'on' | 'accept' | 'end';

type Props = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  tone?: Tone;
  size?: number;
  busy?: boolean;
  disabled?: boolean;
};

const BG: Record<Tone, string> = {
  neutral: 'rgba(255,255,255,0.12)',
  on: '#E9EDEF',
  accept: '#1DAA61',
  end: '#EA4335',
};

/** Round call button with a caption, WhatsApp style. */
export function CallControl({ label, icon, onPress, tone = 'neutral', size = 64, busy, disabled }: Props) {
  return (
    <View style={styles.slot}>
      <Pressable
        onPress={onPress}
        disabled={disabled || busy}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.btn,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: BG[tone] },
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        {busy ? <ActivityIndicator color={tone === 'on' ? '#0B141A' : '#FFFFFF'} /> : icon}
      </Pressable>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center', minWidth: 84, gap: 10 },
  btn: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.4 },
  label: { fontFamily: fonts.medium, fontSize: 13, color: '#D1D7DB' },
});
