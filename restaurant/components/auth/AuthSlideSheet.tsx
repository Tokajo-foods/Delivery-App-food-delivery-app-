import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

type Props = {
  children: ReactNode;
  onDismissed: () => void;
};

/** Bottom sheet that slides up over the welcome poster and down to reveal it. */
export function AuthSlideSheet({ children, onDismissed }: Props) {
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;
  const closing = useRef(false);
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const dismiss = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(translateY, {
      toValue: height,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDismissedRef.current();
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to Get Started"
        onPress={dismiss}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="box-none"
        style={[
          StyleSheet.absoluteFillObject,
          { justifyContent: 'flex-end', transform: [{ translateY }] },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}
