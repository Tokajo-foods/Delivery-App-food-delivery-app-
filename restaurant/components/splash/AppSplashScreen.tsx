import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPLASH_DURATION_MS } from '@/lib/splash/cold-start';

const splashArt = require('../../assets/splash-brand.jpg');

type AppSplashScreenProps = {
  onFinished: () => void;
};

/**
 * Full-bleed Tokajo brand splash with a line progress bar (cold start only).
 */
export function AppSplashScreen({ onFinished }: AppSplashScreenProps) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (!finished || finishedRef.current) return;
      finishedRef.current = true;
      onFinished();
    });
    return () => anim.stop();
  }, [onFinished, progress]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root} accessibilityLabel="TOKAJO FOODS loading">
      <StatusBar style="dark" />
      <Image source={splashArt} style={styles.art} resizeMode="cover" />

      <View style={[styles.loaderDock, { paddingBottom: Math.max(insets.bottom, 28) }]}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F7EFE4',
    zIndex: 100,
  },
  art: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  loaderDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  track: {
    width: '100%',
    maxWidth: 220,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(234, 75, 20, 0.18)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#EA4B14',
  },
});
