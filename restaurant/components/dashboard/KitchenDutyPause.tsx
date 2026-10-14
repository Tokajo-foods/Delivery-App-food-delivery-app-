import { Pressable, Text, View, type ReactNode } from 'react-native';

import type { PauseReasonCode } from '@/lib/restaurant/types';

import { styles } from './kitchen-duty-card-styles';

export const PAUSE_MINUTES = [15, 30, 45, 60] as const;

const PAUSE_REASONS: { code: PauseReasonCode; label: string }[] = [
  { code: 'too_busy', label: 'Too busy' },
  { code: 'staffing', label: 'Short staff' },
  { code: 'packaging', label: 'Packing delay' },
  { code: 'closing_soon', label: 'Closing soon' },
  { code: 'other', label: 'Other' },
];

export function pauseReasonLabel(code?: string | null) {
  return PAUSE_REASONS.find((row) => row.code === code)?.label ?? code ?? 'Busy';
}

export function remainingPause(iso?: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'ending now';
  const mins = Math.max(1, Math.ceil(ms / 60_000));
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    return rest ? `${hours}h ${rest}m left` : `${hours}h left`;
  }
  return `${mins} min left`;
}

function DutyButton({
  label,
  onPress,
  disabled,
  icon,
  variant = 'primary',
  compact = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
  compact?: boolean;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          isPrimary ? styles.primaryBtn : styles.secondaryBtn,
          compact && isPrimary ? styles.primaryBtnCompact : null,
          compact && !isPrimary ? styles.secondaryBtnCompact : null,
          disabled ? styles.disabled : null,
        ]}
      >
        {icon}
        <Text
          style={[
            isPrimary ? styles.primaryBtnText : styles.secondaryBtnText,
            compact ? styles.btnTextCompact : null,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

type PauseBodyProps = {
  listingLive: boolean;
  storeOn: boolean;
  paused: boolean;
  pauseOpen: boolean;
  minutes: (typeof PAUSE_MINUTES)[number];
  reason: PauseReasonCode;
  compact: boolean;
  busy: boolean;
  onMinutes: (value: (typeof PAUSE_MINUTES)[number]) => void;
  onReason: (code: PauseReasonCode) => void;
  onPause: () => void;
  onResume: () => void;
};

export function KitchenDutyPauseBody({
  listingLive,
  storeOn,
  paused,
  pauseOpen,
  minutes,
  reason,
  compact,
  busy,
  onMinutes,
  onReason,
  onPause,
  onResume,
}: PauseBodyProps) {
  if (!listingLive || !storeOn) return null;
  if (paused) {
    return (
      <DutyButton
        label="Resume orders"
        compact={compact}
        disabled={busy}
        onPress={onResume}
      />
    );
  }
  if (!pauseOpen) return null;
  return (
    <View style={styles.pauseBox}>
      <Text style={styles.pauseLabel}>Pause for</Text>
      <View style={styles.choiceRow}>
        {PAUSE_MINUTES.map((value) => {
          const active = minutes === value;
          return (
            <Pressable key={value} onPress={() => onMinutes(value)}>
              <View style={[styles.choice, active && styles.choiceOn]}>
                <Text style={[styles.choiceText, active && styles.choiceTextOn]}>
                  {value}m
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.pauseLabel}>Reason</Text>
      <View style={styles.choiceRow}>
        {PAUSE_REASONS.map((row) => {
          const active = reason === row.code;
          return (
            <Pressable key={row.code} onPress={() => onReason(row.code)}>
              <View style={[styles.choice, active && styles.choiceOn]}>
                <Text style={[styles.choiceText, active && styles.choiceTextOn]}>
                  {row.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <DutyButton
        label={`Pause for ${minutes} min`}
        compact={compact}
        disabled={busy}
        onPress={onPause}
      />
    </View>
  );
}
