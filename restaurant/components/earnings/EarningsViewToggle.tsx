import { BookOpenText, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export type EarningsView = 'earnings' | 'passbook';

const VIEWS: { key: EarningsView; label: string; icon: LucideIcon }[] = [
  { key: 'earnings', label: 'Earnings', icon: TrendingUp },
  { key: 'passbook', label: 'Passbook', icon: BookOpenText },
];

const PAD = 4;

export function EarningsViewToggle({
  value,
  onChange,
}: {
  value: EarningsView;
  onChange: (next: EarningsView) => void;
}) {
  const [width, setWidth] = useState(0);
  const index = VIEWS.findIndex((v) => v.key === value);
  const slide = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: index,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, slide]);

  const segment = width > 0 ? (width - PAD * 2) / VIEWS.length : 0;

  return (
    <View
      style={styles.track}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segment > 0 ? (
        <Animated.View
          style={[
            styles.pill,
            {
              width: segment,
              transform: [
                { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, segment] }) },
              ],
            },
          ]}
        />
      ) : null}
      {VIEWS.map((v) => {
        const on = v.key === value;
        const Icon = v.icon;
        return (
          <Pressable
            key={v.key}
            onPress={() => onChange(v.key)}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Icon color={on ? '#FFFFFF' : authTheme.textMuted} size={16} strokeWidth={2.4} />
            <Text style={[styles.label, on && styles.labelOn]}>{v.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: PAD,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pill: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: 12,
    backgroundColor: authTheme.brand,
    shadowColor: authTheme.brand,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
  },
  label: { fontFamily: fonts.semiBold, fontSize: 14, color: authTheme.textMuted },
  labelOn: { fontFamily: fonts.bold, color: '#FFFFFF' },
});
