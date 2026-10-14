import { CloudRain, PauseCircle, Store, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import {
  useKitchenDuty,
  useKitchenDutyMutations,
  useKitchenSurge,
} from '@/lib/restaurant/hooks';
import { isListingLive } from '@/lib/restaurant/listing-status';
import type { PauseReasonCode } from '@/lib/restaurant/types';

import {
  KitchenDutyPauseBody,
  PAUSE_MINUTES,
  pauseReasonLabel,
  remainingPause,
} from './KitchenDutyPause';
import { styles } from './kitchen-duty-card-styles';

type Props = {
  restaurantId: string;
  onHoursPress?: () => void;
  compact?: boolean;
};

export function KitchenDutyCard({
  restaurantId,
  onHoursPress,
  compact = false,
}: Props) {
  const dutyQuery = useKitchenDuty(restaurantId, Boolean(restaurantId));
  const surgeQuery = useKitchenSurge(restaurantId, Boolean(restaurantId));
  const mutations = useKitchenDutyMutations(restaurantId);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [minutes, setMinutes] = useState<(typeof PAUSE_MINUTES)[number]>(30);
  const [reason, setReason] = useState<PauseReasonCode>('too_busy');

  const duty = dutyQuery.data;
  const listingLive = isListingLive(duty?.status);
  const paused = duty?.duty === 'paused';
  const adminForcedOffline = Boolean(duty?.forceOfflineReason?.trim());
  const online = duty?.duty === 'online' && duty.isOnline === true;
  const storeOn = online || paused;
  const busy =
    mutations.goOnline.isPending ||
    mutations.goOffline.isPending ||
    mutations.pauseDuty.isPending;

  const headline = useMemo(() => {
    if (!duty) return 'Store status';
    if (!listingLive) return 'Listing not live';
    if (adminForcedOffline) return 'Admin forced offline';
    if (paused) return 'Temporarily paused';
    if (online) return duty.openNow ? 'Store is open' : 'Online · outside hours';
    return 'Store is closed';
  }, [duty, listingLive, online, paused, adminForcedOffline]);

  const subtitle = useMemo(() => {
    if (!duty) return 'Checking store status…';
    if (!listingLive) {
      return compact
        ? 'Admin must approve before you can accept orders.'
        : 'Admin must approve this outlet before you can accept orders.';
    }
    if (adminForcedOffline) {
      return duty?.forceOfflineReason
        ? `Ops: ${duty.forceOfflineReason}`
        : 'Ops took this outlet offline. Check notifications for the remark.';
    }
    if (paused) {
      const left = remainingPause(duty.pausedUntil);
      return compact
        ? `${pauseReasonLabel(duty.pauseReason)}${left ? ` · ${left}` : ''}`
        : `${pauseReasonLabel(duty.pauseReason)}${left ? ` · ${left}` : ''}. In-flight orders continue.`;
    }
    if (online) {
      if (duty.openNow) {
        return 'Customers can place orders right now.';
      }
      return compact
        ? 'Online, but outside weekly hours'
        : 'You are online, but weekly hours say closed. Update hours if you want orders.';
    }
    return compact
      ? 'New orders are paused.'
      : 'New orders are stopped. In-flight orders still continue.';
  }, [compact, duty, listingLive, online, paused, adminForcedOffline]);

  const runDuty = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (error) {
      Alert.alert(
        'Could not update store',
        getApiErrorMessage(error, 'Could not update store status')
      );
    }
  };

  const onToggle = (next: boolean) => {
    if (!listingLive) {
      Alert.alert(
        'Listing not live',
        'Admin must approve this restaurant before you can go online.'
      );
      return;
    }
    if (next && adminForcedOffline) {
      Alert.alert(
        'Admin forced offline',
        duty?.forceOfflineReason
          ?? 'Ops took this outlet offline. Wait for them to resume.'
      );
      return;
    }
    if (next) {
      void runDuty(() => mutations.goOnline.mutateAsync());
      return;
    }
    Alert.alert(
      'Go offline?',
      'New orders will stop. Orders already in the kitchen keep going.',
      [
        { text: 'Stay online', style: 'cancel' },
        {
          text: 'Go offline',
          style: 'destructive',
          onPress: () => void runDuty(() => mutations.goOffline.mutateAsync()),
        },
      ]
    );
  };

  const onPause = () => {
    if (!listingLive) {
      Alert.alert(
        'Listing not live',
        'Admin must approve this restaurant before you can pause.'
      );
      return;
    }
    if (!storeOn) {
      Alert.alert(
        'Go online first',
        'Pause only works while the store is online.'
      );
      return;
    }
    void runDuty(async () => {
      await mutations.pauseDuty.mutateAsync({ minutes, reason });
      setPauseOpen(false);
    });
  };

  const surge = surgeQuery.data;
  const showSurgeChip = Boolean(surge?.assigned && surge.surgeActive);
  const showSurgeDown = surge?.unavailable === true;
  const showHoursChip =
    !compact && Boolean(duty?.openNow && listingLive && !online);

  return (
    <View
      style={[
        styles.card,
        storeOn && listingLive && !paused ? styles.cardOpen : null,
        paused ? styles.cardPaused : null,
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: paused
                ? '#FFF1E8'
                : storeOn
                  ? '#FFF1E8'
                  : '#F6F3F0',
            },
          ]}
        >
          {paused ? (
            <PauseCircle color="#EA4B14" size={20} />
          ) : storeOn ? (
            <Store color="#EA4B14" size={20} />
          ) : (
            <WifiOff color={authTheme.textMuted} size={20} />
          )}
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.kicker}>
            {online && duty?.openNow
              ? 'Accepting orders'
              : paused
                ? 'Paused'
                : 'Not accepting'}
          </Text>
          <Text style={styles.headline}>{headline}</Text>
        </View>
        {dutyQuery.isLoading && !duty ? (
          <ActivityIndicator color={authTheme.brand} />
        ) : (
          <Switch
            value={storeOn}
            onValueChange={onToggle}
            disabled={busy || !listingLive || adminForcedOffline}
            trackColor={{ false: '#E7E5E4', true: 'rgba(234, 75, 20, 0.45)' }}
            thumbColor={storeOn ? '#EA4B14' : '#F8FAFC'}
          />
        )}
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>

      {showSurgeChip || showSurgeDown || showHoursChip ? (
        <View style={styles.chipRow}>
          {showSurgeChip ? (
            <View style={styles.surgeChip}>
              <CloudRain color="#EA4B14" size={13} />
              <Text style={styles.surgeText}>
                {surge?.reason === 'zone_surge' ? 'Rain / surge' : 'Zone surge'} ·{' '}
                {Number(surge?.surgeMultiplier ?? 1).toFixed(1)}x
                {surge?.name ? ` · ${surge.name}` : ''}
              </Text>
            </View>
          ) : null}
          {showSurgeDown ? (
            <View style={styles.mutedChip}>
              <Text style={styles.mutedChipText}>Surge unavailable</Text>
            </View>
          ) : null}
          {showHoursChip ? (
            <View style={styles.openChip}>
              <Store color="#EA4B14" size={13} />
              <Text style={styles.openChipText}>Within hours</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <KitchenDutyPauseBody
        listingLive={listingLive}
        storeOn={storeOn}
        paused={paused}
        pauseOpen={pauseOpen}
        minutes={minutes}
        reason={reason}
        compact={compact}
        busy={busy}
        onMinutes={setMinutes}
        onReason={setReason}
        onPause={onPause}
        onResume={() => void runDuty(() => mutations.goOnline.mutateAsync())}
      />

      <View style={styles.footer}>
        {listingLive && storeOn && !paused ? (
          <Pressable
            onPress={() => setPauseOpen((open) => !open)}
            disabled={busy}
            style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
          >
            <PauseCircle color="#EA4B14" size={15} />
            <Text style={styles.linkText}>
              {pauseOpen ? 'Hide pause' : 'Pause orders'}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
        {onHoursPress ? (
          <Pressable
            onPress={onHoursPress}
            style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>Opening hours</Text>
          </Pressable>
        ) : null}
      </View>

      {dutyQuery.isError && !duty ? (
        <Pressable onPress={() => void dutyQuery.refetch()} style={styles.linkBtn}>
          <Text style={styles.errorText}>
            {getApiErrorMessage(dutyQuery.error, 'Could not load store status')}
            {' · '}
            Tap to retry
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
