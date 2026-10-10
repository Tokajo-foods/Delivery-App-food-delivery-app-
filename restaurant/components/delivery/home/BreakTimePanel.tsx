import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { dutyStyles as styles } from '@/components/delivery/home/duty-control-styles';

type Props = {
  maxMinutes: number;
  defaultMinutes: number;
  busy?: boolean;
  onStart: (durationMinutes: number) => void;
};

function clockLabel(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function BreakTimePanel({ maxMinutes, defaultMinutes, busy, onStart }: Props) {
  const [open, setOpen] = useState(false);
  const [fromTime, setFromTime] = useState(() => new Date());
  const [toTime, setToTime] = useState(() => addMinutes(new Date(), defaultMinutes));
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);

  const spanMinutes = Math.max(1, Math.round((toTime.getTime() - fromTime.getTime()) / 60_000));
  const breakMinutes = Math.min(spanMinutes, Math.max(maxMinutes, 1));

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    const which = picking;
    setPicking(null);
    if (event.type === 'dismissed' || !date || !which) return;
    if (which === 'from') {
      setFromTime(date);
      if (toTime.getTime() <= date.getTime()) setToTime(addMinutes(date, defaultMinutes));
      return;
    }
    setToTime(date.getTime() <= fromTime.getTime() ? addMinutes(fromTime, defaultMinutes) : date);
  };

  return (
    <View style={styles.breakBlock}>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.breakHead}>
        <Text style={styles.breakLabel}>Break</Text>
        <Text style={styles.note}>{open ? 'Hide' : 'Set time'}</Text>
      </Pressable>
      {open && maxMinutes < 1 ? (
        <Text style={styles.note}>Daily break limit reached.</Text>
      ) : null}
      {open && maxMinutes >= 1 ? (
        <>
          <View style={styles.timeRow}>
            <Pressable onPress={() => setPicking('from')} style={styles.timeBtn}>
              <Text style={styles.timeCaption}>From</Text>
              <Text style={styles.timeValue}>{clockLabel(fromTime)}</Text>
            </Pressable>
            <Pressable onPress={() => setPicking('to')} style={styles.timeBtn}>
              <Text style={styles.timeCaption}>To</Text>
              <Text style={styles.timeValue}>{clockLabel(toTime)}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => onStart(breakMinutes)} disabled={busy} style={styles.startBtn}>
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.startBtnText}>Start break</Text>
            )}
          </Pressable>
          <Text style={styles.note}>
            {spanMinutes > maxMinutes
              ? `Longest break right now is ${maxMinutes} min.`
              : 'Starts when you tap. Orders pause until the end time.'}
          </Text>
        </>
      ) : null}
      {picking ? (
        <DateTimePicker
          value={picking === 'from' ? fromTime : toTime}
          mode="time"
          is24Hour={false}
          onChange={onPick}
        />
      ) : null}
    </View>
  );
}
