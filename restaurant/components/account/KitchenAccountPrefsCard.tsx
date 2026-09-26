import { Bell, Mail, Phone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  formatAccountError,
  usePlatformAccountMutations,
  usePlatformPreferences,
} from '@/lib/user/account-hooks';
import type { NotificationPrefs } from '@/lib/user/account-types';

const DEFAULT_PREFS: NotificationPrefs = {
  push: true,
  sms: true,
  email: true,
};

/**
 * Push / SMS / email preference toggles (persisted on user-service).
 */
export function KitchenAccountPrefsCard() {
  const prefs = usePlatformPreferences(true);
  const { updateNotifications } = usePlatformAccountMutations();
  const [local, setLocal] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<keyof NotificationPrefs | null>(
    null
  );

  useEffect(() => {
    if (prefs.data?.notifications) {
      setLocal(prefs.data.notifications);
    }
  }, [prefs.data?.notifications]);

  const patch = async (
    key: keyof NotificationPrefs,
    value: boolean
  ) => {
    const previous = local;
    const next = { ...local, [key]: value };
    setLocal(next);
    setError(null);
    setSavingKey(key);
    try {
      const saved = await updateNotifications.mutateAsync(next);
      setLocal(saved.notifications);
    } catch (err) {
      setLocal(previous);
      setError(
        formatAccountError(err, 'Could not save notification preferences.')
      );
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Bell color={authTheme.brand} size={16} />
        <Text style={styles.cardTitle}>Notification preferences</Text>
      </View>
      <Text style={styles.hint}>
        Choose how Tokajo contacts you for account alerts. Changes save on this
        phone immediately.
      </Text>

      {prefs.isLoading && !prefs.data ? (
        <ActivityIndicator color={authTheme.brand} />
      ) : prefs.isError && !prefs.data ? (
        <Pressable onPress={() => void prefs.refetch()}>
          <Text style={styles.linkText}>
            {formatAccountError(
              prefs.error,
              'Could not load preferences. Tap to retry'
            )}
          </Text>
        </Pressable>
      ) : (
        <>
          <PrefToggle
            icon={Bell}
            label="Push"
            hint="Alerts on this Android / iOS phone"
            value={local.push}
            busy={savingKey === 'push'}
            onChange={(push) => void patch('push', push)}
          />
          <PrefToggle
            icon={Phone}
            label="SMS"
            hint="OTP and important account texts"
            value={local.sms}
            busy={savingKey === 'sms'}
            onChange={(sms) => void patch('sms', sms)}
          />
          <PrefToggle
            icon={Mail}
            label="Email"
            hint="Verification and account mail"
            value={local.email}
            busy={savingKey === 'email'}
            onChange={(email) => void patch('email', email)}
          />
        </>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function PrefToggle({
  icon: Icon,
  label,
  hint,
  value,
  busy,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  hint: string;
  value: boolean;
  busy?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.prefRow}>
      <Icon color={authTheme.textMuted} size={16} />
      <View style={styles.prefCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.meta}>{hint}</Text>
      </View>
      {busy ? (
        <ActivityIndicator color={authTheme.brand} size="small" />
      ) : null}
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={busy}
        style={Platform.OS === 'android' ? styles.androidSwitch : undefined}
        trackColor={{ false: '#E2E8F0', true: 'rgba(122,14,34,0.45)' }}
        thumbColor={
          Platform.OS === 'android'
            ? value
              ? authTheme.brand
              : '#F8FAFC'
            : value
              ? '#FFFFFF'
              : '#F8FAFC'
        }
        ios_backgroundColor="#E2E8F0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 14,
    gap: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: authTheme.textMuted,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    minHeight: 52,
  },
  prefCopy: { flex: 1 },
  rowLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 16,
  },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.error,
  },
  androidSwitch: {
    transform: [{ scaleX: 1.05 }, { scaleY: 1.05 }],
  },
});
