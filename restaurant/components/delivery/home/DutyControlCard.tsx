import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { RotateCcw } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';

import { dutyStyles as styles } from '@/components/delivery/home/duty-control-styles';
import {
  breakExtendMinutes,
  breakSecondsLeft,
  canAcceptOffers,
  formatDutyKm,
  formatMinutes,
  type PartnerBreakPolicy,
  type PartnerDutyStatus,
  type PartnerDutyStatusSnapshot,
  type PartnerDutySummary,
} from '@/lib/delivery-partner/availability-types';

type Props = {
  snapshot?: PartnerDutyStatusSnapshot | null;
  fallbackStatus?: PartnerDutyStatus;
  isOnDuty: boolean;
  summary?: PartnerDutySummary | null;
  policy?: PartnerBreakPolicy | null;
  statusLoading?: boolean;
  statusError?: string | null;
  onRetryStatus?: () => void;
  togglePending?: boolean;
  breakBusy?: boolean;
  resumeBusy?: boolean;
  onToggle: () => void;
  onStartBreak: (durationMinutes: number) => void;
  onEndBreak: () => void;
  onExtendBreak: (additionalMinutes: number) => void;
  onLeaveHub: () => void;
  onOpenHubs: () => void;
  gpsBanner?: string | null;
  actionError?: string | null;
  summaryError?: string | null;
  onRetrySummary?: () => void;
};

