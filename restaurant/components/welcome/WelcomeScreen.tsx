import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO = require('../../assets/welcome/tokajo-get-started.jpg');

type Props = {
  onGetStarted?: () => void;
};

/**
 * Logged-out start art. The painted Get Started pill is the only control;
 * a transparent hit target sits on top of it.
 */
export function WelcomeScreen({ onGetStarted }: Props) {
  const router = useRouter();
  const { height: screenH, width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
      return;
    }
    router.replace('/login?form=1');
  };

  const hitHeight = Math.max(72, Math.min(96, screenH * 0.1));
  const hitBottom = Math.max(insets.bottom + 18, screenH * 0.045);
  const hitSide = Math.max(18, screenW * 0.07);

  return (
    <View style={styles.root}>
      <Image
        source={HERO}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        contentPosition="bottom"
        accessibilityIgnoresInvertColors
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Get Started"
        onPress={handleGetStarted}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        style={[
          styles.getStartedHit,
          {
            height: hitHeight,
            bottom: hitBottom,
            left: hitSide,
            right: hitSide,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F0E8',
  },
  getStartedHit: {
    position: 'absolute',
    zIndex: 10,
    borderRadius: 40,
  },
});
