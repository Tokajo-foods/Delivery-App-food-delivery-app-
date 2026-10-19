import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { kitchenInboxStyles as styles } from '@/components/dashboard/restaurant-notifications-styles';
import { authTheme } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import {
  useNotificationChannelPreferences,
  useNotificationDevices,
  useUpdateNotificationChannelPreferences,
} from '@/lib/notification/hooks';
import type {
  NotificationChannelPreferences,
  NotificationPushDevice,
} from '@/lib/notification/types';

type ChannelKey = keyof NotificationChannelPreferences;

const CHANNELS: Array<{ key: ChannelKey; label: string; sub: string }> = [
  { key: 'ordersPush', label: 'Orders & account', sub: 'New orders, KYC and go-live updates' },
  { key: 'offersPush', label: 'Offers', sub: 'Platform offer announcements' },
  { key: 'promoPush', label: 'Promotions', sub: 'Marketing from Tokajo' },
  { key: 'sms', label: 'SMS', sub: 'Text messages to your phone' },
  { key: 'whatsapp', label: 'WhatsApp', sub: 'Messages on WhatsApp' },
  { key: 'email', label: 'Email', sub: 'Messages to your email' },
];

function deviceLabel(row: NotificationPushDevice): string {
  const os = row.platform === 'ios' ? 'iPhone' : row.platform === 'android' ? 'Android' : 'Device';
  return row.tokenMasked ? `${os} · ${row.tokenMasked}` : os;
}

/** Channel switches + registered phones for the kitchen account (notification-service). */
export function KitchenNotificationSettings({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const prefs = useNotificationChannelPreferences(enabled);
  const update = useUpdateNotificationChannelPreferences();
  const devices = useNotificationDevices(enabled);

  const setChannel = async (key: ChannelKey, value: boolean) => {
    if (!prefs.data) return;
    try {
      await update.mutateAsync({ ...prefs.data, [key]: value });
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error, 'Try again.'));
    }
  };

  const deviceRows = devices.data ?? [];

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notification settings</Text>
        {prefs.isLoading && !prefs.data ? (
          <ActivityIndicator color={authTheme.brand} />
        ) : prefs.isError && !prefs.data ? (
          <Pressable onPress={() => void prefs.refetch()}>
            <Text style={styles.retryTextInline}>
              {getApiErrorMessage(prefs.error, 'Could not load settings.')} Tap to retry.
            </Text>
          </Pressable>
        ) : (
          CHANNELS.map(({ key, label, sub }) => (
            <View key={key} style={styles.prefRow}>
              <View style={styles.prefText}>
                <Text style={styles.prefLabel}>{label}</Text>
                <Text style={styles.prefSub}>{sub}</Text>
              </View>
              <Switch
                value={prefs.data?.[key] ?? false}
                onValueChange={(next) => void setChannel(key, next)}
                disabled={update.isPending}
                trackColor={{ false: '#E2E8F0', true: 'rgba(122,14,34,0.35)' }}
                thumbColor={prefs.data?.[key] ? authTheme.brand : '#F8FAFC'}
              />
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Phones receiving alerts</Text>
        {devices.isLoading && !devices.data ? (
          <ActivityIndicator color={authTheme.brand} />
        ) : devices.isError && !devices.data ? (
          <Pressable onPress={() => void devices.refetch()}>
            <Text style={styles.retryTextInline}>
              {getApiErrorMessage(devices.error, 'Could not load devices.')} Tap to retry.
            </Text>
          </Pressable>
        ) : deviceRows.length === 0 ? (
          <Pressable onPress={() => router.push('/settings')}>
            <Text style={styles.cardHint}>
              No phone is set up yet. Turn on order alerts in Settings to get pushes on this phone.
            </Text>
          </Pressable>
        ) : (
          deviceRows.map((row) => (
            <Text key={row.deviceId} style={styles.deviceLine}>
              {deviceLabel(row)}
            </Text>
          ))
        )}
      </View>
    </>
  );
}