function clockLabel(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function clockFromIso(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return clockLabel(date);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function statusCopy(status: PartnerDutyStatus | undefined, onDuty: boolean) {
  switch (status) {
    case 'online':
      return { title: 'Accepting orders', hint: 'New offers can reach you' };
    case 'on_delivery':
      return { title: 'With customer', hint: 'Finish this trip before a break' };
    case 'on_break':
      return { title: 'On a break', hint: 'Orders are paused' };
    case 'on_way_to_hub':
      return { title: 'Heading to hub', hint: 'Orders stay paused until you are back' };
    default:
      return onDuty
        ? { title: 'Accepting orders', hint: 'New offers can reach you' }
        : { title: 'Offline', hint: 'Go online to accept orders' };
  }
}

export function DutyControlCard({
  snapshot,
  fallbackStatus,
  isOnDuty,
  summary,
  policy,
  statusLoading,
  statusError,
  onRetryStatus,
  togglePending,
  breakBusy,
  resumeBusy,
  onToggle,
  onStartBreak,
  onEndBreak,
  onExtendBreak,
  onLeaveHub,
  onOpenHubs,
  gpsBanner,
  actionError,
  summaryError,
  onRetrySummary,
}: Props) {
  const dutyStatus = snapshot?.dutyStatus ?? fallbackStatus;
  const onDelivery = dutyStatus === 'on_delivery';
  const onBreak = dutyStatus === 'on_break' || Boolean(snapshot?.break?.active);
  const onWayToHub = dutyStatus === 'on_way_to_hub';
  const accepting = canAcceptOffers(dutyStatus);
  const copy = statusCopy(dutyStatus, isOnDuty);
  const maxMinutes = Math.max(
    0,
    Math.min(
      policy?.maxSingleMinutes ?? snapshot?.break?.maxSingleMinutes ?? 60,
      snapshot?.break?.minutesRemainingToday ?? policy?.maxMinutesPerDay ?? 60,
    ),
  );
  const defaultMinutes = Math.min(policy?.defaultMinutes ?? 30, maxMinutes || 30);
  const extendBy = breakExtendMinutes(snapshot?.break, policy);

  const [fromTime, setFromTime] = useState(() => new Date());
  const [toTime, setToTime] = useState(() => addMinutes(new Date(), defaultMinutes));
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!onBreak) return;
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [onBreak]);

  const secondsLeft = useMemo(() => {
    void tick;
    return breakSecondsLeft(snapshot?.break);
  }, [snapshot?.break, tick]);

  const spanMinutes = Math.max(
    1,
    Math.round((toTime.getTime() - fromTime.getTime()) / 60_000),
  );
  const breakMinutes = Math.min(spanMinutes, Math.max(maxMinutes, 1));
  const breakReady = maxMinutes >= 1;

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

  const breakWindow = onBreak
    ? [clockFromIso(snapshot?.break?.startedAt), clockFromIso(snapshot?.break?.expiresAt)]
        .filter(Boolean)
        .join(' – ')
    : '';

  return (
    <View>
      {statusError ? (
        <Pressable onPress={onRetryStatus} style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{statusError}</Text>
          <View style={styles.retryChip}>
            <RotateCcw color="#FECACA" size={12} />
            <Text style={styles.retryText}>Retry</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.card}>
        <View style={styles.head}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            {statusLoading && !snapshot ? (
              <ActivityIndicator color="#EA4B14" size="small" />
            ) : (
              <>
                <Text style={styles.hint}>{copy.hint}</Text>
                <Text style={styles.title}>{copy.title}</Text>
              </>
            )}
          </View>
          <Switch
            value={isOnDuty}
            onValueChange={onToggle}
            disabled={togglePending || onDelivery}
            trackColor={{ false: '#FED7AA', true: '#EA4B14' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {onBreak ? (
          <View style={styles.breakBlock}>
            <Text style={styles.breakLabel}>
              {breakWindow || 'Break in progress'}
              {secondsLeft != null ? ` · ${Math.ceil(secondsLeft / 60)} min left` : ''}
            </Text>
            <Pressable onPress={onEndBreak} disabled={breakBusy} style={styles.endBtn}>
              {breakBusy ? (
                <ActivityIndicator color="#C2410C" size="small" />
              ) : (
                <Text style={styles.endBtnText}>End break</Text>
              )}
            </Pressable>
            {extendBy > 0 ? (
              <Pressable onPress={() => onExtendBreak(extendBy)} disabled={breakBusy}>
                <Text style={styles.note}>Add {extendBy} min</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {accepting && !onDelivery ? (
          <View style={styles.breakBlock}>
            <Text style={styles.breakLabel}>Break</Text>
            {maxMinutes < 1 ? (
              <Text style={styles.note}>Daily break limit reached.</Text>
            ) : (
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
                <Pressable
                  onPress={() => onStartBreak(breakMinutes)}
                  disabled={breakBusy || !breakReady}
                  style={[styles.startBtn, !breakReady && { opacity: 0.45 }]}
                >
                  {breakBusy ? (
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
            )}
          </View>
        ) : null}

        {onWayToHub ? (
          <View style={styles.breakBlock}>
            <Pressable onPress={onLeaveHub} disabled={resumeBusy} style={styles.endBtn}>
              {resumeBusy ? (
                <ActivityIndicator color="#C2410C" size="small" />
              ) : (
                <Text style={styles.endBtnText}>
                  {snapshot?.hub?.checkedInAt ? 'Check out and go online' : 'Cancel and go online'}
                </Text>
              )}
            </Pressable>
            <Pressable onPress={onOpenHubs}>
              <Text style={styles.note}>Open hubs</Text>
            </Pressable>
          </View>
        ) : null}

        {gpsBanner ? <Text style={styles.gpsBanner}>{gpsBanner}</Text> : null}
        {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

        <View style={styles.summaryRow}>
          {summaryError ? (
            <Pressable onPress={onRetrySummary} style={styles.summaryError}>
              <Text style={styles.summaryErrorText}>{summaryError}</Text>
              <Text style={styles.summaryRetry}>Retry</Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryValue}>{formatMinutes(summary?.onlineMinutes)}</Text>
                <Text style={styles.summaryLabel}>Online today</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryValue}>{summary?.deliveries ?? 0}</Text>
                <Text style={styles.summaryLabel}>Trips</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryValue}>{formatDutyKm(summary?.km)}</Text>
                <Text style={styles.summaryLabel}>Distance</Text>
              </View>
            </>
          )}
        </View>
      </View>

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
