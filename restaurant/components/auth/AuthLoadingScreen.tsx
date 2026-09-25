import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { fonts } from '@/constants/typography';
import { BRAND_NAME, theme } from '@/constants/theme';

const logo = require('../../assets/tokajo-logo.png');

type AuthLoadingScreenProps = {
  message?: string;
  error?: boolean;
  retrying?: boolean;
  onRetry?: () => void;
};

/**
 * Brand-orange full-screen loader for auth handoffs (signup → sign in, etc.).
 * Soft pulse ring only — no layout remount animations.
 */
export function AuthLoadingScreen({
  message = 'Opening your portal…',
  error = false,
  retrying = false,
  onRetry,
}: AuthLoadingScreenProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error && !retrying) {
      pulse.stopAnimation();
      spin.stopAnimation();
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    spinLoop.start();
    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [error, retrying, pulse, spin]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.15],
  });
  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const showLoader = !error || retrying;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.content}>
        <View style={styles.logoStage}>
          {showLoader ? (
            <>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    opacity: ringOpacity,
                    transform: [{ scale: ringScale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.spinRing,
                  { transform: [{ rotate: spinRotate }] },
                ]}
              />
            </>
          ) : null}

          <View style={styles.logoWrap}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        <Text style={styles.brand}>{BRAND_NAME}</Text>
        <Text style={styles.loadingText}>{message}</Text>

        {error && onRetry ? (
          <Pressable
            onPress={onRetry}
            disabled={retrying}
            style={styles.retryBtn}
          >
            <Text style={styles.retryLabel}>
              {retrying ? 'Retrying…' : 'Try again'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoStage: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  spinRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    borderTopColor: '#FFFFFF',
    borderRightColor: 'rgba(255,255,255,0.55)',
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  logo: {
    width: 68,
    height: 68,
  },
  brand: {
    marginTop: 22,
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.8,
  },
  loadingText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  retryBtn: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryLabel: {
    color: theme.primary,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
});
