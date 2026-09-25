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
 * Clean white auth handoff screen — logo + orange loader.
 */
export function AuthLoadingScreen({
  message = 'Opening your portal…',
  error = false,
  retrying = false,
  onRetry,
}: AuthLoadingScreenProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error && !retrying) {
      spin.stopAnimation();
      return;
    }

    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [error, retrying, spin]);

  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const showLoader = !error || retrying;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.brand}>{BRAND_NAME}</Text>

        {showLoader ? (
          <View style={styles.loaderWrap}>
            <Animated.View
              style={[styles.spinner, { transform: [{ rotate: spinRotate }] }]}
            />
          </View>
        ) : null}

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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  content: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  logo: {
    width: 64,
    height: 64,
  },
  brand: {
    marginTop: 18,
    color: theme.primary,
    fontSize: 20,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.6,
  },
  loaderWrap: {
    marginTop: 28,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FED7AA',
    borderTopColor: theme.primary,
  },
  loadingText: {
    marginTop: 16,
    color: theme.secondaryLight,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.15,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  retryBtn: {
    marginTop: 22,
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
});
