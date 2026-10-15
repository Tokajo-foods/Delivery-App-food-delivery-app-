import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { dutyStyles as styles } from '@/components/delivery/home/duty-control-styles';

type Props = {
  maxMinutes: number;
  defaultMinutes: number;
  busy?: boolean;
  onStart: (durationMinutes: number) => void;
};

export function BreakTimePanel({ maxMinutes, defaultMinutes, busy, onStart }: Props) {
  const minutes = Math.min(
    Math.max(1, Math.round(defaultMinutes || 15)),
    Math.max(1, Math.round(maxMinutes || 15)),
  );
  const blocked = maxMinutes < 1;

  return (
    <View style={styles.breakBlock}>
      <Pressable
        onPress={() => {
          if (blocked || busy) return;
          onStart(minutes);
        }}
        disabled={busy || blocked}
        style={[styles.startBtn, blocked ? styles.startBtnDisabled : null]}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.startBtnText}>
            {blocked ? 'Break limit reached' : `Start ${minutes}-min break`}
          </Text>
        )}
      </Pressable>
      <Text style={styles.note}>
        {blocked
          ? 'Daily break limit reached.'
          : 'Orders pause until you tap End break or the timer ends.'}
      </Text>
    </View>
  );
}
