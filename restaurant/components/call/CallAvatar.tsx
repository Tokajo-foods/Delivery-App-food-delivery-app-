import { Image } from 'expo-image';
import { Bike, Store, User } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import type { CallRole } from '@/lib/call/types';
import { fonts } from '@/constants/typography';

type Props = {
  name: string;
  role: CallRole;
  logoUrl?: string | null;
  pulsing: boolean;
  size?: number;
};

function RoleIcon({ role, size }: { role: CallRole; size: number }) {
  if (role === 'rider') return <Bike color="#E9EDEF" size={size} strokeWidth={1.8} />;
  if (role === 'restaurant') return <Store color="#E9EDEF" size={size} strokeWidth={1.8} />;
  return <User color="#E9EDEF" size={size} strokeWidth={1.8} />;
}

/** Logo / initial with a soft ring pulse while the call is ringing. */
export function CallAvatar({ name, role, logoUrl, pulsing, size = 120 }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulsing) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, pulsing]);

  const ring = {
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
  };
  const uri = logoUrl?.trim() || '';
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View style={{ width: size * 1.7, height: size * 1.7, alignItems: 'center', justifyContent: 'center' }}>
      {pulsing ? <Animated.View style={[styles.ring, ring]} /> : null}
      <View style={[styles.face, { width: size, height: size, borderRadius: size / 2 }]}>
        {uri ? (
          <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={120} />
        ) : initial && /[A-Z]/.test(initial) ? (
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
        ) : (
          <RoleIcon role={role} size={size * 0.42} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', backgroundColor: '#25D366' },
  face: {
    backgroundColor: '#233138',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  initial: { fontFamily: fonts.bold, color: '#E9EDEF' },
});
