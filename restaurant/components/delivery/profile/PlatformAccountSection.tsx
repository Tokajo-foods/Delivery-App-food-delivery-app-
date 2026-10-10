export { ContactChangeModal } from '@/components/account/ContactChangeModal';

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

import { PlatformAccountDeleteRow } from '@/components/delivery/profile/PlatformAccountDeleteRow';
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

export function PlatformAccountSection() {
  const prefs = usePlatformPreferences(true);
  const { updateNotifications } = usePlatformAccountMutations();
  const [local, setLocal] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<keyof NotificationPrefs | null>(
    null
  );

  useEffect(() => {
    if (prefs.data?.notifications) setLocal(prefs.data.notifications);
  }, [prefs.data?.notifications]);

  const patchNotifications = async (
    key: keyof NotificationPrefs,
    value: boolean
  ) => {
    const previous = local;
    const next = { ...local, [key]: value };
    setLocal(next);
    setPrefsError(null);
    setSavingKey(key);
    try {
      const saved = await updateNotifications.mutateAsync(next);
      setLocal(saved.notifications);
    } catch (err) {
      setLocal(previous);
      setPrefsError(
        formatAccountError(err, 'Could not save notification prefs.')
      );
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>

      {prefs.isLoading && !prefs.data ? (
        <ActivityIndicator color="#EA4B14" style={{ marginVertical: 12 }} />
      ) : prefs.isError && !prefs.data ? (
        <Pressable onPress={() => void prefs.refetch()} style={styles.retry}>
          <Text style={styles.retryText}>
            {formatAccountError(
              prefs.error,
              'Could not load preferences. Retry'
            )}
          </Text>
        </Pressable>
      ) : (
        <>
          <PrefToggle
            icon={Bell}
            label="Push"
            hint="Order offers and duty alerts"
            value={local.push}
            busy={savingKey === 'push'}
            onChange={(push) => void patchNotifications('push', push)}
          />
          <PrefToggle
            icon={Phone}
            label="SMS"
            hint="OTP and important account texts"
            value={local.sms}
            busy={savingKey === 'sms'}
            onChange={(sms) => void patchNotifications('sms', sms)}
          />
          <PrefToggle
            icon={Mail}
            label="Email"
            hint="Receipts and verification mail"
            value={local.email}
            busy={savingKey === 'email'}
            onChange={(email) => void patchNotifications('email', email)}
          />
        </>
      )}
      {prefsError ? <Text style={styles.error}>{prefsError}</Text> : null}

      <View style={styles.divider} />
      <PlatformAccountDeleteRow />
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
      <Icon color="#64748B" size={16} />
      <View style={{ flex: 1 }}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefHint}>{hint}</Text>
      </View>
      {busy ? <ActivityIndicator color="#EA4B14" size="small" /> : null}
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={busy}
        style={Platform.OS === 'android' ? styles.androidSwitch : undefined}
        trackColor={{ false: '#E5E7EB', true: '#FDBA74' }}
        thumbColor={
          Platform.OS === 'android'
            ? value
              ? '#EA4B14'
              : '#F9FAFB'
            : value
              ? '#FFFFFF'
              : '#F9FAFB'
        }
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 4,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    minHeight: 52,
  },
  prefLabel: { fontFamily: fonts.semiBold, fontSize: 14, color: '#111827' },
  prefHint: { fontFamily: fonts.medium, fontSize: 11, color: '#6B7280' },
  error: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#B91C1C',
  },
  retry: { paddingVertical: 8 },
  retryText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#EA4B14' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  androidSwitch: {
    transform: [{ scaleX: 1.05 }, { scaleY: 1.05 }],
  },
});
