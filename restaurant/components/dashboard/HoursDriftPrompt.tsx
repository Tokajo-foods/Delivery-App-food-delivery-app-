import { Clock3 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { hoursDriftStyles as styles } from '@/components/dashboard/hours-drift-prompt-styles';
import { getApiErrorMessage } from '@/lib/errors';
import { useMyRestaurantId } from '@/lib/order/hooks';
import {
  detectHoursDrift,
  formatHoursClock,
  slotsAfterDriftEdit,
  type HoursDrift,
} from '@/lib/restaurant/hours-drift';
import {
  useKitchenDuty,
  useOutletCalendarMutations,
  useOutletSpecialHours,
  useOutletTimings,
} from '@/lib/restaurant/hooks';
import { isListingLive } from '@/lib/restaurant/listing-status';
import { useRestaurantSettingsMutations } from '@/lib/restaurant/settings-hooks';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function driftMessage(drift: HoursDrift): string {
  if (drift.kind === 'early' && drift.scheduledOpen) {
    return `You're open before your scheduled hours (${formatHoursClock(drift.scheduledOpen)}). Please update your operational timing. The new hours will show for customers everywhere.`;
  }
  if (drift.kind === 'late' && drift.scheduledClose) {
    return `You're open past your scheduled hours (${formatHoursClock(drift.scheduledClose)}). Please update your operational timing. The new hours will show for customers everywhere.`;
  }
  return `You're open outside your operational hours. ${drift.dayLabel} is marked closed. Please update your operational timing so the new hours show everywhere.`;
}

function driftKey(drift: HoursDrift): string {
  return [
    drift.date,
    drift.kind,
    drift.slotIndex,
    drift.scheduledOpen ?? '',
    drift.scheduledClose ?? '',
  ].join('|');
}

export function HoursDriftPrompt() {
  const restaurant = useMyRestaurantId();
  const restaurantId = restaurant.data?.id ?? '';
  const dutyQuery = useKitchenDuty(restaurantId, Boolean(restaurantId));
  const duty = dutyQuery.data;
  const storeOnline =
    isListingLive(duty?.status) &&
    duty?.duty === 'online' &&
    duty.isOnline === true;
  const outsideHours = storeOnline && duty?.openNow === false;

  const timingsQuery = useOutletTimings(restaurantId, outsideHours);
  const specialQuery = useOutletSpecialHours(restaurantId, outsideHours);
  const settings = useRestaurantSettingsMutations(restaurantId);
  const calendar = useOutletCalendarMutations(restaurantId);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!outsideHours) return;
    const timer = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [outsideHours]);

  const hoursReady = timingsQuery.isSuccess && (specialQuery.isSuccess || specialQuery.isError);
  const drift = useMemo(
    () =>
      outsideHours && hoursReady
        ? detectHoursDrift({
            week: timingsQuery.data?.week,
            holidays: timingsQuery.data?.holidays,
            specialDays: specialQuery.data?.days,
            now: new Date(nowTick),
          })
        : null,
    [
      outsideHours,
      hoursReady,
      timingsQuery.data,
      specialQuery.data?.days,
      nowTick,
    ],
  );

  const key = drift ? driftKey(drift) : null;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [open, setOpen] = useState('09:00');
  const [close, setClose] = useState('22:00');
  const [error, setError] = useState<string | null>(null);
  const suggestion = useRef<{ open: string; close: string } | null>(null);

  useEffect(() => {
    if (storeOnline) return;
    setDismissedKey(null);
  }, [storeOnline]);

  useEffect(() => {
    if (!drift) {
      suggestion.current = null;
      return;
    }
    const previous = suggestion.current;
    setOpen((current) =>
      !previous || current === previous.open ? drift.open : current,
    );
    setClose((current) =>
      !previous || current === previous.close ? drift.close : current,
    );
    suggestion.current = { open: drift.open, close: drift.close };
  }, [drift]);

  const visible = Boolean(drift && key && dismissedKey !== key);
  const saving =
    settings.updateTimings.isPending || calendar.updateSpecialHours.isPending;

  const save = async () => {
    if (!drift || !timingsQuery.data?.week) return;
    if (!TIME_RE.test(open) || !TIME_RE.test(close)) {
      setError('Use 24-hour IST times like 09:00 and 23:30.');
      return;
    }
    if (open === close) {
      setError('Opening and closing times need to be different.');
      return;
    }
    const slots = slotsAfterDriftEdit(drift, open, close);
    const week = {
      ...timingsQuery.data.week,
      [drift.dayKey]: { isOpen: true, slots },
    };
    setError(null);
    try {
      await settings.updateTimings.mutateAsync({ timings: week });
      if (drift.syncSpecialToday) {
        await calendar.updateSpecialHours.mutateAsync({
          date: drift.date,
          isOpen: true,
          slots,
          reason: 'Operational timing update',
        });
      }
    } catch (saveError) {
      setError(
        getApiErrorMessage(saveError, 'Could not update operational timing.'),
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => key && setDismissedKey(key)}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Clock3 color={authTheme.brand} size={22} />
          </View>
          <Text style={styles.title}>Update operational timing</Text>
          <Text style={styles.body}>{drift ? driftMessage(drift) : ''}</Text>
          <Text style={styles.day}>{drift?.dayLabel} · IST</Text>
          <View style={styles.slotRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Opens</Text>
              <TextInput
                value={open}
                onChangeText={setOpen}
                placeholder="09:00"
                placeholderTextColor={authTheme.textDim}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Closes</Text>
              <TextInput
                value={close}
                onChangeText={setClose}
                placeholder="22:00"
                placeholderTextColor={authTheme.textDim}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            label="Update timing"
            loading={saving}
            onPress={() => void save()}
          />
          <Pressable
            disabled={saving}
            onPress={() => key && setDismissedKey(key)}
            style={styles.later}
          >
            <Text style={styles.laterText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
