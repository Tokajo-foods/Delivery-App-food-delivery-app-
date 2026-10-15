import { ChevronsRight } from 'lucide-react-native';
import { useRef } from 'react';
import { ActivityIndicator, Animated, PanResponder, Text, View } from 'react-native';

type Props = {
  busy: boolean;
  onConfirm: () => void;
};

/** Swipe-to-submit pill used by password sign-in. */
export function SwipeToLogin({ busy, onConfirm }: Props) {
  const busyRef = useRef(busy);
  busyRef.current = busy;
  // Latest handler in a ref so the PanResponder never calls a stale closure.
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;
  const sliderWidthRef = useRef(0);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !busyRef.current,
      onMoveShouldSetPanResponder: () => !busyRef.current,
      onPanResponderMove: (_e, gesture) => {
        if (busyRef.current) return;
        const maxScroll = Math.max(0, sliderWidthRef.current - 56);
        const newX = Math.min(Math.max(gesture.dx, 0), maxScroll);
        pan.setValue({ x: newX, y: 0 });
      },
      onPanResponderRelease: (_e, gesture) => {
        if (busyRef.current) return;
        const threshold = sliderWidthRef.current * 0.65;
        if (gesture.dx > threshold) {
          const maxScroll = Math.max(0, sliderWidthRef.current - 56);
          Animated.timing(pan, {
            toValue: { x: maxScroll, y: 0 },
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            confirmRef.current();
            setTimeout(() => {
              Animated.timing(pan, {
                toValue: { x: 0, y: 0 },
                duration: 300,
                useNativeDriver: true,
              }).start();
            }, 1000);
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View
      onLayout={(e) => {
        sliderWidthRef.current = e.nativeEvent.layout.width;
      }}
      className="bg-[#EA4B14] h-[56px] rounded-full justify-center px-[6px] overflow-hidden relative"
    >
      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <Text className="text-white text-[16px] font-bold text-center tracking-wide">
          {busy ? 'Signing in…' : 'Swipe to Login'}
        </Text>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          { transform: [{ translateX: pan.x }] },
          {
            width: 44,
            height: 44,
            backgroundColor: 'white',
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#EA4B14" />
        ) : (
          <ChevronsRight color="#EA4B14" size={24} />
        )}
      </Animated.View>
    </View>
  );
}
