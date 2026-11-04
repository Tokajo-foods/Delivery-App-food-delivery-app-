import { useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';

import { BreakTimePanel } from '@/components/delivery/home/BreakTimePanel';
import { dutyStyles as styles } from '@/components/delivery/home/duty-control-styles';
import { partnerAvailabilityKeys } from '@/lib/delivery-partner/availability-hooks';
import {
  breakExtendMinutes,
  breakSecondsLeft,
  DEFAULT_BREAK_MINUTES,
  formatDutyKm,
  formatMinutes,
  MAX_BREAK_MINUTES,
  MAX_BREAK_MINUTES_PER_DAY,
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

function clockFromIso(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
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
  const copy = statusCopy(dutyStatus, isOnDuty);
  const maxSingleMinutes =
    policy?.maxSingleMinutes ?? snapshot?.break?.maxSingleMinutes ?? MAX_BREAK_MINUTES;
  const remainingTodayMinutes =
    snapshot?.break?.minutesRemainingToday ??
    policy?.maxMinutesPerDay ??
    MAX_BREAK_MINUTES_PER_DAY;
  const defaultMinutes =
    policy?.defaultMinutes ?? snapshot?.break?.defaultMinutes ?? DEFAULT_BREAK_MINUTES;
  const extendBy = breakExtendMinutes(snapshot?.break, policy);

  const queryClient = useQueryClient();
  const [tick, setTick] = useState(0);
  const expiredRefetched = useRef<string | null>(null);

  useEffect(() => {
    if (!onBreak) return;
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [onBreak]);

  const secondsLeft = useMemo(() => {
    void tick;
    return breakSecondsLeft(snapshot?.break);
  }, [snapshot?.break, tick]);

  const breakKey = snapshot?.break?.expiresAt ?? null;
  useEffect(() => {
    if (!onBreak || secondsLeft == null || secondsLeft > 0) return;
    if (expiredRefetched.current === breakKey) return;
    expiredRefetched.current = breakKey;
    void queryClient.invalidateQueries({ queryKey: partnerAvailabilityKeys.status() });
    void queryClient.invalidateQueries({ queryKey: partnerAvailabilityKeys.dutySummary() });
  }, [onBreak, secondsLeft, breakKey, queryClient]);

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
            <View style={styles.breakHead}>
              <Text style={styles.breakLabel}>{breakWindow || 'Break in progress'}</Text>
              {secondsLeft != null ? (
                <Text style={styles.countdown}>
                  {secondsLeft > 0 ? formatCountdown(secondsLeft) : 'Ending…'}
                </Text>
              ) : null}
            </View>
            <View style={styles.timeRow}>
              <Pressable
                onPress={onEndBreak}
                disabled={breakBusy}
                style={[styles.endBtn, { flex: 1 }]}
              >
                {breakBusy ? (
                  <ActivityIndicator color="#C2410C" size="small" />
                ) : (
                  <Text style={styles.endBtnText}>End break</Text>
                )}
              </Pressable>
              {extendBy > 0 ? (
                <Pressable
                  onPress={() => onExtendBreak(extendBy)}
                  disabled={breakBusy}
                  style={[styles.timeBtn, { justifyContent: 'center' }]}
                >
                  <Text style={styles.timeValue}>+{extendBy} min</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.note}>New orders are paused until you end the break.</Text>
          </View>
        ) : null}

        {isOnDuty && !onDelivery && !onBreak ? (
          <BreakTimePanel
            maxSingleMinutes={maxSingleMinutes}
            remainingTodayMinutes={remainingTodayMinutes}
            defaultMinutes={defaultMinutes}
            busy={breakBusy}
            onStart={onStartBreak}
          />
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

    </View>
  );
}
