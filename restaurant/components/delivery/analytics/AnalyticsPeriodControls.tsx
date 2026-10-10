import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { analyticsPageStyles as styles } from '@/components/delivery/analytics/analytics-page-styles';
import {
  dateKey,
  keyToDate,
  prettyDate,
  type AnalyticsMode,
} from '@/components/delivery/analytics/analytics-range';

const MODES: { id: AnalyticsMode; label: string }[] = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'range', label: 'Dates' },
];

export function AnalyticsPeriodControls({
  mode,
  onMode,
  from,
  to,
  onFrom,
  onTo,
}: {
  mode: AnalyticsMode;
  onMode: (mode: AnalyticsMode) => void;
  from: string;
  to: string;
  onFrom: (key: string) => void;
  onTo: (key: string) => void;
}) {
  return (
    <View style={styles.controls}>
      <View style={styles.segment}>
        {MODES.map((item) => {
          const on = mode === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onMode(item.id)}
              style={[styles.segmentBtn, on && styles.segmentOn]}
            >
              <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {mode === 'range' ? (
        <View style={styles.rangeRow}>
          <DateField label="From" value={from} maximum={to} onChange={onFrom} />
          <View style={styles.rangeRule} />
          <DateField label="To" value={to} minimum={from} onChange={onTo} />
        </View>
      ) : null}
    </View>
  );
}

function DateField({
  label,
  value,
  minimum,
  maximum,
  onChange,
}: {
  label: string;
  value: string;
  minimum?: string;
  maximum?: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = keyToDate(value);

  const apply = (next?: Date) => {
    setOpen(false);
    if (!next) return;
    onChange(dateKey(next));
  };

  return (
    <View style={styles.dateField}>
      <Text style={styles.dateLabel}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="compact"
          minimumDate={minimum ? keyToDate(minimum) : undefined}
          maximumDate={maximum ? keyToDate(maximum) : new Date()}
          onChange={(_, next) => apply(next)}
          accentColor="#EA4B14"
        />
      ) : (
        <>
          <Pressable onPress={() => setOpen(true)} style={styles.dateBtn}>
            <Text style={styles.dateValue}>{prettyDate(value)}</Text>
          </Pressable>
          {open ? (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={minimum ? keyToDate(minimum) : undefined}
              maximumDate={maximum ? keyToDate(maximum) : new Date()}
              onChange={(_, next) => apply(next)}
            />
          ) : null}
        </>
      )}
    </View>
  );
}
