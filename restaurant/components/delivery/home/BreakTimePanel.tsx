import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { dutyStyles as styles } from '@/components/delivery/home/duty-control-styles';

type Props = {
  maxSingleMinutes: number;
  remainingTodayMinutes: number;
  defaultMinutes: number;
  busy?: boolean;
  onStart: (durationMinutes: number) => void;
};

export function breakDurationChoices(
  maxSingle: number,
  remainingToday: number,
  defaultMinutes: number
): number[] {
  const cap = Math.floor(Math.min(maxSingle, remainingToday));
  if (cap < 1) return [];
  const wanted = [Math.round(defaultMinutes) || 15, Math.floor(maxSingle)];
  const choices = wanted.map((m) => Math.min(Math.max(1, m), cap));
  return Array.from(new Set(choices)).sort((a, b) => a - b);
}

export function BreakTimePanel({
  maxSingleMinutes,
  remainingTodayMinutes,
  defaultMinutes,
  busy,
  onStart,
}: Props) {
  const choices = useMemo(
    () =>
      breakDurationChoices(maxSingleMinutes, remainingTodayMinutes, defaultMinutes),
    [maxSingleMinutes, remainingTodayMinutes, defaultMinutes]
  );
  const [selected, setSelected] = useState<number | null>(choices[0] ?? null);

  useEffect(() => {
    if (selected == null || !choices.includes(selected)) {
      setSelected(choices[0] ?? null);
    }
  }, [choices, selected]);

  const blocked = choices.length === 0;
  const minutes = selected ?? choices[0] ?? 0;
  const remaining = Math.max(0, Math.floor(remainingTodayMinutes));

  return (
    <View style={styles.breakBlock}>
      <View style={styles.breakHead}>
        <Text style={styles.breakLabel}>Take a break</Text>
        <Text style={styles.note}>{remaining} min left today</Text>
      </View>
      {blocked ? null : (
        <View style={styles.timeRow}>
          {choices.map((m) => {
            const active = m === minutes;
            return (
              <Pressable
                key={m}
                onPress={() => setSelected(m)}
                disabled={busy}
                style={[styles.timeBtn, active ? styles.timeBtnActive : null]}
              >
                <Text style={[styles.timeValue, active ? styles.timeValueActive : null]}>
                  {m} min
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
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
          ? 'You have used today’s break time. It resets at midnight.'
          : 'Starts now. New orders pause until you end the break or the timer runs out.'}
      </Text>
    </View>
  );
}
