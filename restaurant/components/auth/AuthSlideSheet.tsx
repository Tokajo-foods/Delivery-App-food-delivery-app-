import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  const [sheetHeight, setSheetHeight] = useState(0);
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

  const dismissHeight = Math.max(0, height - sheetHeight);

  return (
    <View style={styles.fill} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to Get Started"
        onPress={dismiss}
        style={[styles.dismiss, { height: dismissHeight }]}
      />
      <Animated.View
        onLayout={(event) => {
          const next = Math.round(event.nativeEvent.layout.height);
          setSheetHeight((current) => (current === next ? current : next));
        }}
        pointerEvents="auto"
        style={[styles.sheet, { transform: [{ translateY }] }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 20,
    elevation: 24,
  },
  dismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    zIndex: 2,
    elevation: 16,
  },
});
